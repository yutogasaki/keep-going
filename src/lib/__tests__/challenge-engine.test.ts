import { describe, expect, it } from 'vitest';
import {
    buildChallengeEngineInput,
    countChallengeProgressFromSessions,
    createRollingChallengeWindow,
    getChallengeDaysLeft,
    getChallengeGoalTarget,
    getRollingWindowEndDate,
    isChallengeWindowActive,
    isChallengeWindowPast,
    resolveChallengeWindow,
    type ChallengeEngineInput,
} from '../challenge-engine';
import type { SessionRecord } from '../db';

function makeChallenge(overrides: Partial<ChallengeEngineInput> = {}): ChallengeEngineInput {
    return {
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
        dailyMinimumMinutes: null,
        ...overrides,
    };
}

function asSessions(records: SessionRecord[]): SessionRecord[] {
    return records;
}

describe('challenge-engine', () => {
    it('counts active-day progress once per date for exercise challenges', () => {
        const progress = countChallengeProgressFromSessions(
            makeChallenge({
                goalType: 'active_day',
                targetCount: 5,
                dailyCap: 1,
            }),
            asSessions([
                {
                    id: 's1',
                    date: '2026-03-05',
                    startedAt: '2026-03-05T08:00:00Z',
                    totalSeconds: 60,
                    exerciseIds: ['S01', 'S01'],
                    skippedIds: [],
                    userIds: ['u1'],
                },
                {
                    id: 's2',
                    date: '2026-03-05',
                    startedAt: '2026-03-05T10:00:00Z',
                    totalSeconds: 60,
                    exerciseIds: ['S01'],
                    skippedIds: [],
                    userIds: ['u1'],
                },
                {
                    id: 's3',
                    date: '2026-03-06',
                    startedAt: '2026-03-06T08:00:00Z',
                    totalSeconds: 60,
                    exerciseIds: ['S01'],
                    skippedIds: [],
                    userIds: ['u1'],
                },
            ]),
            ['u1'],
            { startDate: '2026-03-01', endDate: '2026-03-31' },
        );

        expect(progress).toBe(2);
    });

    it('counts active-day progress once per date for completed menu sessions', () => {
        const progress = countChallengeProgressFromSessions(
            makeChallenge({
                challengeType: 'menu',
                targetMenuId: 'preset-basic',
                menuSource: 'preset',
                countUnit: 'menu_completion',
                exerciseId: null,
                goalType: 'active_day',
            }),
            asSessions([
                {
                    id: 'm1',
                    date: '2026-03-05',
                    startedAt: '2026-03-05T08:00:00Z',
                    totalSeconds: 180,
                    exerciseIds: ['S01', 'S02'],
                    plannedExerciseIds: ['S01', 'S02'],
                    skippedIds: [],
                    userIds: ['u1'],
                    sourceMenuId: 'preset-basic',
                    sourceMenuSource: 'preset',
                },
                {
                    id: 'm2',
                    date: '2026-03-05',
                    startedAt: '2026-03-05T09:00:00Z',
                    totalSeconds: 180,
                    exerciseIds: ['S01', 'S02'],
                    plannedExerciseIds: ['S01', 'S02'],
                    skippedIds: [],
                    userIds: ['u1'],
                    sourceMenuId: 'preset-basic',
                    sourceMenuSource: 'preset',
                },
                {
                    id: 'm3',
                    date: '2026-03-06',
                    startedAt: '2026-03-06T08:00:00Z',
                    totalSeconds: 180,
                    exerciseIds: ['S01'],
                    plannedExerciseIds: ['S01', 'S02'],
                    skippedIds: ['S02'],
                    userIds: ['u1'],
                    sourceMenuId: 'preset-basic',
                    sourceMenuSource: 'preset',
                },
            ]),
            ['u1'],
            { startDate: '2026-03-01', endDate: '2026-03-31' },
        );

        expect(progress).toBe(1);
    });

    it('counts active-day progress from per-day session minutes for duration challenges', () => {
        const progress = countChallengeProgressFromSessions(
            makeChallenge({
                challengeType: 'duration',
                exerciseId: null,
                targetMenuId: null,
                menuSource: null,
                goalType: 'active_day',
                dailyMinimumMinutes: 3,
            }),
            asSessions([
                {
                    id: 'd1',
                    date: '2026-03-05',
                    startedAt: '2026-03-05T08:00:00Z',
                    totalSeconds: 120,
                    exerciseIds: ['S01'],
                    skippedIds: [],
                    userIds: ['u1'],
                },
                {
                    id: 'd2',
                    date: '2026-03-05',
                    startedAt: '2026-03-05T09:00:00Z',
                    totalSeconds: 90,
                    exerciseIds: ['S02'],
                    skippedIds: [],
                    userIds: ['u1'],
                },
                {
                    id: 'd3',
                    date: '2026-03-06',
                    startedAt: '2026-03-06T08:00:00Z',
                    totalSeconds: 150,
                    exerciseIds: ['S01'],
                    skippedIds: [],
                    userIds: ['u1'],
                },
                {
                    id: 'd4',
                    date: '2026-03-07',
                    startedAt: '2026-03-07T08:00:00Z',
                    totalSeconds: 180,
                    exerciseIds: ['S01'],
                    skippedIds: [],
                    userIds: ['u2'],
                },
            ]),
            ['u1'],
            { startDate: '2026-03-01', endDate: '2026-03-31' },
        );

        expect(progress).toBe(1);
    });

    it('builds engine input with required days as the shared goal target', () => {
        expect(buildChallengeEngineInput({
            challengeType: 'menu',
            exerciseId: null,
            targetMenuId: 'menu-1',
            menuSource: 'custom',
            targetCount: 99,
            dailyCap: 1,
            countUnit: 'menu_completion',
            startDate: '2026-03-14',
            endDate: '2026-03-20',
            windowType: 'rolling',
            goalType: 'active_day',
            requiredDays: 5,
            windowDays: 7,
            dailyMinimumMinutes: null,
        })).toMatchObject({
            targetCount: 5,
            targetMenuId: 'menu-1',
            menuSource: 'custom',
            windowType: 'rolling',
        });
    });

    it('creates a rolling window and keeps joinedAt when provided', () => {
        expect(createRollingChallengeWindow(
            { windowDays: 7 },
            '2026-03-14',
            '2026-03-14T09:30:00Z',
        )).toEqual({
            startDate: '2026-03-14',
            endDate: '2026-03-20',
            joinedAt: '2026-03-14T09:30:00Z',
        });
    });

    it('calculates the shared goal target for active-day challenges', () => {
        expect(getChallengeGoalTarget({
            goalType: 'active_day',
            requiredDays: 5,
            targetCount: 99,
        })).toBe(5);
    });

    it('resolves a rolling end date from the joined day', () => {
        expect(getRollingWindowEndDate('2026-03-14', 7)).toBe('2026-03-20');
    });

    it('uses an effective rolling window when present', () => {
        expect(resolveChallengeWindow(
            makeChallenge({
                windowType: 'rolling',
                startDate: '2026-03-01',
                endDate: '2026-03-31',
                windowDays: 7,
            }),
            { startDate: '2026-03-14', endDate: '2026-03-20' },
        )).toEqual({
            startDate: '2026-03-14',
            endDate: '2026-03-20',
        });
    });

    it('reports window state against the app day key', () => {
        const window = { startDate: '2026-03-14', endDate: '2026-03-20' };

        expect(isChallengeWindowActive(window, '2026-03-14')).toBe(true);
        expect(isChallengeWindowPast(window, '2026-03-21')).toBe(true);
    });

    it('calculates days left from the end of the date key', () => {
        const now = new Date('2026-03-18T12:00:00+09:00');
        expect(getChallengeDaysLeft('2026-03-20', now)).toBe(3);
    });
});
