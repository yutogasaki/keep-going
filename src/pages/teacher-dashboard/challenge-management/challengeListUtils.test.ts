import { describe, expect, it } from 'vitest';
import type { Challenge, ChallengeAttempt, ChallengeEnrollment } from '../../../lib/challenges';
import { buildChallengeListBuckets, isTeacherChallengeListPast } from './challengeListUtils';
import { createChallengeCopyFormValues } from './getInitialFormValues';

function makeChallenge(id: string, overrides: Partial<Challenge> = {}): Challenge {
    return {
        id,
        title: `${id}チャレンジ`,
        summary: null,
        description: null,
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: null,
        menuSource: null,
        targetCount: 5,
        dailyCap: 1,
        countUnit: 'exercise_completion',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        windowType: 'calendar',
        goalType: 'total_count',
        windowDays: null,
        requiredDays: null,
        dailyMinimumMinutes: null,
        publishMode: 'seasonal',
        publishStartDate: '2026-04-01',
        publishEndDate: '2026-04-30',
        createdBy: 'teacher@example.com',
        rewardKind: 'star',
        rewardValue: 1,
        rewardFuwafuwaType: null,
        tier: 'small',
        iconEmoji: null,
        classLevels: [],
        createdAt: '2026-04-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeChallengeEnrollment(overrides: Partial<ChallengeEnrollment> = {}): ChallengeEnrollment {
    return {
        id: 'enrollment-1',
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId: 'member-1',
        joinedAt: '2026-05-31T09:00:00.000Z',
        effectiveStartDate: '2026-05-31',
        effectiveEndDate: '2026-06-06',
        createdAt: '2026-05-31T09:00:00.000Z',
        ...overrides,
    };
}

function makeChallengeAttempt(overrides: Partial<ChallengeAttempt> = {}): ChallengeAttempt {
    return {
        id: 'attempt-1',
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId: 'member-1',
        attemptNo: 1,
        joinedAt: '2026-05-31T09:00:00.000Z',
        effectiveStartDate: '2026-05-31',
        effectiveEndDate: '2026-06-06',
        status: 'active',
        completedAt: null,
        createdAt: '2026-05-31T09:00:00.000Z',
        updatedAt: '2026-05-31T09:00:00.000Z',
        ...overrides,
    };
}

describe('teacher challenge list helpers', () => {
    it('keeps current challenges visible and folds past challenges after four items', () => {
        const challenges = [
            makeChallenge('current', { endDate: '2026-05-31' }),
            makeChallenge('past-1', { endDate: '2026-04-30' }),
            makeChallenge('past-2', { endDate: '2026-04-29' }),
            makeChallenge('past-3', { endDate: '2026-04-28' }),
            makeChallenge('past-4', { endDate: '2026-04-27' }),
            makeChallenge('past-5', { endDate: '2026-04-26' }),
        ];

        const result = buildChallengeListBuckets(challenges, '2026-05-01', false);

        expect(result.currentChallenges.map((challenge) => challenge.id)).toEqual(['current']);
        expect(result.visiblePastChallenges.map((challenge) => challenge.id)).toEqual([
            'past-1',
            'past-2',
            'past-3',
            'past-4',
        ]);
        expect(result.hiddenPastCount).toBe(1);
    });

    it('keeps seasonal rolling challenges current while the publish window is open', () => {
        const challenge = makeChallenge('may-week', {
            windowType: 'rolling',
            goalType: 'active_day',
            targetCount: 5,
            requiredDays: 5,
            dailyCap: 1,
            windowDays: 7,
            startDate: '2026-05-01',
            endDate: '2026-05-07',
            publishStartDate: '2026-05-01',
            publishEndDate: '2026-05-31',
        });

        expect(isTeacherChallengeListPast(challenge, '2026-05-10')).toBe(false);
        expect(isTeacherChallengeListPast(challenge, '2026-06-01')).toBe(true);
    });

    it('keeps seasonal rolling challenges current while a participant attempt is still active', () => {
        const challenge = makeChallenge('may-week', {
            windowType: 'rolling',
            goalType: 'active_day',
            targetCount: 5,
            requiredDays: 5,
            dailyCap: 1,
            windowDays: 7,
            startDate: '2026-05-01',
            endDate: '2026-05-07',
            publishStartDate: '2026-05-01',
            publishEndDate: '2026-05-31',
        });
        const challengeAttempts = [
            makeChallengeAttempt({
                challengeId: challenge.id,
                effectiveStartDate: '2026-05-31',
                effectiveEndDate: '2026-06-06',
                status: 'active',
            }),
        ];

        expect(isTeacherChallengeListPast(challenge, '2026-06-01', { challengeAttempts })).toBe(false);
        expect(isTeacherChallengeListPast(challenge, '2026-06-07', { challengeAttempts })).toBe(true);
    });

    it('uses enrollment windows as a fallback for rolling challenges without attempts', () => {
        const challenge = makeChallenge('legacy-may-week', {
            windowType: 'rolling',
            goalType: 'active_day',
            targetCount: 5,
            requiredDays: 5,
            dailyCap: 1,
            windowDays: 7,
            startDate: '2026-05-01',
            endDate: '2026-05-07',
            publishStartDate: '2026-05-01',
            publishEndDate: '2026-05-31',
        });
        const challengeEnrollments = [
            makeChallengeEnrollment({
                challengeId: challenge.id,
                effectiveStartDate: '2026-05-31',
                effectiveEndDate: '2026-06-06',
            }),
        ];

        const result = buildChallengeListBuckets([challenge], '2026-06-01', false, { challengeEnrollments });

        expect(result.currentChallenges.map((item) => item.id)).toEqual([challenge.id]);
        expect(result.visiblePastChallenges).toEqual([]);
    });

    it('moves rolling challenges past after publish and participant windows are both closed', () => {
        const challenge = makeChallenge('closed-may-week', {
            windowType: 'rolling',
            goalType: 'active_day',
            targetCount: 5,
            requiredDays: 5,
            dailyCap: 1,
            windowDays: 7,
            startDate: '2026-05-01',
            endDate: '2026-05-07',
            publishStartDate: '2026-05-01',
            publishEndDate: '2026-05-31',
        });
        const challengeAttempts = [
            makeChallengeAttempt({
                challengeId: challenge.id,
                effectiveStartDate: '2026-05-20',
                effectiveEndDate: '2026-05-26',
                status: 'completed',
            }),
        ];
        const challengeEnrollments = [
            makeChallengeEnrollment({
                challengeId: challenge.id,
                effectiveStartDate: '2026-05-20',
                effectiveEndDate: '2026-06-06',
            }),
        ];

        expect(isTeacherChallengeListPast(challenge, '2026-06-01', {
            challengeAttempts,
            challengeEnrollments,
        })).toBe(true);
    });

    it('keeps always-on rolling challenges current even when their base date range is old', () => {
        const challenge = makeChallenge('always-on-week', {
            windowType: 'rolling',
            goalType: 'active_day',
            targetCount: 5,
            requiredDays: 5,
            dailyCap: 1,
            windowDays: 7,
            startDate: '2026-04-01',
            endDate: '2026-04-07',
            publishMode: 'always_on',
            publishStartDate: null,
            publishEndDate: null,
        });

        expect(isTeacherChallengeListPast(challenge, '2026-05-10')).toBe(false);
    });

    it('uses the challenge date range for calendar challenge past state', () => {
        const challenge = makeChallenge('calendar', {
            startDate: '2026-05-01',
            endDate: '2026-05-07',
            publishStartDate: '2026-05-01',
            publishEndDate: '2026-05-31',
        });

        expect(isTeacherChallengeListPast(challenge, '2026-05-10')).toBe(true);
    });

    it('copies challenge settings into a new-form draft without reusing the original title exactly', () => {
        const copied = createChallengeCopyFormValues(makeChallenge('april', {
            title: '4月のチャレンジ',
            challengeType: 'menu',
            exerciseId: null,
            targetMenuId: 'menu-1',
            menuSource: 'teacher',
            countUnit: 'menu_completion',
            classLevels: ['初級'],
        }));

        expect(copied).toMatchObject({
            title: '4月のチャレンジ（コピー）',
            challengeType: 'menu',
            targetMenuId: 'menu-1',
            menuSource: 'teacher',
            classLevels: ['初級'],
        });
    });
});
