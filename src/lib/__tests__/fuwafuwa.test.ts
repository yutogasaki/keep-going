import { describe, it, expect, vi } from 'vitest';
import {
    APRIL_FUWAFUWA_TYPES,
    calculateFuwafuwaStatus,
    getFuwafuwaImagePath,
    isAprilDateKey,
    isMayDateKey,
    MAY_FUWAFUWA_TYPES,
    pickInitialFuwafuwaType,
    pickNextFuwafuwaType,
    FUWAFUWA_CYCLE_DAYS,
    FUWAFUWA_TYPE_COUNT,
} from '../fuwafuwa';
import type { SessionRecord } from '../db';

// Mock getTodayKey to control "today" in tests
vi.mock('../db', () => ({
    getTodayKey: vi.fn(() => '2026-03-05'),
}));

function makeSession(date: string, exerciseIds: string[] = ['ex1']): SessionRecord {
    return {
        id: `session-${date}`,
        date,
        startedAt: `${date}T10:00:00`,
        totalSeconds: 300,
        exerciseIds,
        skippedIds: [],
        userIds: ['user1'],
    };
}

describe('calculateFuwafuwaStatus', () => {
    it('returns egg stage when birthDate is null', () => {
        const result = calculateFuwafuwaStatus(null, []);
        expect(result).toEqual({
            stage: 1,
            scale: 1,
            isSayonara: false,
            daysAlive: 0,
            activeDays: 0,
        });
    });

    it('returns egg stage when birthDate is in the future', () => {
        const result = calculateFuwafuwaStatus('2026-03-10', []);
        expect(result.stage).toBe(1);
        expect(result.daysAlive).toBe(0);
    });

    it('Day 1-3: always egg regardless of activeDays', () => {
        const sessions = [
            makeSession('2026-03-03'),
            makeSession('2026-03-04'),
            makeSession('2026-03-05'),
        ];
        // birthDate = 2026-03-03, today = 2026-03-05 → daysAlive = 3
        const result = calculateFuwafuwaStatus('2026-03-03', sessions);
        expect(result.stage).toBe(1); // Still egg
        expect(result.daysAlive).toBe(3);
        expect(result.activeDays).toBe(3);
    });

    it('Day 4+: evolves to fairy with 2+ active days', () => {
        const sessions = [
            makeSession('2026-02-28'),
            makeSession('2026-03-01'),
        ];
        // birthDate = 2026-02-28, today = 2026-03-05 → daysAlive = 6
        const result = calculateFuwafuwaStatus('2026-02-28', sessions);
        expect(result.stage).toBe(2); // Fairy
        expect(result.daysAlive).toBe(6);
        expect(result.activeDays).toBe(2);
    });

    it('Day 4+: stays egg with only 1 active day', () => {
        const sessions = [makeSession('2026-02-28')];
        const result = calculateFuwafuwaStatus('2026-02-28', sessions);
        expect(result.stage).toBe(1); // Still egg
        expect(result.activeDays).toBe(1);
    });

    it('Day 15+: evolves to adult with 7+ active days', () => {
        // birthDate = 2026-02-15, today = 2026-03-05 → daysAlive = 19
        const sessions = Array.from({ length: 7 }, (_, i) => {
            const day = 15 + i;
            return makeSession(`2026-02-${day.toString().padStart(2, '0')}`);
        });
        const result = calculateFuwafuwaStatus('2026-02-15', sessions);
        expect(result.stage).toBe(3); // Adult
        expect(result.activeDays).toBe(7);
    });

    it('Day 15+: fairy stage with 2-6 active days', () => {
        const sessions = [
            makeSession('2026-02-15'),
            makeSession('2026-02-16'),
            makeSession('2026-02-17'),
        ];
        const result = calculateFuwafuwaStatus('2026-02-15', sessions);
        expect(result.stage).toBe(2); // Fairy (not enough for adult)
    });

    it('Day 29+: sayonara flag is set', () => {
        // birthDate = 2026-02-01, today = 2026-03-05 → daysAlive = 33
        const result = calculateFuwafuwaStatus('2026-02-01', []);
        expect(result.isSayonara).toBe(true);
        expect(result.daysAlive).toBeGreaterThan(FUWAFUWA_CYCLE_DAYS);
    });

    it('Day 29+: sayonara preserves stage based on activeDays', () => {
        const sessions = Array.from({ length: 7 }, (_, i) => {
            const day = 1 + i;
            return makeSession(`2026-02-${day.toString().padStart(2, '0')}`);
        });
        const result = calculateFuwafuwaStatus('2026-02-01', sessions);
        expect(result.isSayonara).toBe(true);
        expect(result.stage).toBe(3); // Adult even in sayonara
    });

    it('ignores sessions with 0 exercises', () => {
        const sessions = [
            makeSession('2026-02-28', []),
            makeSession('2026-03-01', []),
            makeSession('2026-03-02', ['ex1']),
        ];
        const result = calculateFuwafuwaStatus('2026-02-28', sessions);
        expect(result.activeDays).toBe(1); // Only 1 session had exercises
    });

    it('deduplicates sessions on the same day', () => {
        const sessions = [
            { ...makeSession('2026-02-28'), id: 'a' },
            { ...makeSession('2026-02-28'), id: 'b' },
            makeSession('2026-03-01'),
        ];
        const result = calculateFuwafuwaStatus('2026-02-28', sessions);
        expect(result.activeDays).toBe(2); // 2 unique dates, not 3 sessions
    });

    it('fairy scale varies with activeDays (3 or fewer → 0.7)', () => {
        const sessions = [
            makeSession('2026-02-26'),
            makeSession('2026-02-27'),
        ];
        // daysAlive = 8, activeDays = 2
        const result = calculateFuwafuwaStatus('2026-02-26', sessions);
        expect(result.stage).toBe(2);
        expect(result.scale).toBe(0.7);
    });
});

