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

describe('duration challenge progress', () => {
    it('counts active days from total minutes for duration challenges', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-03-05',
                startedAt: '2026-03-05T10:00:00Z',
                totalSeconds: 120,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-05',
                startedAt: '2026-03-05T11:00:00Z',
                totalSeconds: 90,
                exerciseIds: ['S02'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's3',
                date: '2026-03-06',
                startedAt: '2026-03-06T10:00:00Z',
                totalSeconds: 120,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            challengeType: 'duration',
            exerciseId: null,
            goalType: 'active_day',
            requiredDays: 5,
            targetCount: 5,
            dailyMinimumMinutes: 3,
        }), ['u1']);

        expect(progress).toBe(1);
    });
});
