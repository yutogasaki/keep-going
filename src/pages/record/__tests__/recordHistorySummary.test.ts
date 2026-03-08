import { describe, expect, it } from 'vitest';
import {
    buildRecordHistoryDays,
    buildRecordInsightSummary,
    buildRecordParticipantSummaries,
} from '../recordHistorySummary';
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
            skippedTotal: 1,
        });
        expect(days[0].items[0]).toMatchObject({
            sessionLabel: 'ひとり',
            skippedTotal: 1,
            userNames: ['ことり'],
            completedExercises: [
                { id: 'S01', name: '開脚', emoji: '🦵', count: 2 },
                { id: 'S02', name: '前屈', emoji: '🙇', count: 1 },
            ],
            skippedExercises: [
                { id: 'S03', name: '前後開脚', emoji: '🩰', count: 1 },
            ],
        });
        expect(days[0].items[1].sessionLabel).toBe('みんなで');
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

describe('buildRecordParticipantSummaries', () => {
    it('aggregates joined sessions per user', () => {
        const summaries = buildRecordParticipantSummaries({
            sessions: [
                createRecord(),
                createRecord({
                    id: 'session-2',
                    totalSeconds: 240,
                    userIds: ['u1', 'u2'],
                }),
            ],
            userNameMap,
        });

        expect(summaries).toEqual([
            { id: 'u1', name: 'ことり', sessionCount: 2, totalSeconds: 420 },
            { id: 'u2', name: 'ひなた', sessionCount: 1, totalSeconds: 240 },
        ]);
    });
});

describe('buildRecordInsightSummary', () => {
    it('builds focus and detail lines for parent/teacher summary cards', () => {
        const summary = buildRecordInsightSummary({
            viewUserNames: ['ことり', 'ひなた'],
            totalSessions: 4,
            totalMinutes: 11,
            uniqueDays: 2,
            skippedTotal: 3,
            topExercise: { name: '前屈', count: 5 },
            participantSummaries: [
                { id: 'u1', name: 'ことり', sessionCount: 3, totalSeconds: 420 },
                { id: 'u2', name: 'ひなた', sessionCount: 2, totalSeconds: 300 },
                { id: 'u3', name: 'あおい', sessionCount: 1, totalSeconds: 120 },
                { id: 'u4', name: 'そら', sessionCount: 1, totalSeconds: 60 },
            ],
        });

        expect(summary.focusLabel).toBe('ことり・ひなたの記録');
        expect(summary.summaryLine).toBe('2日で4回、合計11分の記録です。');
        expect(summary.detailLine).toContain('よくやったのは 前屈 5回');
        expect(summary.detailLine).toContain('おやすみは 3回');
        expect(summary.participants).toHaveLength(3);
    });
});
