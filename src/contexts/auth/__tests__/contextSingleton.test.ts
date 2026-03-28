import { describe, expect, it } from 'vitest';
import { getSingletonContext } from '../contextSingleton';

describe('getSingletonContext', () => {
    it('returns the same context instance for the same key', () => {
        const first = getSingletonContext('auth', null);
        const second = getSingletonContext('auth', 'different-default');

        expect(first).toBe(second);
    });

    it('keeps different keys isolated', () => {
        const authContext = getSingletonContext('auth-2', null);
        const otherContext = getSingletonContext('other', null);

        expect(authContext).not.toBe(otherContext);
    });
});