describe('pickNextFuwafuwaType', () => {
    it('picks from unused types', () => {
        const past = [{ id: '1', type: 0, name: null, activeDays: 5, finalStage: 3, sayonaraDate: '2026-02-01' }];
        const result = pickNextFuwafuwaType(past, 1);
        expect(result).not.toBe(0);
        expect(result).not.toBe(1);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(FUWAFUWA_TYPE_COUNT);
    });

    it('excludes current type', () => {
        const results = new Set<number>();
        for (let i = 0; i < 100; i++) {
            results.add(pickNextFuwafuwaType([], 5));
        }
        expect(results.has(5)).toBe(false);
    });

    it('when all types used, allows duplicates including the current type', () => {
        const past = Array.from({ length: FUWAFUWA_TYPE_COUNT }, (_, i) => ({
            id: `${i}`,
            type: i,
            name: null,
            activeDays: 5,
            finalStage: 3,
            sayonaraDate: '2026-02-01',
        }));
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.35);

        const result = pickNextFuwafuwaType(past, 3);

        expect(result).toBe(3);
        randomSpy.mockRestore();
    });

    it('biases April births toward the April types', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.2)
            .mockReturnValueOnce(0.99);

        const result = pickNextFuwafuwaType([], 0, '2026-04-10');

        expect(APRIL_FUWAFUWA_TYPES).toContain(result as typeof APRIL_FUWAFUWA_TYPES[number]);
        expect(result).toBe(11);
        randomSpy.mockRestore();
    });

    it('falls back to non-April types when the April roll misses', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.95)
            .mockReturnValueOnce(0);

        const result = pickNextFuwafuwaType([], 10, '2026-04-10');

        expect(result).toBe(0);
        randomSpy.mockRestore();
    });

    it('biases May births toward the May types', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.2)
            .mockReturnValueOnce(0.99);

        const result = pickNextFuwafuwaType([], 0, '2026-05-05');

        expect(MAY_FUWAFUWA_TYPES).toContain(result as typeof MAY_FUWAFUWA_TYPES[number]);
        expect(result).toBe(13);
        randomSpy.mockRestore();
    });

    it('falls back to non-May types when the May roll misses', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.95)
            .mockReturnValueOnce(0);

        const result = pickNextFuwafuwaType([], 12, '2026-05-05');

        expect(result).toBe(0);
        randomSpy.mockRestore();
    });

    it('keeps other seasonal types out of a seasonal month fallback', () => {
        const randomSpy = vi.spyOn(Math, 'random')
            .mockReturnValueOnce(0.95)
            .mockReturnValueOnce(0.99);

        const result = pickNextFuwafuwaType([], 0, '2026-05-05');

        expect(result).toBe(9);
        expect(APRIL_FUWAFUWA_TYPES).not.toContain(result as typeof APRIL_FUWAFUWA_TYPES[number]);
        randomSpy.mockRestore();
    });

    it('allows seasonal types when only seasonal types remain unused', () => {
        const past = [
            ...Array.from({ length: 10 }, (_, i) => ({
                id: `base-${i}`,
                type: i,
                name: null,
                activeDays: 5,
                finalStage: 3,
                sayonaraDate: '2026-02-01',
            })),
            { id: 'april-cloud', type: 11, name: null, activeDays: 5, finalStage: 3, sayonaraDate: '2026-02-01' },
            { id: 'may-gw', type: 13, name: null, activeDays: 5, finalStage: 3, sayonaraDate: '2026-02-01' },
        ];

        const result = pickNextFuwafuwaType(past, 10, '2026-03-10');

        expect(result).toBe(12);
    });
});

describe('pickInitialFuwafuwaType', () => {
    it('uses regular types first outside seasonal months', () => {
        const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.95);

        const result = pickInitialFuwafuwaType('2026-03-10');

        expect(result).toBe(9);
        randomSpy.mockRestore();
    });
});

describe('fuwafuwa helpers', () => {
    it('detects April and May from date keys', () => {
        expect(isAprilDateKey('2026-04-01')).toBe(true);
        expect(isAprilDateKey('2026-03-31')).toBe(false);
        expect(isMayDateKey('2026-05-01')).toBe(true);
        expect(isMayDateKey('2026-04-30')).toBe(false);
    });

    it('uses seasonal filenames for special types', () => {
        expect(getFuwafuwaImagePath(10, 2)).toBe('/ikimono/april-petal-2.webp');
        expect(getFuwafuwaImagePath(11, 3)).toBe('/ikimono/april-cloud-3.webp');
        expect(getFuwafuwaImagePath(12, 2)).toBe('/ikimono/may-koinobori-2.webp');
        expect(getFuwafuwaImagePath(13, 3)).toBe('/ikimono/may-gw-3.webp');
        expect(getFuwafuwaImagePath(5, 1)).toBe('/ikimono/5-1.webp');
    });
});
