import { describe, expect, it } from 'vitest';
import {
    getFamilyVisitMemoryKey,
    getHomeVisitRecency,
} from './homeVisitMemory';

describe('homeVisitMemory', () => {
    it('sorts and deduplicates family visit keys', () => {
        expect(getFamilyVisitMemoryKey(['user-2', 'user-1', 'user-2', ''])).toBe('user-1|user-2');
    });

    it('buckets home visit recency by elapsed time', () => {
        const now = new Date('2026-03-11T09:00:00.000Z').getTime();

        expect(getHomeVisitRecency(null, now)).toBe('first');
        expect(getHomeVisitRecency('2026-03-11T08:50:00.000Z', now)).toBe('recent');
        expect(getHomeVisitRecency('2026-03-10T21:00:00.000Z', now)).toBe('today');
        expect(getHomeVisitRecency('2026-03-09T08:59:59.000Z', now)).toBe('returning');
        expect(getHomeVisitRecency('invalid', now)).toBe('first');
    });
});
