import { countChallengeProgressFromSessions, type ChallengeProgressWindow } from '../challenge-engine';
import { getAllSessions, getTodayKey } from '../db';
import { supabase } from '../supabase';
import type { Database } from '../supabase-types';
import { getAccountId } from '../sync/authState';
import { getChallengeActiveWindow } from './display';
import { toChallengeEngineInput } from './engine';
import { mapChallenge, mapChallengeAttempt, mapChallengeEnrollment, toChallengeInsertRow, toChallengeUpdateRow } from './mappers';
import type {
    Challenge,
    ChallengeAttemptStatus,
    ChallengeCompletion,
    ChallengeEnrollment,
    ChallengeAttempt,
    ChallengeRewardGrant,
    ChallengeWriteInput,
} from './types';

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

// ─── Create / Update / Delete (teacher only) ────────

export async function createChallenge(data: ChallengeWriteInput): Promise<void> {
    if (!supabase) {
        throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.from('challenges').insert(toChallengeInsertRow(data));

    if (error) throw error;
}

export async function updateChallenge(id: string, data: ChallengeWriteInput): Promise<void> {
    if (!supabase) {
        throw new Error('Supabase is not configured');
    }

    const { error } = await supabase.from('challenges').update(toChallengeUpdateRow(data)).eq('id', id);

    if (error) throw error;
}

export async function deleteChallenge(id: string): Promise<void> {
    if (!supabase) {
        throw new Error('Supabase is not configured');
    }

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

export async function fetchMyChallengeRewardGrants(): Promise<ChallengeRewardGrant[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('challenge_reward_grants')
        .select('*')
        .eq('account_id', accountId);

    if (error) {
        console.warn('[challenges] fetchMyChallengeRewardGrants failed:', error);
        return [];
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        challengeId: row.challenge_id,
        accountId: row.account_id,
        memberId: row.member_id,
        grantedAt: row.granted_at,
    }));
}

