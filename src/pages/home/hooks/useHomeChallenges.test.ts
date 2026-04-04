import { describe, expect, it } from 'vitest';
import { getMsUntilNextHomeChallengeDayBoundary } from './useHomeChallenges';

describe('getMsUntilNextHomeChallengeDayBoundary', () => {
    it('returns the remaining time until 3AM when before the boundary', () => {
        const now = new Date(2026, 3, 5, 2, 30, 0, 0);

        expect(getMsUntilNextHomeChallengeDayBoundary(now)).toBe(30 * 60 * 1000);
    });

    it('returns the time until the next day boundary when already past 3AM', () => {
        const now = new Date(2026, 3, 5, 3, 30, 0, 0);

        expect(getMsUntilNextHomeChallengeDayBoundary(now)).toBe((23 * 60 + 30) * 60 * 1000);
    });
});
