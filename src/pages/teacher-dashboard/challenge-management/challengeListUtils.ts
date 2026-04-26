import type { Challenge } from '../../../lib/challenges';

export const VISIBLE_PAST_CHALLENGE_COUNT = 4;

export interface ChallengeListBuckets {
    currentChallenges: Challenge[];
    visiblePastChallenges: Challenge[];
    hiddenPastCount: number;
}

export function buildChallengeListBuckets(
    challenges: Challenge[],
    today: string,
    showAllPastChallenges: boolean,
): ChallengeListBuckets {
    const currentChallenges: Challenge[] = [];
    const pastChallenges: Challenge[] = [];

    for (const challenge of challenges) {
        if (challenge.endDate < today) {
            pastChallenges.push(challenge);
        } else {
            currentChallenges.push(challenge);
        }
    }

    const visiblePastChallenges = showAllPastChallenges
        ? pastChallenges
        : pastChallenges.slice(0, VISIBLE_PAST_CHALLENGE_COUNT);

    return {
        currentChallenges,
        visiblePastChallenges,
        hiddenPastCount: Math.max(0, pastChallenges.length - visiblePastChallenges.length),
    };
}
