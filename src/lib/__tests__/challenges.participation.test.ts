import { describe, expect, it } from 'vitest';
import {
    buildChallengeEnrollmentState,
    canRetryTeacherChallenge,
    getChallengeRetryStats,
    getLatestChallengeAttempts,
} from '../challenges';
import { makeChallenge } from './challenges.fixtures';

describe('canRetryTeacherChallenge', () => {
    it('allows retry for always-on rolling challenges', () => {
        expect(canRetryTeacherChallenge(makeChallenge({
            publishMode: 'always_on',
            windowType: 'rolling',
            windowDays: 7,
        }))).toBe(true);
    });

    it('allows retry for seasonal rolling challenges while published', () => {
        expect(canRetryTeacherChallenge(makeChallenge({
            publishMode: 'seasonal',
            windowType: 'rolling',
            windowDays: 7,
        }), '2026-03-09')).toBe(true);
    });

    it('does not allow retry after the seasonal publish period or for calendar challenges', () => {
        expect(canRetryTeacherChallenge(makeChallenge({
            publishMode: 'seasonal',
            windowType: 'rolling',
            windowDays: 7,
        }), '2026-04-01')).toBe(false);
        expect(canRetryTeacherChallenge(makeChallenge({
            publishMode: 'always_on',
            windowType: 'calendar',
        }))).toBe(false);
    });
});

describe('challenge attempt helpers', () => {
    it('keeps only the latest attempt per member', () => {
        const latestAttempts = getLatestChallengeAttempts([
            {
                id: 'a1',
                challengeId: 'challenge-1',
                accountId: 'account-1',
                memberId: 'member-1',
                attemptNo: 1,
                joinedAt: '2026-03-01T00:00:00Z',
                effectiveStartDate: '2026-03-01',
                effectiveEndDate: '2026-03-07',
                status: 'completed',
                completedAt: '2026-03-07T00:00:00Z',
                createdAt: '2026-03-01T00:00:00Z',
                updatedAt: '2026-03-07T00:00:00Z',
            },
            {
                id: 'a2',
                challengeId: 'challenge-1',
                accountId: 'account-1',
                memberId: 'member-1',
                attemptNo: 2,
                joinedAt: '2026-03-08T00:00:00Z',
                effectiveStartDate: '2026-03-08',
                effectiveEndDate: '2026-03-14',
                status: 'active',
                completedAt: null,
                createdAt: '2026-03-08T00:00:00Z',
                updatedAt: '2026-03-08T00:00:00Z',
            },
        ]);

        expect(latestAttempts.get('member-1')?.attemptNo).toBe(2);
    });

    it('summarizes retries and repeat clears', () => {
        const stats = getChallengeRetryStats([
            {
                id: 'a1',
                challengeId: 'challenge-1',
                accountId: 'account-1',
                memberId: 'member-1',
                attemptNo: 1,
                joinedAt: '2026-03-01T00:00:00Z',
                effectiveStartDate: '2026-03-01',
                effectiveEndDate: '2026-03-07',
                status: 'completed',
                completedAt: '2026-03-07T00:00:00Z',
                createdAt: '2026-03-01T00:00:00Z',
                updatedAt: '2026-03-07T00:00:00Z',
            },
            {
                id: 'a2',
                challengeId: 'challenge-1',
                accountId: 'account-1',
                memberId: 'member-1',
                attemptNo: 2,
                joinedAt: '2026-03-08T00:00:00Z',
                effectiveStartDate: '2026-03-08',
                effectiveEndDate: '2026-03-14',
                status: 'active',
                completedAt: null,
                createdAt: '2026-03-08T00:00:00Z',
                updatedAt: '2026-03-08T00:00:00Z',
            },
            {
                id: 'a3',
                challengeId: 'challenge-1',
                accountId: 'account-2',
                memberId: 'member-2',
                attemptNo: 2,
                joinedAt: '2026-03-10T00:00:00Z',
                effectiveStartDate: '2026-03-10',
                effectiveEndDate: '2026-03-16',
                status: 'completed',
                completedAt: '2026-03-15T00:00:00Z',
                createdAt: '2026-03-10T00:00:00Z',
                updatedAt: '2026-03-15T00:00:00Z',
            },
        ]);

        expect(stats.totalAttempts).toBe(3);
        expect(stats.retryingMemberCount).toBe(1);
        expect(stats.repeatCompletionCount).toBe(1);
    });
});

describe('buildChallengeEnrollmentState', () => {
    it('converts enrollments into per-user joined ids and windows', () => {
        expect(buildChallengeEnrollmentState([
            {
                id: 'enroll-1',
                challengeId: 'challenge-a',
                accountId: 'account-1',
                memberId: 'user-1',
                joinedAt: '2026-03-14T00:00:00Z',
                effectiveStartDate: '2026-03-14',
                effectiveEndDate: '2026-03-20',
                createdAt: '2026-03-14T00:00:00Z',
            },
        ])).toEqual({
            joinedChallengeIds: {
                'user-1': ['challenge-a'],
            },
            challengeEnrollmentWindows: {
                'user-1': {
                    'challenge-a': {
                        startDate: '2026-03-14',
                        endDate: '2026-03-20',
                        joinedAt: '2026-03-14T00:00:00Z',
                    },
                },
            },
        });
    });
});
