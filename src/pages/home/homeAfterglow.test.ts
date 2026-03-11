import { describe, expect, it } from 'vitest';
import { getFamilyHomeContextKey, getSoloHomeContextKey } from './homeAfterglow';

describe('homeAfterglow', () => {
    it('builds stable context keys for solo and family home states', () => {
        expect(getSoloHomeContextKey('user-1')).toBe('solo:user-1');
        expect(getSoloHomeContextKey('')).toBe('');
        expect(getFamilyHomeContextKey(['user-2', 'user-1', 'user-2'])).toBe('family:user-1|user-2');
    });
});
