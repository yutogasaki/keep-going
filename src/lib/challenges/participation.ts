import type { ChallengeAttempt, ChallengeEnrollment, ChallengeEnrollmentState } from './types';
import type { ChallengeProgressWindow } from '../challenge-engine';

export function buildChallengeEnrollmentState(enrollments: ChallengeEnrollment[]): ChallengeEnrollmentState {
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
                joinedAt: enrollment.joinedAt,
            },
        };
    }

    return {
        joinedChallengeIds,
        challengeEnrollmentWindows,
    };
}

export function getLatestChallengeAttempts(attempts: ChallengeAttempt[]): Map<string, ChallengeAttempt> {
    const latestAttempts = new Map<string, ChallengeAttempt>();

    for (const attempt of attempts) {
        const current = latestAttempts.get(attempt.memberId);
        if (!current || attempt.attemptNo > current.attemptNo) {
            latestAttempts.set(attempt.memberId, attempt);
        }
    }

    return latestAttempts;
}

export function getChallengeRetryStats(attempts: ChallengeAttempt[]) {
    const latestAttempts = getLatestChallengeAttempts(attempts);
    const retryingMemberCount = [...latestAttempts.values()].filter(
        (attempt) => attempt.attemptNo > 1 && attempt.status === 'active',
    ).length;
    const repeatCompletionCount = attempts.filter(
        (attempt) => attempt.attemptNo > 1 && attempt.status === 'completed',
    ).length;

    return {
        totalAttempts: attempts.length,
        retryingMemberCount,
        repeatCompletionCount,
        latestAttempts,
    };
}