export async function fetchTeacherChallengeCompletions(): Promise<ChallengeCompletion[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('challenge_completions')
        .select('*');

    if (error) {
        console.warn('[challenges] fetchTeacherChallengeCompletions failed:', error);
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

export async function fetchTeacherChallengeEnrollments(): Promise<ChallengeEnrollment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('challenge_enrollments')
        .select('*');

    if (error) {
        console.warn('[challenges] fetchTeacherChallengeEnrollments failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallengeEnrollment);
}

export async function fetchTeacherChallengeAttempts(): Promise<ChallengeAttempt[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('challenge_attempts')
        .select('*');

    if (error) {
        console.warn('[challenges] fetchTeacherChallengeAttempts failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallengeAttempt);
}

// ─── Join / Complete / Retry ─────────────────────────

async function fetchLatestChallengeAttemptRow(
    challengeId: string,
    accountId: string,
    memberId: string,
): Promise<Database['public']['Tables']['challenge_attempts']['Row'] | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('challenge_attempts')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('account_id', accountId)
        .eq('member_id', memberId)
        .order('attempt_no', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;
}

async function createChallengeAttempt(
    challengeId: string,
    accountId: string,
    memberId: string,
    effectiveWindow: ChallengeProgressWindow,
    options: {
        joinedAt: string;
        forceNewAttempt?: boolean;
    },
): Promise<void> {
    if (!supabase) return;

    const latestAttempt = await fetchLatestChallengeAttemptRow(challengeId, accountId, memberId);
    if (
        !options.forceNewAttempt
        && latestAttempt
        && latestAttempt.status === 'active'
        && latestAttempt.effective_start_date === effectiveWindow.startDate
        && latestAttempt.effective_end_date === effectiveWindow.endDate
    ) {
        return;
    }

    const payload: Database['public']['Tables']['challenge_attempts']['Insert'] = {
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
        attempt_no: (latestAttempt?.attempt_no ?? 0) + 1,
        joined_at: options.joinedAt,
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
        status: 'active',
    };

    const { error } = await supabase.from('challenge_attempts').insert(payload);
    if (error) throw error;
}

async function updateLatestChallengeAttemptStatus(
    challengeId: string,
    accountId: string,
    memberId: string,
    status: ChallengeAttemptStatus,
    options: {
        completedAt?: string | null;
        updatedAt?: string;
    } = {},
): Promise<void> {
    if (!supabase) return;

    const latestAttempt = await fetchLatestChallengeAttemptRow(challengeId, accountId, memberId);
    if (!latestAttempt) {
        return;
    }

    if (
        latestAttempt.status === status
        && (status !== 'completed' || latestAttempt.completed_at === (options.completedAt ?? latestAttempt.completed_at))
    ) {
        return;
    }

    const update: Database['public']['Tables']['challenge_attempts']['Update'] = {
        status,
        updated_at: options.updatedAt ?? new Date().toISOString(),
        completed_at: status === 'completed' ? (options.completedAt ?? new Date().toISOString()) : null,
    };

    const { error } = await supabase
        .from('challenge_attempts')
        .update(update)
        .eq('id', latestAttempt.id);

    if (error) throw error;
}

export async function markChallengeJoined(
    challengeId: string,
    memberId: string,
    effectiveWindow: ChallengeProgressWindow,
    joinedAt = new Date().toISOString(),
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase.from('challenge_enrollments').upsert({
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
        joined_at: joinedAt,
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
    }, { onConflict: 'challenge_id,account_id,member_id' });

    if (error) throw error;

    await createChallengeAttempt(challengeId, accountId, memberId, effectiveWindow, {
        joinedAt,
    });
}

export async function markChallengeComplete(
    challengeId: string,
    memberId: string,
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;
    const completedAt = new Date().toISOString();

    const { error } = await supabase.from('challenge_completions').upsert({
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
        completed_at: completedAt,
    }, { onConflict: 'challenge_id,account_id,member_id' });

    if (error) throw error;

    await updateLatestChallengeAttemptStatus(challengeId, accountId, memberId, 'completed', {
        completedAt,
        updatedAt: completedAt,
    });
}

export async function markChallengeRewardGranted(
    challengeId: string,
    memberId: string,
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase.from('challenge_reward_grants').upsert({
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
    }, { onConflict: 'challenge_id,account_id,member_id' });

    if (error) throw error;
}

export async function retryChallenge(
    challengeId: string,
    memberId: string,
    effectiveWindow: ChallengeProgressWindow,
    joinedAt = new Date().toISOString(),
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;
    const latestAttempt = await fetchLatestChallengeAttemptRow(challengeId, accountId, memberId);
    if (latestAttempt?.status === 'active') {
        await updateLatestChallengeAttemptStatus(challengeId, accountId, memberId, 'expired', {
            updatedAt: joinedAt,
        });
    }

    const enrollmentPayload: Database['public']['Tables']['challenge_enrollments']['Insert'] = {
        challenge_id: challengeId,
        account_id: accountId,
        member_id: memberId,
        joined_at: joinedAt,
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
    };

    const [{ error: enrollmentError }, { error: completionError }] = await Promise.all([
        supabase.from('challenge_enrollments').upsert(enrollmentPayload, { onConflict: 'challenge_id,account_id,member_id' }),
        supabase
            .from('challenge_completions')
            .delete()
            .eq('challenge_id', challengeId)
            .eq('account_id', accountId)
            .eq('member_id', memberId),
    ]);

    if (enrollmentError) throw enrollmentError;
    if (completionError) throw completionError;

    await createChallengeAttempt(challengeId, accountId, memberId, effectiveWindow, {
        joinedAt,
        forceNewAttempt: true,
    });
}

// ─── Progress calculation (from local sessions) ──────

export async function countChallengeProgress(
    challenge: Challenge,
    userIds: string[],
    effectiveWindow?: ChallengeProgressWindow | null,
): Promise<number> {
    const sessions = await getAllSessions();
    const window = getChallengeActiveWindow(challenge, effectiveWindow);

    return countChallengeProgressInWindow(challenge, userIds, window, sessions);
}

export async function countChallengeProgressInCustomWindow(
    challenge: Challenge,
    userIds: string[],
    window: ChallengeProgressWindow,
): Promise<number> {
    const sessions = await getAllSessions();

    return countChallengeProgressInWindow(challenge, userIds, window, sessions);
}

function countChallengeProgressInWindow(
    challenge: Challenge,
    userIds: string[],
    window: ChallengeProgressWindow,
    sessions: Awaited<ReturnType<typeof getAllSessions>>,
): number {
    return countChallengeProgressFromSessions(
        toChallengeEngineInput(challenge),
        sessions,
        userIds,
        window,
    );
}
