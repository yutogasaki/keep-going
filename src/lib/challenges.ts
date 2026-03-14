import { EXERCISES } from '../data/exercises';
import { PRESET_GROUPS } from '../data/menuGroups';
import { getAllSessions, getTodayKey } from './db';
import {
    countChallengeProgressFromSessions,
    getChallengeDaysLeft as getDaysLeftFromWindowEnd,
    getRollingWindowEndDate,
    resolveChallengeWindow,
    type ChallengeProgressWindow,
} from './challenge-engine';
import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync/authState';
import type { TeacherExercise } from './teacherContent';
import { CANONICAL_TERMS } from './terminology';

export type ChallengeType = 'exercise' | 'menu' | 'duration';
export type ChallengeMenuSource = 'teacher' | 'preset';
export type ChallengeCountUnit = 'exercise_completion' | 'menu_completion';
export type ChallengeTier = 'small' | 'big';
export type ChallengeRewardKind = 'star' | 'medal';
export type ChallengeWindowType = 'calendar' | 'rolling';
export type ChallengeGoalType = 'total_count' | 'active_day';

export interface Challenge {
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    challengeType: ChallengeType;
    exerciseId: string | null;
    targetMenuId: string | null;
    menuSource: ChallengeMenuSource | null;
    targetCount: number;
    dailyCap: number;
    countUnit: ChallengeCountUnit;
    startDate: string;
    endDate: string;
    windowType: ChallengeWindowType;
    goalType: ChallengeGoalType;
    windowDays: number | null;
    requiredDays: number | null;
    dailyMinimumMinutes: number | null;
    createdBy: string;
    rewardKind: ChallengeRewardKind;
    rewardValue: number;
    rewardFuwafuwaType: number | null;
    tier: ChallengeTier;
    iconEmoji: string | null;
    classLevels: string[];
    createdAt: string;
}

export interface ChallengeCompletion {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    completedAt: string;
}

export interface ChallengeEnrollment {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    joinedAt: string;
    effectiveStartDate: string;
    effectiveEndDate: string;
    createdAt: string;
}

export interface ChallengeEnrollmentState {
    joinedChallengeIds: Record<string, string[]>;
    challengeEnrollmentWindows: Record<string, Record<string, ChallengeProgressWindow>>;
}

export interface ChallengeWriteInput {
    title: string;
    summary: string | null;
    description: string | null;
    challengeType: ChallengeType;
    exerciseId: string | null;
    targetMenuId: string | null;
    menuSource: ChallengeMenuSource | null;
    targetCount: number;
    dailyCap: number;
    countUnit: ChallengeCountUnit;
    startDate: string;
    endDate: string;
    windowType: ChallengeWindowType;
    goalType: ChallengeGoalType;
    windowDays: number | null;
    requiredDays: number | null;
    dailyMinimumMinutes: number | null;
    createdBy?: string;
    rewardKind: ChallengeRewardKind;
    rewardValue: number;
    tier: ChallengeTier;
    iconEmoji: string | null;
    classLevels: string[];
}

function normalizeChallengeType(value: string | null | undefined): ChallengeType {
    return value === 'menu' || value === 'duration' ? value : 'exercise';
}

function normalizeMenuSource(value: string | null | undefined): ChallengeMenuSource | null {
    return value === 'teacher' || value === 'preset'
        ? value
        : null;
}

function normalizeCountUnit(value: string | null | undefined, challengeType: ChallengeType): ChallengeCountUnit {
    if (value === 'menu_completion' || value === 'exercise_completion') {
        return value;
    }

    return challengeType === 'menu' ? 'menu_completion' : 'exercise_completion';
}

function normalizeRewardKind(value: string | null | undefined): ChallengeRewardKind {
    return value === 'star' ? 'star' : 'medal';
}

function normalizeTier(value: string | null | undefined): ChallengeTier {
    return value === 'small' ? 'small' : 'big';
}

function normalizeWindowType(value: string | null | undefined): ChallengeWindowType {
    return value === 'rolling' ? 'rolling' : 'calendar';
}

function normalizeGoalType(value: string | null | undefined): ChallengeGoalType {
    return value === 'active_day' ? 'active_day' : 'total_count';
}

