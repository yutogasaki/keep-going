import { describe, expect, it } from 'vitest';
import type { Challenge, ChallengeCompletion, ChallengeRewardGrant } from '../../lib/challenges';
import type { UserProfileStore } from '../../store/useAppStore';
import { buildTeacherChallengeRewardScenes, isTeacherChallengeCompletedToday } from './challengeRewardUtils';

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: 'challenge-1',
        title: 'つまさきチャレンジ',
        summary: 'つまさきチャレンジ',
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
        rewardValue: 2,
        rewardFuwafuwaType: null,
        tier: 'small',
        iconEmoji: '🎀',
        classLevels: [],
        createdAt: '2026-03-01T00:00:00Z',
        ...overrides,
    };
}

function makeCompletion(overrides: Partial<ChallengeCompletion> = {}): ChallengeCompletion {
    return {
        id: 'completion-1',
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId: 'user-1',
        completedAt: '2026-03-19T08:00:00.000Z',
        ...overrides,
    };
}

function makeRewardGrant(overrides: Partial<ChallengeRewardGrant> = {}): ChallengeRewardGrant {
    return {
        id: 'grant-1',
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId: 'user-1',
        grantedAt: '2026-03-19T08:00:00.000Z',
        ...overrides,
    };
}

function makeUser(overrides: Partial<UserProfileStore> = {}): UserProfileStore {
    return {
        id: 'user-1',
        name: 'ゆい',
        classLevel: '初級',
        fuwafuwaBirthDate: '',
        fuwafuwaType: 1,
        fuwafuwaCycleCount: 0,
        fuwafuwaName: null,
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 10,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        challengeStars: 0,
        chibifuwas: [],
        ...overrides,
    };
}

describe('challengeRewardUtils', () => {
    it('treats a teacher challenge as completed today when the last required completion happened today', () => {
        expect(isTeacherChallengeCompletedToday({
            challengeId: 'challenge-1',
            activeUserIds: ['user-1', 'user-2'],
            completions: [
                makeCompletion({
                    memberId: 'user-1',
                    completedAt: '2026-03-18T08:00:00.000Z',
                }),
                makeCompletion({
                    id: 'completion-2',
                    memberId: 'user-2',
                    completedAt: '2026-03-19T09:00:00.000Z',
                }),
            ],
            today: '2026-03-19',
        })).toBe(true);
    });

    it('does not mark the challenge as completed today until every active user is done', () => {
        expect(isTeacherChallengeCompletedToday({
            challengeId: 'challenge-1',
            activeUserIds: ['user-1', 'user-2'],
            completions: [
                makeCompletion({
                    memberId: 'user-1',
                    completedAt: '2026-03-19T08:00:00.000Z',
                }),
            ],
            today: '2026-03-19',
        })).toBe(false);
    });

    it('builds reward scenes with challenge and member information', () => {
        expect(buildTeacherChallengeRewardScenes({
            rewardGrants: [makeRewardGrant()],
            challenges: [makeChallenge()],
            users: [makeUser()],
        })).toEqual([
            {
                id: 'teacher:grant-1',
                challengeId: 'challenge-1',
                source: 'teacher',
                title: 'つまさきチャレンジ',
                memberId: 'user-1',
                memberName: 'ゆい',
                rewardKind: 'star',
                rewardValue: 2,
                accentEmoji: '🎀',
            },
        ]);
    });
});
