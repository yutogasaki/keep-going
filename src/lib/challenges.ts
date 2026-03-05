import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync';
import { getAllSessions, getTodayKey } from './db';

export interface Challenge {
    id: string;
    title: string;
    exerciseId: string;
    targetCount: number;
    startDate: string;      // YYYY-MM-DD
    endDate: string;        // YYYY-MM-DD
    createdBy: string;      // teacher email
    rewardFuwafuwaType: number;
    classLevels: string[];  // empty = all classes
    createdAt: string;
}

export interface ChallengeCompletion {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    completedAt: string;
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

function mapChallenge(row: Database['public']['Tables']['challenges']['Row']): Challenge {
    return {
        id: row.id,
        title: row.title,
        exerciseId: row.exercise_id,
        targetCount: row.target_count,
        startDate: row.start_date,
        endDate: row.end_date,
        createdBy: row.created_by,
        rewardFuwafuwaType: row.reward_fuwafuwa_type,
        classLevels: row.class_levels ?? [],
        createdAt: row.created_at,
    };
}

// ─── Create / Delete (teacher only) ─────────────────

export async function createChallenge(data: {
    title: string;
    exerciseId: string;
    targetCount: number;
    startDate: string;
    endDate: string;
    createdBy: string;
    rewardFuwafuwaType: number;
    classLevels: string[];
}): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('challenges').insert({
        title: data.title,
        exercise_id: data.exerciseId,
        target_count: data.targetCount,
        start_date: data.startDate,
        end_date: data.endDate,
        created_by: data.createdBy,
        reward_fuwafuwa_type: data.rewardFuwafuwaType,
        class_levels: data.classLevels,
    });

    if (error) throw error;
}

export async function updateChallenge(id: string, data: {
    title: string;
    exerciseId: string;
    targetCount: number;
    startDate: string;
    endDate: string;
    rewardFuwafuwaType: number;
    classLevels: string[];
}): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('challenges').update({
        title: data.title,
        exercise_id: data.exerciseId,
        target_count: data.targetCount,
        start_date: data.startDate,
        end_date: data.endDate,
        reward_fuwafuwa_type: data.rewardFuwafuwaType,
        class_levels: data.classLevels,
    }).eq('id', id);

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

    return (data ?? []).map(row => ({
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

export async function countExerciseInPeriod(
    exerciseId: string,
    startDate: string,
    endDate: string,
    userIds: string[],
): Promise<number> {
    const sessions = await getAllSessions();
    let count = 0;

    for (const session of sessions) {
        // Filter by date range
        if (session.date < startDate || session.date > endDate) continue;

        // Filter by user (if session has userIds)
        if (session.userIds && session.userIds.length > 0) {
            if (!session.userIds.some(uid => userIds.includes(uid))) continue;
        }

        // Count occurrences of exerciseId in this session
        for (const eid of session.exerciseIds) {
            if (eid === exerciseId) count++;
        }
    }

    return count;
}
