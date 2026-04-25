import type { Challenge, normalizeChallengeWriteInput } from '../challenges';
import type { SessionRecord } from '../db';

export function asSessions(records: SessionRecord[]): SessionRecord[] {
    return records;
}

export function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: 'challenge-1',
        title: '開脚チャレンジ',
        summary: '1日1回の開脚',
        description: 'ゆっくりやる',
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: null,
        menuSource: null,
        targetCount: 5,
        dailyCap: 2,
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
        createdBy: 'teacher@example.com',
        rewardKind: 'star',
        rewardValue: 3,
        rewardFuwafuwaType: null,
        tier: 'small',
        iconEmoji: '⭐',
        classLevels: [],
        createdAt: '2026-03-01T00:00:00Z',
        ...overrides,
    };
}

export function makeChallengeWriteInput(
    overrides: Partial<Parameters<typeof normalizeChallengeWriteInput>[0]> = {},
): Parameters<typeof normalizeChallengeWriteInput>[0] {
    return {
        title: '先生チャレンジ',
        summary: null,
        description: null,
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: null,
        menuSource: null,
        targetCount: 3,
        dailyCap: 2,
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
        rewardKind: 'star',
        rewardValue: 1,
        tier: 'small',
        iconEmoji: null,
        classLevels: [],
        ...overrides,
    };
}
