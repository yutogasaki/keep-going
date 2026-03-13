import { describe, expect, it, vi } from 'vitest';
import { loadHistoricalSessionsSafely } from '../useSessionSetup';

describe('loadHistoricalSessionsSafely', () => {
    it('returns loaded sessions when the loader succeeds', async () => {
        const sessions = await loadHistoricalSessionsSafely(async () => [{
            id: 'session-1',
            date: '2026-03-07',
            startedAt: '2026-03-07T10:00:00Z',
            totalSeconds: 120,
            exerciseIds: ['S01'],
            skippedIds: [],
        }]);

        expect(sessions).toEqual([expect.objectContaining({
            id: 'session-1',
            totalSeconds: 120,
        })]);
    });

    it('falls back to an empty history when the loader rejects', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const sessions = await loadHistoricalSessionsSafely(async () => {
            throw new Error('history unavailable');
        });

        expect(sessions).toEqual([]);
        expect(warnSpy).toHaveBeenCalledWith(
            '[sessionSetup] Failed to load session history:',
            expect.any(Error),
        );
    });
});
