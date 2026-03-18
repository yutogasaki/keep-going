import { describe, expect, it } from 'vitest';
import type { Challenge } from '../../lib/challenges';
import { selectHomeTeacherChallenges } from './homeChallengeSelection';

function makeChallenge(id: string, title = `${id} title`): Challenge {
    return {
        id,
        title,
        summary: title,
        description: null,
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: null,
        menuSource: null,
        targetCount: 5,
        dailyCap: 1,
        countUnit: 'exercise_completion',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        windowType: 'calendar',
        goalType: 'total_count',
        windowDays: null,
        requiredDays: null,
        dailyMinimumMinutes: null,
        publishMode: 'seasonal',
        publishStartDate: '2026-03-01',
        publishEndDate: '2026-03-31',
        createdBy: 'teacher-1',
        rewardKind: 'star',
        rewardValue: 1,
        rewardFuwafuwaType: null,
        tier: 'small',
        iconEmoji: '🎯',
        classLevels: [],
        createdAt: '2026-03-01T00:00:00Z',
    };
}

describe('homeChallengeSelection', () => {
    it('keeps active joined challenges ahead of recommendations', () => {
        const joinedChallenge = makeChallenge('joined');
        const recommendedChallenge = makeChallenge('recommended');

        expect(selectHomeTeacherChallenges({
            activeUserIds: ['user-1'],
            availableChallenges: [joinedChallenge, recommendedChallenge],
            todayDoneChallenges: [],
            joinedChallengeIds: {
                'user-1': ['joined'],
            },
        })).toEqual({
            joinedTeacherChallenges: [joinedChallenge],
            recommendedTeacherChallenge: recommendedChallenge,
        });
    });

    it('keeps today-done joined challenges visible on the home cards', () => {
        const joinedTodayDoneChallenge = makeChallenge('joined-today-done');
        const recommendedChallenge = makeChallenge('recommended');

        expect(selectHomeTeacherChallenges({
            activeUserIds: ['user-1'],
            availableChallenges: [recommendedChallenge],
            todayDoneChallenges: [joinedTodayDoneChallenge],
            joinedChallengeIds: {
                'user-1': ['joined-today-done'],
            },
        })).toEqual({
            joinedTeacherChallenges: [joinedTodayDoneChallenge],
            recommendedTeacherChallenge: recommendedChallenge,
        });
    });

    it('deduplicates joined challenges when the same id appears in multiple home buckets', () => {
        const joinedChallenge = makeChallenge('joined');

        expect(selectHomeTeacherChallenges({
            activeUserIds: ['user-1'],
            availableChallenges: [joinedChallenge],
            todayDoneChallenges: [joinedChallenge],
            joinedChallengeIds: {
                'user-1': ['joined'],
            },
        }).joinedTeacherChallenges).toEqual([joinedChallenge]);
    });
});
