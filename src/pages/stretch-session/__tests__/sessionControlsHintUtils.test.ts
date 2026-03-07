import { describe, expect, it } from 'vitest';
import {
    CONTROLS_HINT_INTERACTION_GUARD_MS,
    shouldIgnoreInitialHintInteraction,
} from '../sessionControlsHintUtils';

describe('shouldIgnoreInitialHintInteraction', () => {
    it('returns false when the hint has not opened yet', () => {
        expect(shouldIgnoreInitialHintInteraction(null, 1000)).toBe(false);
    });

    it('ignores interactions during the guard window', () => {
        expect(shouldIgnoreInitialHintInteraction(1000, 1000)).toBe(true);
        expect(
            shouldIgnoreInitialHintInteraction(1000, 1000 + CONTROLS_HINT_INTERACTION_GUARD_MS - 1),
        ).toBe(true);
    });

    it('allows interactions after the guard window', () => {
        expect(
            shouldIgnoreInitialHintInteraction(1000, 1000 + CONTROLS_HINT_INTERACTION_GUARD_MS),
        ).toBe(false);
    });
});
