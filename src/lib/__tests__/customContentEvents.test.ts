import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    dispatchCustomContentUpdated,
    subscribeCustomContentUpdated,
} from '../customContentEvents';

describe('customContentEvents', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('notifies subscribed listeners when custom content changes', () => {
        const eventTarget = new EventTarget();
        vi.stubGlobal('window', eventTarget);
        const listener = vi.fn();

        const unsubscribe = subscribeCustomContentUpdated(listener);
        dispatchCustomContentUpdated();
        unsubscribe();
        dispatchCustomContentUpdated();

        expect(listener).toHaveBeenCalledTimes(1);
    });

    it('is a no-op when window is unavailable', () => {
        vi.stubGlobal('window', undefined);
        const listener = vi.fn();

        const unsubscribe = subscribeCustomContentUpdated(listener);
        dispatchCustomContentUpdated();
        unsubscribe();

        expect(listener).not.toHaveBeenCalled();
    });
});
