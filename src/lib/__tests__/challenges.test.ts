import { beforeEach, describe, expect, it, vi } from 'vitest';
import { countChallengeProgress } from '../challenges';
import { getAllSessions } from '../db';
import { asSessions, makeChallenge } from './challenges.fixtures';

vi.mock('../db', () => ({
    getAllSessions: vi.fn(),
    getTodayKey: vi.fn(() => '2026-03-09'),
}));

const mockedGetAllSessions = vi.mocked(getAllSessions);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('countChallengeProgress', () => {
    it('caps daily exercise counts by dailyCap', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-03-05',
                startedAt: '2026-03-05T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01', 'S01', 'S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-05',
                startedAt: '2026-03-05T11:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's3',
                date: '2026-03-06',
                startedAt: '2026-03-06T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge(), ['u1']);

        expect(progress).toBe(3);
    });

    it('ignores sessions outside the date range and other users', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-02-28',
                startedAt: '2026-02-28T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-10',
                startedAt: '2026-03-10T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u2'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            startDate: '2026-03-01',
            endDate: '2026-03-09',
        }), ['u1']);

        expect(progress).toBe(0);
    });

    it('counts only completed matching menu sessions and applies dailyCap', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 'menu-1',
                date: '2026-03-05',
                startedAt: '2026-03-05T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01', 'S02'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: [],
                userIds: ['u1'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
            {
                id: 'menu-2',
                date: '2026-03-05',
                startedAt: '2026-03-05T11:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01', 'S02'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: [],
                userIds: ['u1'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
            {
                id: 'menu-3',
                date: '2026-03-05',
                startedAt: '2026-03-05T12:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: ['S02'],
                userIds: ['u1'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
            {
                id: 'menu-4',
                date: '2026-03-06',
                startedAt: '2026-03-06T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01', 'S02'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: [],
                userIds: ['u2'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            challengeType: 'menu',
            exerciseId: null,
            targetMenuId: 'preset-basic',
            menuSource: 'preset',
            countUnit: 'menu_completion',
            dailyCap: 1,
        }), ['u1']);

        expect(progress).toBe(1);
    });

    it('counts active days inside an effective rolling window', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-03-13',
                startedAt: '2026-03-13T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-14',
                startedAt: '2026-03-14T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's3',
                date: '2026-03-15',
                startedAt: '2026-03-15T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01', 'S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            windowType: 'rolling',
            goalType: 'active_day',
            windowDays: 7,
            requiredDays: 5,
            targetCount: 5,
            dailyCap: 1,
        }), ['u1'], {
            startDate: '2026-03-14',
            endDate: '2026-03-20',
        });

        expect(progress).toBe(2);
    });

    it('ignores sessions before joinedAt on the join day', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 'before-join',
                date: '2026-03-05',
                startedAt: '2026-03-05T09:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 'after-join',
                date: '2026-03-05',
                startedAt: '2026-03-05T15:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 'next-day',
                date: '2026-03-06',
                startedAt: '2026-03-06T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            goalType: 'active_day',
            requiredDays: 5,
            targetCount: 5,
            windowType: 'calendar',
            startDate: '2026-03-01',
            endDate: '2026-03-31',
        }), ['u1'], {
            startDate: '2026-03-01',
            endDate: '2026-03-31',
            joinedAt: '2026-03-05T12:00:00Z',
        });

        expect(progress).toBe(2);
    });

    it('respects the 3AM challenge day boundary when joinedAt is stored in UTC', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 'before-join',
                date: '2026-03-14',
                startedAt: '2026-03-14T07:00:00+09:00',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 'after-join',
                date: '2026-03-14',
                startedAt: '2026-03-14T09:30:00+09:00',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            goalType: 'active_day',
            requiredDays: 5,
            targetCount: 5,
            windowType: 'calendar',
            startDate: '2026-03-14',
            endDate: '2026-03-31',
        }), ['u1'], {
            startDate: '2026-03-14',
            endDate: '2026-03-31',
            joinedAt: '2026-03-13T23:30:00.000Z',
        });

        expect(progress).toBe(1);
    });

});