function mapChallenge(row: Database['public']['Tables']['challenges']['Row']): Challenge {
    const challengeType = normalizeChallengeType(row.challenge_type);
    const rewardKind = normalizeRewardKind(row.reward_kind);
    const rewardValue = row.reward_value ?? row.reward_fuwafuwa_type ?? 0;
    const exerciseId = row.target_exercise_id ?? row.exercise_id;
    const goalType = normalizeGoalType(row.goal_type);

    return {
        id: row.id,
        title: row.title,
        summary: row.summary ?? row.title,
        description: row.description ?? null,
        challengeType,
        exerciseId,
        targetMenuId: row.target_menu_id ?? null,
        menuSource: normalizeMenuSource(row.menu_source),
        targetCount: row.target_count,
        dailyCap: row.daily_cap ?? 1,
        countUnit: normalizeCountUnit(row.count_unit, challengeType),
        startDate: row.start_date,
        endDate: row.end_date,
        windowType: normalizeWindowType(row.window_type),
        goalType,
        windowDays: row.window_days ?? null,
        requiredDays: goalType === 'active_day'
            ? (row.required_days ?? row.target_count)
            : (row.required_days ?? null),
        dailyMinimumMinutes: row.daily_minimum_minutes ?? null,
        createdBy: row.created_by,
        rewardKind,
        rewardValue,
        rewardFuwafuwaType: rewardKind === 'medal' ? rewardValue : null,
        tier: normalizeTier(row.tier),
        iconEmoji: row.icon_emoji ?? null,
        classLevels: row.class_levels ?? [],
        createdAt: row.created_at,
    };
}

function mapChallengeEnrollment(
    row: Database['public']['Tables']['challenge_enrollments']['Row'],
): ChallengeEnrollment {
    return {
        id: row.id,
        challengeId: row.challenge_id,
        accountId: row.account_id,
        memberId: row.member_id,
        joinedAt: row.joined_at,
        effectiveStartDate: row.effective_start_date,
        effectiveEndDate: row.effective_end_date,
        createdAt: row.created_at,
    };
}

function toChallengeRowBase(input: ChallengeWriteInput) {
    const rewardValue = Math.max(0, input.rewardValue);
    return {
        title: input.title,
        exercise_id: input.exerciseId ?? 'S01',
        target_exercise_id: input.challengeType === 'exercise' ? input.exerciseId ?? 'S01' : null,
        target_menu_id: input.challengeType === 'menu' ? input.targetMenuId : null,
        challenge_type: input.challengeType,
        menu_source: input.challengeType === 'menu' ? input.menuSource : null,
        target_count: input.targetCount,
        daily_cap: input.dailyCap,
        count_unit: input.countUnit,
        start_date: input.startDate,
        end_date: input.endDate,
        window_type: input.windowType,
        goal_type: input.goalType,
        window_days: input.windowType === 'rolling' ? input.windowDays : null,
        required_days: input.goalType === 'active_day' ? input.requiredDays : null,
        daily_minimum_minutes: input.goalType === 'active_day' && input.challengeType === 'duration'
            ? input.dailyMinimumMinutes
            : null,
        created_by: input.createdBy ?? '',
        reward_kind: input.rewardKind,
        reward_value: rewardValue,
        reward_fuwafuwa_type: input.rewardKind === 'medal' ? rewardValue : 0,
        tier: input.tier,
        summary: input.summary,
        description: input.description,
        icon_emoji: input.iconEmoji,
        class_levels: input.classLevels,
    };
}

function toChallengeInsertRow(input: ChallengeWriteInput): Database['public']['Tables']['challenges']['Insert'] {
    return {
        ...toChallengeRowBase(input),
        created_by: input.createdBy ?? '',
    };
}

function toChallengeUpdateRow(input: ChallengeWriteInput): Database['public']['Tables']['challenges']['Update'] {
    return toChallengeRowBase(input);
}

export function getChallengeExercise(challenge: Challenge, teacherExercises: TeacherExercise[] = []) {
    return challenge.exerciseId
        ? EXERCISES.find((item) => item.id === challenge.exerciseId)
            ?? teacherExercises.find((item) => item.id === challenge.exerciseId)
            ?? null
        : null;
}

export function getChallengeEmoji(challenge: Challenge, teacherExercises: TeacherExercise[] = []): string {
    if (challenge.challengeType === 'duration') {
        return challenge.iconEmoji ?? '⏱️';
    }

    return challenge.iconEmoji ?? getChallengeExercise(challenge, teacherExercises)?.emoji ?? '🎯';
}

export function getChallengeTargetLabel(challenge: Challenge, teacherExercises: TeacherExercise[] = []): string {
    if (challenge.challengeType === 'duration') {
        return `1日${Math.max(1, challenge.dailyMinimumMinutes ?? 3)}分以上`;
    }

    if (challenge.challengeType === 'menu') {
        if (challenge.menuSource === 'preset' && challenge.targetMenuId) {
            return PRESET_GROUPS.find((group) => group.id === challenge.targetMenuId)?.name ?? CANONICAL_TERMS.menu;
        }

        return challenge.menuSource === 'teacher' ? CANONICAL_TERMS.teacherMenu : CANONICAL_TERMS.menu;
    }

    return getChallengeExercise(challenge, teacherExercises)?.name ?? challenge.exerciseId ?? CANONICAL_TERMS.exercise;
}

