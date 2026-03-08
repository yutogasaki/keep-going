import { describe, expect, it } from 'vitest';
import { buildRecordHistoryDays } from '../recordHistorySummary';
import type { SessionRecord } from '../../../lib/db';

const exerciseMap = new Map([
    ['S01', { name: '開脚', emoji: '🦵' }],
    ['S02', { name: '前屈', emoji: '🙇' }],
    ['S03', { name: '前後開脚', emoji: '🩰' }],
]);

const userNameMap = new Map([
    ['u1', 'ことり'],
    ['u2', 'ひなた'],
]);

function createRecord(overrides: Partial<SessionRecord> = {}): SessionRecord {
    return {
        id: 'session-1',
        date: '2026-03-08',
        startedAt: '2026-03-08T10:30:00.000Z',
        totalSeconds: 180,
        exerciseIds: ['S01', 'S02', 'S01'],
        skippedIds: ['S03'],
        userIds: ['u1'],
        ...overrides,
    };
}

describe('buildRecordHistoryDays', () => {
    it('builds day summaries with completed and skipped exercise chips', () => {
        const days = buildRecordHistoryDays({
            groupedEntries: [[
                '2026-03-08',
                [
                    createRecord(),
                    createRecord({
                        id: 'session-2',
                        startedAt: '2026-03-08T11:00:00.000Z',
                        totalSeconds: 120,
                        exerciseIds: ['S02'],
                        skippedIds: [],
                        userIds: ['u1', 'u2'],
                    }),
                ],
            ]],
            exerciseMap,
            userNameMap,
        });

        expect(days).toHaveLength(1);
        expect(days[0]).toMatchObject({
            date: '2026-03-08',
            sessionCount: 2,
            totalSeconds: 300,
            completedTotal: 4,
        });
        expect(days[0].items[0]).toMatchObject({
            userNames: ['ことり'],
            completedExercises: [
                { id: 'S01', name: '開脚', emoji: '🦵', count: 2 },
                { id: 'S02', name: '前屈', emoji: '🙇', count: 1 },
            ],
            skippedExercises: [
                { id: 'S03', name: '前後開脚', emoji: '🩰', count: 1 },
            ],
        });
        expect(days[0].items[1].userNames).toEqual(['ことり', 'ひなた']);
    });

    it('falls back gracefully when exercise names or user names are missing', () => {
        const days = buildRecordHistoryDays({
            groupedEntries: [[
                '2026-03-08',
                [createRecord({ exerciseIds: ['missing'], skippedIds: ['missing-2'], userIds: ['ghost'] })],
            ]],
            exerciseMap,
            userNameMap,
        });

        expect(days[0].items[0].userNames).toEqual([]);
        expect(days[0].items[0].completedExercises[0]).toMatchObject({
            id: 'missing',
            name: '種目',
            emoji: '🪄',
            count: 1,
        });
    });
});
