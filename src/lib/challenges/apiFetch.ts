import { getTodayKey } from '../db';
import { supabase } from '../supabase';
import { getAccountId } from '../sync/authState';
import { mapChallenge, mapChallengeAttempt, mapChallengeEnrollment } from './mappers';
import type {
    Challenge,
    ChallengeAttempt,
    ChallengeCompletion,
    ChallengeEnrollment,
    ChallengeRewardGrant,
} from './types';

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

    const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });

    if (error) {
        console.warn('[challenges] fetchAllChallenges failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallenge);
}

export async function fetchMyCompletions(): Promise<ChallengeCompletion[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase.from('challenge_completions').select('*').eq('account_id', accountId);

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

    const { data, error } = await supabase.from('challenge_reward_grants').select('*').eq('account_id', accountId);

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

    const { data, error } = await supabase.from('challenge_completions').select('*');

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

    const { data, error } = await supabase.from('challenge_enrollments').select('*').eq('account_id', accountId);

    if (error) {
        console.warn('[challenges] fetchMyEnrollments failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallengeEnrollment);
}

export async function fetchTeacherChallengeEnrollments(): Promise<ChallengeEnrollment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase.from('challenge_enrollments').select('*');

    if (error) {
        console.warn('[challenges] fetchTeacherChallengeEnrollments failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallengeEnrollment);
}

export async function fetchTeacherChallengeAttempts(): Promise<ChallengeAttempt[]> {
    if (!supabase) return [];

    const { data, error } = await supabase.from('challenge_attempts').select('*');

    if (error) {
        console.warn('[challenges] fetchTeacherChallengeAttempts failed:', error);
        return [];
    }

    return (data ?? []).map(mapChallengeAttempt);
}