export function getChallengeRewardLabel(challenge: Challenge): string {
    return challenge.rewardKind === 'star'
        ? `ほし ${challenge.rewardValue}こ`
        : 'メダル';
}

export function getChallengeGoalTarget(
    challenge: Pick<Challenge, 'goalType' | 'requiredDays' | 'targetCount'>,
): number {
    if (challenge.goalType === 'active_day') {
        return Math.max(1, challenge.requiredDays ?? challenge.targetCount);
    }

    return Math.max(1, challenge.targetCount);
}

export function getChallengeGoalLabel(
    challenge: Pick<Challenge, 'goalType' | 'requiredDays' | 'targetCount'>,
    targetLabel: string,
): string {
    const goalTarget = getChallengeGoalTarget(challenge);
    return challenge.goalType === 'active_day'
        ? `${targetLabel}を${goalTarget}日`
        : `${targetLabel}を${goalTarget}回`;
}

export function getChallengeProgressLabel(
    challenge: Pick<Challenge, 'goalType' | 'requiredDays' | 'targetCount'>,
    progress: number,
): string {
    const goalTarget = getChallengeGoalTarget(challenge);
    return challenge.goalType === 'active_day'
        ? `${progress} / ${goalTarget}日`
        : `${progress} / ${goalTarget}回`;
}

export function getChallengeDailyCapLabel(challenge: Challenge): string {
    if (challenge.goalType === 'active_day') {
        return challenge.challengeType === 'duration'
            ? '休憩をのぞいた時間でカウント'
            : '1日1回でカウント';
    }

    return `1日 ${challenge.dailyCap}回まで`;
}

export function createRollingChallengeWindow(
    challenge: Pick<Challenge, 'windowDays'>,
    startDate = getTodayKey(),
): ChallengeProgressWindow {
    const resolvedWindowDays = Math.max(1, challenge.windowDays ?? 7);

    return {
        startDate,
        endDate: getRollingWindowEndDate(startDate, resolvedWindowDays),
    };
}

export function getChallengeActiveWindow(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
): ChallengeProgressWindow {
    return resolveChallengeWindow(challenge, effectiveWindow);
}

export function getChallengePeriodLabel(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
): string {
    if (challenge.windowType === 'rolling' && !effectiveWindow) {
        return `参加してから${Math.max(1, challenge.windowDays ?? 7)}日`;
    }

    const window = getChallengeActiveWindow(challenge, effectiveWindow);
    return `${window.startDate} 〜 ${window.endDate}`;
}

export function getChallengeInviteWindowLabel(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
): string {
    if (challenge.windowType === 'rolling') {
        return `参加すると 今日から${Math.max(1, challenge.windowDays ?? 7)}日`;
    }

    const [startYear, startMonth, startDay] = challenge.startDate.split('-');
    const [, endMonth, endDay] = challenge.endDate.split('-');
    void startYear;

    return startMonth === endMonth
        ? `${Number(endMonth)}/${Number(endDay)}まで`
        : `${Number(startMonth)}/${Number(startDay)}〜${Number(endMonth)}/${Number(endDay)}`;
}

export function getChallengeDeadlineLabel(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
    now = new Date(),
): string {
    if (challenge.windowType === 'rolling' && !effectiveWindow) {
        return `参加すると 今日から${Math.max(1, challenge.windowDays ?? 7)}日`;
    }

    const window = getChallengeActiveWindow(challenge, effectiveWindow);
    const daysLeft = getDaysLeftFromWindowEnd(window.endDate, now);
    return challenge.windowType === 'rolling'
        ? `あと${daysLeft}日`
        : getChallengeInviteWindowLabel(challenge);
}

export function buildChallengeEnrollmentState(
    enrollments: ChallengeEnrollment[],
): ChallengeEnrollmentState {
    const joinedChallengeIds: Record<string, string[]> = {};
    const challengeEnrollmentWindows: Record<string, Record<string, ChallengeProgressWindow>> = {};

    for (const enrollment of enrollments) {
        joinedChallengeIds[enrollment.memberId] = [
            ...(joinedChallengeIds[enrollment.memberId] ?? []),
            enrollment.challengeId,
        ];
        challengeEnrollmentWindows[enrollment.memberId] = {
            ...(challengeEnrollmentWindows[enrollment.memberId] ?? {}),
            [enrollment.challengeId]: {
                startDate: enrollment.effectiveStartDate,
                endDate: enrollment.effectiveEndDate,
            },
        };
    }

    return {
        joinedChallengeIds,
        challengeEnrollmentWindows,
    };
}

