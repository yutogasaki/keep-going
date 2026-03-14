import { getAllSessions, getTodayKey } from './db';
import {
    countChallengeProgressFromSessions,
    getChallengeDaysLeft,
    getRollingWindowEndDate,
    type ChallengeCountUnit,
    type ChallengeGoalType,
    type ChallengeMenuSource,
    type ChallengeProgressWindow,
    type ChallengeType,
} from './challenge-engine';
import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync/authState';

export type PersonalChallengeStatus = 'active' | 'completed' | 'ended_manual' | 'ended_expired';

export interface PersonalChallenge {
    id: string;
    accountId: string;
    memberId: string;
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
    goalType: ChallengeGoalType;
    windowDays: number;
    requiredDays: number | null;
    startedAt: string;
    effectiveStartDate: string;
    effectiveEndDate: string;
    status: PersonalChallengeStatus;
    iconEmoji: string | null;
    rewardKind: 'star';
    rewardValue: 1;
    rewardGrantedAt: string | null;
    completedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PersonalChallengeCreateInput {
    memberId: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    challengeType: ChallengeType;
    exerciseId?: string | null;
    targetMenuId?: string | null;
    menuSource?: ChallengeMenuSource | null;
    targetCount?: number;
    dailyCap?: number;
    countUnit?: ChallengeCountUnit;
    goalType?: ChallengeGoalType;
    windowDays: number;
    requiredDays?: number | null;
    startedAt?: string;
    effectiveStartDate?: string;
    iconEmoji?: string | null;
}

export interface PersonalChallengeMetaPatch {
    title?: string;
    summary?: string | null;
    description?: string | null;
    iconEmoji?: string | null;
}

export interface PersonalChallengeSetupPatch {
    challengeType?: ChallengeType;
    exerciseId?: string | null;
    targetMenuId?: string | null;
    menuSource?: ChallengeMenuSource | null;
    targetCount?: number;
    dailyCap?: number;
    countUnit?: ChallengeCountUnit;
    goalType?: ChallengeGoalType;
    windowDays?: number;
    requiredDays?: number | null;
    effectiveStartDate?: string;
}

type PersonalChallengeRow = Database['public']['Tables']['personal_challenges']['Row'];
type PersonalChallengeInsert = Database['public']['Tables']['personal_challenges']['Insert'];
type PersonalChallengeUpdate = Database['public']['Tables']['personal_challenges']['Update'];

const PERSONAL_CHALLENGE_PAST_STATUSES: PersonalChallengeStatus[] = ['completed', 'ended_manual', 'ended_expired'];

function normalizeChallengeType(value: string | null | undefined): ChallengeType {
    return value === 'menu' ? 'menu' : 'exercise';
}

function normalizeMenuSource(value: string | null | undefined): ChallengeMenuSource | null {
    return value === 'teacher' || value === 'preset' || value === 'custom' || value === 'public'
        ? value
        : null;
}

function normalizeCountUnit(
    value: string | null | undefined,
    challengeType: ChallengeType,
): ChallengeCountUnit {
    if (value === 'menu_completion' || value === 'exercise_completion') {
        return value;
    }

    return challengeType === 'menu' ? 'menu_completion' : 'exercise_completion';
}

function normalizeGoalType(value: string | null | undefined): ChallengeGoalType {
    return value === 'total_count' ? 'total_count' : 'active_day';
}

function normalizePersonalChallengeStatus(value: string | null | undefined): PersonalChallengeStatus {
    return value === 'completed' || value === 'ended_manual' || value === 'ended_expired'
        ? value
        : 'active';
}

function resolveTargetCount(
    input: Pick<PersonalChallengeCreateInput, 'goalType' | 'requiredDays' | 'targetCount'>,
): number {
    if (input.goalType === 'active_day') {
        return Math.max(1, input.requiredDays ?? input.targetCount ?? 1);
    }

    return Math.max(1, input.targetCount ?? 1);
}

export function createPersonalChallengeWindow(
    effectiveStartDate: string,
    windowDays: number,
): ChallengeProgressWindow {
    return {
        startDate: effectiveStartDate,
        endDate: getRollingWindowEndDate(effectiveStartDate, Math.max(windowDays, 1)),
    };
}

export function getPersonalChallengeGoalTarget(
    challenge: Pick<PersonalChallenge, 'goalType' | 'requiredDays' | 'targetCount'>,
): number {
    return challenge.goalType === 'active_day'
        ? Math.max(1, challenge.requiredDays ?? challenge.targetCount)
        : Math.max(1, challenge.targetCount);
}

export function getPersonalChallengeDaysLeft(
    challenge: Pick<PersonalChallenge, 'effectiveEndDate'>,
    now = new Date(),
): number {
    return getChallengeDaysLeft(challenge.effectiveEndDate, now);
}

export function toPersonalChallengeEngineInput(challenge: PersonalChallenge) {
    return {
        challengeType: challenge.challengeType,
        exerciseId: challenge.exerciseId,
        targetMenuId: challenge.targetMenuId,
        menuSource: challenge.menuSource,
        targetCount: getPersonalChallengeGoalTarget(challenge),
        dailyCap: challenge.dailyCap,
        countUnit: challenge.countUnit,
        startDate: challenge.effectiveStartDate,
        endDate: challenge.effectiveEndDate,
        windowType: 'rolling' as const,
        goalType: challenge.goalType,
        windowDays: challenge.windowDays,
        dailyMinimumMinutes: null,
    };
}

export function mapPersonalChallenge(row: PersonalChallengeRow): PersonalChallenge {
    const challengeType = normalizeChallengeType(row.challenge_type);
    const goalType = normalizeGoalType(row.goal_type);

    return {
        id: row.id,
        accountId: row.account_id,
        memberId: row.member_id,
        title: row.title,
        summary: row.summary ?? null,
        description: row.description ?? null,
        challengeType,
        exerciseId: row.target_exercise_id ?? null,
        targetMenuId: row.target_menu_id ?? null,
        menuSource: normalizeMenuSource(row.menu_source),
        targetCount: Math.max(1, row.target_count),
        dailyCap: Math.max(1, row.daily_cap),
        countUnit: normalizeCountUnit(row.count_unit, challengeType),
        goalType,
        windowDays: Math.max(1, row.window_days),
        requiredDays: goalType === 'active_day'
            ? Math.max(1, row.required_days ?? row.target_count)
            : (row.required_days ?? null),
        startedAt: row.started_at,
        effectiveStartDate: row.effective_start_date,
        effectiveEndDate: row.effective_end_date,
        status: normalizePersonalChallengeStatus(row.status),
        iconEmoji: row.icon_emoji ?? null,
        rewardKind: 'star',
        rewardValue: 1,
        rewardGrantedAt: row.reward_granted_at ?? null,
        completedAt: row.completed_at ?? null,
        endedAt: row.ended_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toPersonalChallengeInsertRow(
    input: PersonalChallengeCreateInput,
    accountId: string,
): PersonalChallengeInsert {
    const effectiveStartDate = input.effectiveStartDate ?? getTodayKey();
    const effectiveWindow = createPersonalChallengeWindow(effectiveStartDate, input.windowDays);
    const challengeType = input.challengeType;
    const goalType = input.goalType ?? 'active_day';
    const targetCount = resolveTargetCount({
        goalType,
        requiredDays: input.requiredDays ?? null,
        targetCount: input.targetCount,
    });

    return {
        account_id: accountId,
        member_id: input.memberId,
        title: input.title,
        summary: input.summary ?? null,
        description: input.description ?? null,
        challenge_type: challengeType,
        target_exercise_id: challengeType === 'exercise' ? input.exerciseId ?? null : null,
        target_menu_id: challengeType === 'menu' ? input.targetMenuId ?? null : null,
        menu_source: challengeType === 'menu' ? input.menuSource ?? null : null,
        target_count: targetCount,
        daily_cap: Math.max(1, input.dailyCap ?? 1),
        count_unit: input.countUnit ?? (challengeType === 'menu' ? 'menu_completion' : 'exercise_completion'),
        goal_type: goalType,
        window_days: Math.max(1, input.windowDays),
        required_days: goalType === 'active_day' ? Math.max(1, input.requiredDays ?? targetCount) : null,
        started_at: input.startedAt ?? new Date().toISOString(),
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
        status: 'active',
        icon_emoji: input.iconEmoji ?? null,
        reward_granted_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: new Date().toISOString(),
    };
}

function toPersonalChallengeSetupUpdateRow(
    challenge: PersonalChallenge,
    patch: PersonalChallengeSetupPatch,
): PersonalChallengeUpdate {
    const challengeType = patch.challengeType ?? challenge.challengeType;
    const goalType = patch.goalType ?? challenge.goalType;
    const windowDays = Math.max(1, patch.windowDays ?? challenge.windowDays);
    const effectiveStartDate = patch.effectiveStartDate ?? challenge.effectiveStartDate;
    const effectiveWindow = createPersonalChallengeWindow(effectiveStartDate, windowDays);
    const requiredDays = goalType === 'active_day'
        ? Math.max(1, patch.requiredDays ?? challenge.requiredDays ?? challenge.targetCount)
        : null;
    const targetCount = resolveTargetCount({
        goalType,
        requiredDays,
        targetCount: patch.targetCount ?? challenge.targetCount,
    });

    return {
        challenge_type: challengeType,
        target_exercise_id: challengeType === 'exercise' ? patch.exerciseId ?? challenge.exerciseId ?? null : null,
        target_menu_id: challengeType === 'menu' ? patch.targetMenuId ?? challenge.targetMenuId ?? null : null,
        menu_source: challengeType === 'menu' ? patch.menuSource ?? challenge.menuSource ?? null : null,
        target_count: targetCount,
        daily_cap: Math.max(1, patch.dailyCap ?? challenge.dailyCap),
        count_unit: patch.countUnit ?? challenge.countUnit,
        goal_type: goalType,
        window_days: windowDays,
        required_days: requiredDays,
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
        updated_at: new Date().toISOString(),
    };
}

async function updatePersonalChallengeRow(
    id: string,
    patch: PersonalChallengeUpdate,
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase
        .from('personal_challenges')
        .update(patch)
        .eq('id', id)
        .eq('account_id', accountId);

    if (error) throw error;
}

export async function fetchMyPersonalChallenges(): Promise<PersonalChallenge[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('personal_challenges')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[personalChallenges] fetchMyPersonalChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapPersonalChallenge);
}

export async function fetchMyActivePersonalChallenges(): Promise<PersonalChallenge[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('personal_challenges')
        .select('*')
        .eq('account_id', accountId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[personalChallenges] fetchMyActivePersonalChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapPersonalChallenge);
}

export async function fetchMyPastPersonalChallenges(limit = 20): Promise<PersonalChallenge[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('personal_challenges')
        .select('*')
        .eq('account_id', accountId)
        .in('status', PERSONAL_CHALLENGE_PAST_STATUSES)
        .order('updated_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('[personalChallenges] fetchMyPastPersonalChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapPersonalChallenge);
}

export async function createPersonalChallenge(
    input: PersonalChallengeCreateInput,
): Promise<PersonalChallenge | null> {
    if (!supabase) return null;
    const accountId = getAccountId();
    if (!accountId) return null;

    const { data, error } = await supabase
        .from('personal_challenges')
        .insert(toPersonalChallengeInsertRow(input, accountId))
        .select('*')
        .single();

    if (error) throw error;

    return data ? mapPersonalChallenge(data) : null;
}

export async function updatePersonalChallengeMeta(
    id: string,
    patch: PersonalChallengeMetaPatch,
): Promise<void> {
    await updatePersonalChallengeRow(id, {
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.iconEmoji !== undefined ? { icon_emoji: patch.iconEmoji } : {}),
        updated_at: new Date().toISOString(),
    });
}

export async function updatePersonalChallengeSetup(
    challenge: PersonalChallenge,
    patch: PersonalChallengeSetupPatch,
): Promise<void> {
    await updatePersonalChallengeRow(idOrThrow(challenge), toPersonalChallengeSetupUpdateRow(challenge, patch));
}

export async function completePersonalChallenge(
    id: string,
    options?: { completedAt?: string; rewardGrantedAt?: string },
): Promise<void> {
    const completedAt = options?.completedAt ?? new Date().toISOString();
    const rewardGrantedAt = options?.rewardGrantedAt ?? completedAt;

    await updatePersonalChallengeRow(id, {
        status: 'completed',
        completed_at: completedAt,
        reward_granted_at: rewardGrantedAt,
        ended_at: null,
        updated_at: new Date().toISOString(),
    });
}

export async function endPersonalChallenge(
    id: string,
    reason: 'manual' | 'expired',
    endedAt = new Date().toISOString(),
): Promise<void> {
    await updatePersonalChallengeRow(id, {
        status: reason === 'manual' ? 'ended_manual' : 'ended_expired',
        ended_at: endedAt,
        updated_at: new Date().toISOString(),
    });
}

export async function countPersonalChallengeProgress(challenge: PersonalChallenge): Promise<number> {
    const sessions = await getAllSessions();

    return countChallengeProgressFromSessions(
        toPersonalChallengeEngineInput(challenge),
        sessions,
        [challenge.memberId],
        {
            startDate: challenge.effectiveStartDate,
            endDate: challenge.effectiveEndDate,
        },
    );
}

function idOrThrow(challenge: Pick<PersonalChallenge, 'id'>): string {
    if (!challenge.id) {
        throw new Error('Missing personal challenge id');
    }

    return challenge.id;
}
