import { EXERCISES } from '../data/exercises';
import { PRESET_GROUPS } from '../data/menuGroups';
import { getAllSessions, getTodayKey } from './db';
import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync/authState';
import { getSessionExerciseCounts, hasCompletedPlannedExercises } from './sessionRecords';

export type ChallengeType = 'exercise' | 'menu';
export type ChallengeMenuSource = 'teacher' | 'preset';
export type ChallengeCountUnit = 'exercise_completion' | 'menu_completion';
export type ChallengeTier = 'small' | 'big';
export type ChallengeRewardKind = 'star' | 'medal';

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
    createdBy?: string;
    rewardKind: ChallengeRewardKind;
    rewardValue: number;
    tier: ChallengeTier;
    iconEmoji: string | null;
    classLevels: string[];
}

function normalizeChallengeType(value: string | null | undefined): ChallengeType {
    return value === 'menu' ? 'menu' : 'exercise';
}

function normalizeMenuSource(value: string | null | undefined): ChallengeMenuSource | null {
    return value === 'teacher' || value === 'preset' ? value : null;
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

function mapChallenge(row: Database['public']['Tables']['challenges']['Row']): Challenge {
    const challengeType = normalizeChallengeType(row.challenge_type);
    const rewardKind = normalizeRewardKind(row.reward_kind);
    const rewardValue = row.reward_value ?? row.reward_fuwafuwa_type ?? 0;
    const exerciseId = row.target_exercise_id ?? row.exercise_id;

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

export function getChallengeExercise(challenge: Challenge) {
    return challenge.exerciseId
        ? EXERCISES.find((item) => item.id === challenge.exerciseId) ?? null
        : null;
}

export function getChallengeEmoji(challenge: Challenge): string {
    return challenge.iconEmoji ?? getChallengeExercise(challenge)?.emoji ?? '🎯';
}

export function getChallengeTargetLabel(challenge: Challenge): string {
    if (challenge.challengeType === 'menu') {
        if (challenge.menuSource === 'preset' && challenge.targetMenuId) {
            return PRESET_GROUPS.find((group) => group.id === challenge.targetMenuId)?.name ?? 'メニュー';
        }

        return challenge.menuSource === 'teacher' ? '先生メニュー' : 'メニュー';
    }

    return getChallengeExercise(challenge)?.name ?? challenge.exerciseId ?? '種目';
}

export function getChallengeRewardLabel(challenge: Challenge): string {
    return challenge.rewardKind === 'star'
        ? `ほし ${challenge.rewardValue}こ`
        : 'メダル';
}

export function getChallengeDailyCapLabel(challenge: Challenge): string {
    return `1日 ${challenge.dailyCap}回まで`;
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
): Promise<number> {
    if (challenge.challengeType === 'menu') {
        if (!challenge.targetMenuId || !challenge.menuSource) {
            return 0;
        }

        const sessions = await getAllSessions();
        const targetUserSet = userIds.length > 0 ? new Set(userIds) : null;
        const countsByDate = new Map<string, number>();

        for (const session of sessions) {
            if (session.date < challenge.startDate || session.date > challenge.endDate) {
                continue;
            }

            if (session.sourceMenuId !== challenge.targetMenuId || session.sourceMenuSource !== challenge.menuSource) {
                continue;
            }

            if (!hasCompletedPlannedExercises(session)) {
                continue;
            }

            if (targetUserSet && targetUserSet.size > 0) {
                const sessionUsers = session.userIds ?? [];
                if (!sessionUsers.some((userId) => targetUserSet.has(userId))) {
                    continue;
                }
            }

            countsByDate.set(session.date, (countsByDate.get(session.date) ?? 0) + 1);
        }

        return [...countsByDate.values()].reduce((sum, count) => sum + Math.min(count, challenge.dailyCap), 0);
    }

    if (!challenge.exerciseId) {
        return 0;
    }

    const sessions = await getAllSessions();
    const countsByDate = new Map<string, number>();

    for (const session of sessions) {
        if (session.date < challenge.startDate || session.date > challenge.endDate) continue;

        if (session.userIds && session.userIds.length > 0) {
            if (!session.userIds.some((uid) => userIds.includes(uid))) continue;
        }

        const nextCount = (countsByDate.get(session.date) ?? 0) + (getSessionExerciseCounts(session)[challenge.exerciseId] ?? 0);
        countsByDate.set(session.date, nextCount);
    }

    let progress = 0;
    for (const count of countsByDate.values()) {
        progress += Math.min(count, challenge.dailyCap);
    }

    return progress;
}
