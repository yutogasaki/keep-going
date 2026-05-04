import type { Challenge, ChallengeAttempt, ChallengeEnrollment } from '../../../lib/challenges';

export const VISIBLE_PAST_CHALLENGE_COUNT = 4;

interface ChallengeListPastContext {
    challengeEnrollments?: ChallengeEnrollment[];
    challengeAttempts?: ChallengeAttempt[];
}

export interface ChallengeListBuckets {
    currentChallenges: Challenge[];
    visiblePastChallenges: Challenge[];
    hiddenPastCount: number;
}

function hasOpenRollingParticipantWindow(
    challengeId: string,
    today: string,
    context: ChallengeListPastContext,
): boolean {
    const matchingAttempts = context.challengeAttempts?.filter((attempt) => attempt.challengeId === challengeId) ?? [];
    if (matchingAttempts.length > 0) {
        return matchingAttempts.some((attempt) => (
            attempt.status === 'active'
            && attempt.effectiveEndDate >= today
        ));
    }

    return context.challengeEnrollments?.some((enrollment) => (
        enrollment.challengeId === challengeId
        && enrollment.effectiveEndDate >= today
    )) ?? false;
}

export function isTeacherChallengeListPast(
    challenge: Challenge,
    today: string,
    context: ChallengeListPastContext = {},
): boolean {
    if (challenge.windowType === 'rolling') {
        if (challenge.publishMode === 'always_on') {
            return false;
        }

        if (hasOpenRollingParticipantWindow(challenge.id, today, context)) {
            return false;
        }

        const publishEndDate = challenge.publishEndDate ?? challenge.endDate;
        return publishEndDate < today;
    }

    return challenge.endDate < today;
}

export function buildChallengeListBuckets(
    challenges: Challenge[],
    today: string,
    showAllPastChallenges: boolean,
    context: ChallengeListPastContext = {},
): ChallengeListBuckets {
    const currentChallenges: Challenge[] = [];
    const pastChallenges: Challenge[] = [];

    for (const challenge of challenges) {
        if (isTeacherChallengeListPast(challenge, today, context)) {
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
