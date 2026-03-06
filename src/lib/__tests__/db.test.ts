import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDateKey, parseDateKey, shiftDateKey, calculateStreak } from '../db';

// getTodayKey / getDateKeyOffset depend on Date.now(), tested via vi.useFakeTimers

describe('formatDateKey', () => {
    it('formats a date as YYYY-MM-DD', () => {
        expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('zero-pads month and day', () => {
        expect(formatDateKey(new Date(2026, 2, 9))).toBe('2026-03-09');
    });

    it('handles Dec 31', () => {
        expect(formatDateKey(new Date(2025, 11, 31))).toBe('2025-12-31');
    });
});

describe('parseDateKey', () => {
    it('parses a valid date key', () => {
        const d = parseDateKey('2026-03-15');
        expect(d).not.toBeNull();
        expect(d!.getFullYear()).toBe(2026);
        expect(d!.getMonth()).toBe(2); // March = 2
        expect(d!.getDate()).toBe(15);
    });

    it('returns null for invalid format', () => {
        expect(parseDateKey('2026-3-5')).toBeNull();
        expect(parseDateKey('not-a-date')).toBeNull();
        expect(parseDateKey('')).toBeNull();
    });

    it('roundtrips with formatDateKey', () => {
        const original = new Date(2026, 5, 20);
        const key = formatDateKey(original);
        const parsed = parseDateKey(key);
        expect(parsed).not.toBeNull();
        expect(formatDateKey(parsed!)).toBe(key);
    });
});

describe('shiftDateKey', () => {
    it('shifts forward by 1 day', () => {
        expect(shiftDateKey('2026-03-06', 1)).toBe('2026-03-07');
    });

    it('shifts backward by 1 day', () => {
        expect(shiftDateKey('2026-03-06', -1)).toBe('2026-03-05');
    });

    it('crosses month boundary', () => {
        expect(shiftDateKey('2026-01-31', 1)).toBe('2026-02-01');
    });

    it('crosses year boundary', () => {
        expect(shiftDateKey('2025-12-31', 1)).toBe('2026-01-01');
    });

    it('returns original key for invalid input', () => {
        expect(shiftDateKey('bad', 1)).toBe('bad');
    });
});

describe('getTodayKey / getDateKeyOffset (3AM boundary)', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('at 2:59 AM, "today" is still yesterday', async () => {
        // March 6 at 2:59 AM → adjusted to March 5 at 23:59 → key = 2026-03-05
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 6, 2, 59, 0));

        const { getTodayKey } = await import('../db');
        expect(getTodayKey()).toBe('2026-03-05');
    });

    it('at 3:00 AM, "today" flips to the current calendar date', async () => {
        // March 6 at 3:00 AM → adjusted to March 6 at 0:00 → key = 2026-03-06
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 6, 3, 0, 0));

        const { getTodayKey } = await import('../db');
        expect(getTodayKey()).toBe('2026-03-06');
    });

    it('at 11:59 PM, "today" is the current calendar date', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 6, 23, 59, 0));

        const { getTodayKey } = await import('../db');
        expect(getTodayKey()).toBe('2026-03-06');
    });

    it('getDateKeyOffset(-1) returns yesterday relative to 3AM boundary', async () => {
        vi.useFakeTimers();
        // March 6 at 10:00 AM → today = 2026-03-06, yesterday = 2026-03-05
        vi.setSystemTime(new Date(2026, 2, 6, 10, 0, 0));

        const { getDateKeyOffset } = await import('../db');
        expect(getDateKeyOffset(-1)).toBe('2026-03-05');
    });
});

describe('calculateStreak', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    function setupTime(hour: number, day: number = 6) {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, day, hour, 0, 0));
    }

    function sessions(...dates: string[]) {
        return dates.map(d => ({ date: d }));
    }

    it('returns 0 for empty sessions', () => {
        setupTime(10);
        expect(calculateStreak([])).toBe(0);
    });

    it('returns 0 when streak is broken (gap > 1 day)', () => {
        setupTime(10);
        // today = 2026-03-06, last session = 2026-03-04 → broken
        expect(calculateStreak(sessions('2026-03-04'))).toBe(0);
    });

    it('returns 1 for a session today only', () => {
        setupTime(10);
        expect(calculateStreak(sessions('2026-03-06'))).toBe(1);
    });

    it('returns 1 for a session yesterday only', () => {
        setupTime(10);
        expect(calculateStreak(sessions('2026-03-05'))).toBe(1);
    });

    it('counts consecutive days from today', () => {
        setupTime(10);
        // 3 consecutive days: today, yesterday, day before
        expect(calculateStreak(sessions('2026-03-06', '2026-03-05', '2026-03-04'))).toBe(3);
    });

    it('counts consecutive days starting from yesterday', () => {
        setupTime(10);
        // No session today, but 2 consecutive from yesterday
        expect(calculateStreak(sessions('2026-03-05', '2026-03-04'))).toBe(2);
    });

    it('deduplicates multiple sessions on same day', () => {
        setupTime(10);
        expect(calculateStreak(sessions('2026-03-06', '2026-03-06', '2026-03-05'))).toBe(2);
    });

    it('stops counting at gap', () => {
        setupTime(10);
        // today + yesterday + gap + 2 days ago
        expect(calculateStreak(sessions('2026-03-06', '2026-03-05', '2026-03-03'))).toBe(2);
    });

    it('handles unsorted input', () => {
        setupTime(10);
        expect(calculateStreak(sessions('2026-03-04', '2026-03-06', '2026-03-05'))).toBe(3);
    });

    it('respects 3AM boundary: at 2:59AM, "today" is still yesterday', () => {
        setupTime(2); // 2:00 AM on March 6 → today = 2026-03-05
        expect(calculateStreak(sessions('2026-03-05'))).toBe(1);
        expect(calculateStreak(sessions('2026-03-06'))).toBe(0);
    });
});
