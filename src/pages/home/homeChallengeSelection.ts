import type { Challenge } from '../../lib/challenges';

interface SelectHomeTeacherChallengesParams {
    activeUserIds: string[];
    availableChallenges: Challenge[];
    todayDoneChallenges: Challenge[];
    joinedChallengeIds: Record<string, string[]>;
}

interface HomeTeacherChallengeSelection {
    joinedTeacherChallenges: Challenge[];
    recommendedTeacherChallenge: Challenge | null;
}

function isJoinedChallenge(
    challenge: Challenge,
    activeUserIds: string[],
    joinedChallengeIds: Record<string, string[]>,
): boolean {
    return activeUserIds.some((userId) => (joinedChallengeIds[userId] ?? []).includes(challenge.id));
}

export function selectHomeTeacherChallenges({
    activeUserIds,
    availableChallenges,
    todayDoneChallenges,
    joinedChallengeIds,
}: SelectHomeTeacherChallengesParams): HomeTeacherChallengeSelection {
    const joinedTeacherChallenges: Challenge[] = [];
    const seenChallengeIds = new Set<string>();

    for (const challenge of [...availableChallenges, ...todayDoneChallenges]) {
        if (!isJoinedChallenge(challenge, activeUserIds, joinedChallengeIds) || seenChallengeIds.has(challenge.id)) {
            continue;
        }

        joinedTeacherChallenges.push(challenge);
        seenChallengeIds.add(challenge.id);
    }

    const recommendedTeacherChallenge = availableChallenges.find(
        (challenge) => !isJoinedChallenge(challenge, activeUserIds, joinedChallengeIds),
    ) ?? null;

    return {
        joinedTeacherChallenges,
        recommendedTeacherChallenge,
    };
}