function normalizeChallengeText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

export function getChallengeCardText(challenge: Pick<Challenge, 'title' | 'summary' | 'description'>): string | null {
    const summary = normalizeChallengeText(challenge.summary);
    if (summary && summary !== challenge.title) {
        return summary;
    }

    const description = normalizeChallengeText(challenge.description);
    if (description && description !== challenge.title) {
        return description;
    }

    return null;
}

export function getChallengeHeaderText(challenge: Pick<Challenge, 'title' | 'summary'>): string | null {
    const summary = normalizeChallengeText(challenge.summary);
    return summary && summary !== challenge.title ? summary : null;
}

export function getChallengeDescriptionText(
    challenge: Pick<Challenge, 'summary' | 'description'>,
): string | null {
    const description = normalizeChallengeText(challenge.description);
    const summary = normalizeChallengeText(challenge.summary);

    if (!description) {
        return null;
    }

    return description !== summary ? description : null;
}

// ─── Fetch challenges ───────────────────────────────

export async function fetchActiveChallenges(): Promise<Challenge[]> {
    if (!supabase) return [];

    const today = getTodayKey();
    const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[challenges] fetchActiveChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallenge);
}

export async function fetchPastChallenges(): Promise<Challenge[]> {
    if (!supabase) return [];

    const today = getTodayKey();
    const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .lt('end_date', today)
        .order('end_date', { ascending: false })
        .limit(20);

    if (error) {
        console.warn('[challenges] fetchPastChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallenge);
}

export async function fetchAllChallenges(): Promise<Challenge[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[challenges] fetchAllChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallenge);
}

// ─── Create / Delete (teacher only) ─────────────────

export async function createChallenge(data: ChallengeWriteInput): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('challenges').insert(toChallengeInsertRow(data));

    if (error) throw error;
}

export async function updateChallenge(id: string, data: ChallengeWriteInput): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('challenges').update(toChallengeUpdateRow(data)).eq('id', id);

    if (error) throw error;
}

export async function deleteChallenge(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('challenges').delete().eq('id', id);
    if (error) throw error;
}

// ─── Completions ─────────────────────────────────────

export async function fetchMyCompletions(): Promise<ChallengeCompletion[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('challenge_completions')
        .select('*')
        .eq('account_id', accountId);

    if (error) {
        console.warn('[challenges] fetchMyCompletions failed:', error);
        return [];
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        challengeId: row.challenge_id,
        accountId: row.account_id,
        memberId: row.member_id,
        completedAt: row.completed_at,
    }));
}

export async function fetchMyEnrollments(): Promise<ChallengeEnrollment[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('challenge_enrollments')
        .select('*')
        .eq('account_id', accountId);

    if (error) {
        console.warn('[challenges] fetchMyEnrollments failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallengeEnrollment);
}

export async function markChallengeJoined(
    challengeId: string,
    memberId: string,
    effectiveWindow: ChallengeProgressWindow,
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase.from('challenge_enrollments').upsert({
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
        joined_at: new Date().toISOString(),
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
    }, { onConflict: 'challenge_id,account_id,member_id' });

    if (error) throw error;
}

export async function markChallengeComplete(
    challengeId: string,
    memberId: string,
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase.from('challenge_completions').upsert({
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
    }, { onConflict: 'challenge_id,account_id,member_id' });

    if (error) throw error;
}

// ─── Progress calculation (from local sessions) ──────

export async function countChallengeProgress(
    challenge: Challenge,
    userIds: string[],
    effectiveWindow?: ChallengeProgressWindow | null,
): Promise<number> {
    const sessions = await getAllSessions();
    const window = getChallengeActiveWindow(challenge, effectiveWindow);

    return countChallengeProgressFromSessions({
        challengeType: challenge.challengeType,
        exerciseId: challenge.exerciseId,
        targetMenuId: challenge.targetMenuId,
        menuSource: challenge.menuSource,
        targetCount: getChallengeGoalTarget(challenge),
        dailyCap: challenge.dailyCap,
        countUnit: challenge.countUnit,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        windowType: challenge.windowType,
        goalType: challenge.goalType,
        windowDays: challenge.windowDays,
        dailyMinimumMinutes: challenge.dailyMinimumMinutes,
    }, sessions, userIds, window);
}
