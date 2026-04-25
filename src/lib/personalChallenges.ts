import { supabase } from './supabase';
import { getAccountId } from './sync/authState';
import {
    isPersonalChallengeLimitReached,
    mapPersonalChallenge,
    PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR,
    PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR,
    PERSONAL_CHALLENGE_PAST_STATUSES,
    toPersonalChallengeInsertRow,
    toPersonalChallengeSetupUpdateRow,
} from './personalChallengeHelpers';
import type {
    PersonalChallenge,
    PersonalChallengeCreateInput,
    PersonalChallengeMetaPatch,
    PersonalChallengeSetupPatch,
    PersonalChallengeUpdate,
} from './personalChallengeTypes';

export type {
    PersonalChallenge,
    PersonalChallengeCreateInput,
    PersonalChallengeMetaPatch,
    PersonalChallengeSetupPatch,
    PersonalChallengeStatus,
} from './personalChallengeTypes';
export {
    canDeletePersonalChallenge,
    countPersonalChallengeProgress,
    createPersonalChallengeWindow,
    getPersonalChallengeDaysLeft,
    getPersonalChallengeGoalTarget,
    getRemainingPersonalChallengeSlots,
    isPersonalChallengeLimitReached,
    mapPersonalChallenge,
    PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR,
    PERSONAL_CHALLENGE_ACTIVE_LIMIT,
    PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR,
    toPersonalChallengeEngineInput,
    toPersonalChallengeInsertRow,
} from './personalChallengeHelpers';

async function updatePersonalChallengeRow(id: string, patch: PersonalChallengeUpdate): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase.from('personal_challenges').update(patch).eq('id', id).eq('account_id', accountId);

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

export async function fetchMyActivePersonalChallengeCount(memberId: string): Promise<number> {
    if (!supabase) return 0;
    const accountId = getAccountId();
    if (!accountId) return 0;

    const { count, error } = await supabase
        .from('personal_challenges')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)
        .eq('member_id', memberId)
        .eq('status', 'active');

    if (error) {
        console.warn('[personalChallenges] fetchMyActivePersonalChallengeCount failed:', error);
        return 0;
    }

    return Math.max(count ?? 0, 0);
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

export async function createPersonalChallenge(input: PersonalChallengeCreateInput): Promise<PersonalChallenge | null> {
    if (!supabase) {
        throw new Error(PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR);
    }
    const accountId = getAccountId();
    if (!accountId) {
        throw new Error(PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR);
    }

    const activeCount = await fetchMyActivePersonalChallengeCount(input.memberId);
    if (isPersonalChallengeLimitReached(activeCount)) {
        throw new Error(PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR);
    }

    const { data, error } = await supabase
        .from('personal_challenges')
        .insert(toPersonalChallengeInsertRow(input, accountId))
        .select('*')
        .single();

    if (error) throw error;

    return data ? mapPersonalChallenge(data) : null;
}

export async function updatePersonalChallengeMeta(id: string, patch: PersonalChallengeMetaPatch): Promise<void> {
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
    await updatePersonalChallengeRow(challenge.id, toPersonalChallengeSetupUpdateRow(challenge, patch));
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

export async function deletePersonalChallenge(id: string): Promise<void> {
    if (!supabase) {
        throw new Error(PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR);
    }
    const accountId = getAccountId();
    if (!accountId) {
        throw new Error(PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR);
    }

    const { error } = await supabase.from('personal_challenges').delete().eq('id', id).eq('account_id', accountId);

    if (error) throw error;
}
