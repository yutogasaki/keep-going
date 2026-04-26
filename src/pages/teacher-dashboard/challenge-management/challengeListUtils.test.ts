import { describe, expect, it } from 'vitest';
import type { Challenge } from '../../../lib/challenges';
import { buildChallengeListBuckets } from './challengeListUtils';
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
