import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '../../../lib/db';
import { getTodayKey, shiftDateKey } from '../../../lib/db';
import type { UserProfileStore } from '../../../store/useAppStore';
import { collectPendingMilestoneEvents, getMilestoneKindForStage, getMilestoneStage } from './useHomeMilestoneWatcher';

function makeUser(overrides: Partial<UserProfileStore> = {}): UserProfileStore {
    return {
        id: 'user-1',
        name: 'テスト',
        classLevel: '初級',
        fuwafuwaBirthDate: getTodayKey(),
        fuwafuwaType: 1,
        fuwafuwaCycleCount: 1,
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

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
    const date = getTodayKey();
    return {
        id: `session-${date}`,
        date,
        startedAt: `${date}T10:00:00.000Z`,
        totalSeconds: 300,
        exerciseIds: ['S01'],
        skippedIds: [],
        userIds: ['user-1'],
        ...overrides,
    };
}

describe('useHomeMilestoneWatcher helpers', () => {
    it('maps milestone kinds to stages and back', () => {
        expect(getMilestoneKindForStage(1)).toBe('egg');
        expect(getMilestoneKindForStage(2)).toBe('fairy');
        expect(getMilestoneKindForStage(3)).toBe('adult');
        expect(getMilestoneKindForStage(0)).toBeNull();
        expect(getMilestoneStage('egg')).toBe(1);
        expect(getMilestoneStage('fairy')).toBe(2);
        expect(getMilestoneStage('adult')).toBe(3);
    });

    it('collects pending events only for unnotified users', () => {
        const today = getTodayKey();
        const fairyBirthDate = shiftDateKey(today, -4);
        const users = [
            makeUser({
                id: 'egg-user',
                fuwafuwaBirthDate: today,
            }),
            makeUser({
                id: 'fairy-user',
                fuwafuwaBirthDate: fairyBirthDate,
            }),
            makeUser({
                id: 'adult-user',
                fuwafuwaBirthDate: shiftDateKey(today, -14),
            }),
            makeUser({
                id: 'already-notified',
                fuwafuwaBirthDate: today,
                notifiedFuwafuwaStages: [1],
            }),
        ];

        const allSessions = [
            makeSession({ id: 'fairy-1', date: fairyBirthDate, userIds: ['fairy-user'] }),
            makeSession({ id: 'fairy-2', date: shiftDateKey(fairyBirthDate, 1), userIds: ['fairy-user'] }),
            makeSession({ id: 'adult-1', date: shiftDateKey(today, -14), userIds: ['adult-user'] }),
            makeSession({ id: 'adult-2', date: shiftDateKey(today, -12), userIds: ['adult-user'] }),
            makeSession({ id: 'adult-3', date: shiftDateKey(today, -10), userIds: ['adult-user'] }),
            makeSession({ id: 'adult-4', date: shiftDateKey(today, -8), userIds: ['adult-user'] }),
            makeSession({ id: 'adult-5', date: shiftDateKey(today, -6), userIds: ['adult-user'] }),
            makeSession({ id: 'adult-6', date: shiftDateKey(today, -4), userIds: ['adult-user'] }),
            makeSession({ id: 'adult-7', date: shiftDateKey(today, -2), userIds: ['adult-user'] }),
        ];

        expect(collectPendingMilestoneEvents({
            allSessions,
            hasKnownMilestoneEvent: () => false,
            users,
        })).toEqual([
            { kind: 'egg', userId: 'egg-user', source: 'system' },
            { kind: 'fairy', userId: 'fairy-user', source: 'system' },
            { kind: 'adult', userId: 'adult-user', source: 'system' },
        ]);
    });

    it('skips events that are already pending or active', () => {
        const event = { kind: 'egg', userId: 'user-1', source: 'system' } as const;

        expect(collectPendingMilestoneEvents({
            allSessions: [],
            hasKnownMilestoneEvent: (candidate) => candidate.userId === event.userId && candidate.kind === event.kind,
            users: [makeUser()],
        })).toEqual([]);
    });
});
