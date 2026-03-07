import { describe, expect, it } from 'vitest';
import {
    countSessionIds,
    getSessionCompletedExerciseTotal,
    getSessionExerciseCounts,
    getSessionSkippedCounts,
    hasCompletedExercises,
    normalizeSessionRecord,
} from '../sessionRecords';

describe('countSessionIds', () => {
    it('counts duplicate ids', () => {
        expect(countSessionIds(['S01', 'S02', 'S01'])).toEqual({
            S01: 2,
            S02: 1,
        });
    });

    it('returns an empty object for empty arrays', () => {
        expect(countSessionIds([])).toEqual({});
    });
});

describe('normalizeSessionRecord', () => {
    it('derives completed and skipped counts from ids', () => {
        const record = normalizeSessionRecord({
            id: 'session-1',
            date: '2026-03-07',
            startedAt: '2026-03-07T10:00:00.000Z',
            totalSeconds: 180,
            exerciseIds: ['S01', 'S02', 'S01'],
            skippedIds: ['S03', 'S03'],
            userIds: ['user-1'],
        });

        expect(record.exerciseCounts).toEqual({ S01: 2, S02: 1 });
        expect(record.skippedCounts).toEqual({ S03: 2 });
    });

    it('recomputes mismatched stored counts to keep records consistent', () => {
        const record = normalizeSessionRecord({
            id: 'session-2',
            date: '2026-03-07',
            startedAt: '2026-03-07T11:00:00.000Z',
            totalSeconds: 60,
            exerciseIds: ['S01'],
            skippedIds: [],
            exerciseCounts: { S01: 99 },
            skippedCounts: { S02: 5 },
        });

        expect(record.exerciseCounts).toEqual({ S01: 1 });
        expect(record.skippedCounts).toEqual({});
    });
});

describe('session count helpers', () => {
    const session = {
        exerciseIds: ['S01', 'S02', 'S01'],
        skippedIds: ['S03', 'S03', 'S04'],
    };

    it('returns completed count maps', () => {
        expect(getSessionExerciseCounts(session)).toEqual({ S01: 2, S02: 1 });
    });

    it('returns skipped count maps', () => {
        expect(getSessionSkippedCounts(session)).toEqual({ S03: 2, S04: 1 });
    });

    it('returns the total completed exercise count', () => {
        expect(getSessionCompletedExerciseTotal(session)).toBe(3);
    });

    it('detects whether a session has any completed exercise', () => {
        expect(hasCompletedExercises(session)).toBe(true);
        expect(hasCompletedExercises({ exerciseIds: [], skippedIds: ['S03'] })).toBe(false);
    });
});
