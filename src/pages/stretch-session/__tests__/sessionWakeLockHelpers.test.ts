import { describe, expect, it } from 'vitest';
import {
    canRequestSessionWakeLock,
    shouldReacquireSessionWakeLock,
} from '../sessionWakeLockHelpers';

describe('sessionWakeLockHelpers', () => {
    it('requests wake lock only when the session is active and visible', () => {
        expect(canRequestSessionWakeLock({
            enabled: true,
            visibilityState: 'visible',
            hasWakeLockApi: true,
            hasActiveSentinel: false,
            isRequestPending: false,
        })).toBe(true);

        expect(canRequestSessionWakeLock({
            enabled: false,
            visibilityState: 'visible',
            hasWakeLockApi: true,
            hasActiveSentinel: false,
            isRequestPending: false,
        })).toBe(false);

        expect(canRequestSessionWakeLock({
            enabled: true,
            visibilityState: 'hidden',
            hasWakeLockApi: true,
            hasActiveSentinel: false,
            isRequestPending: false,
        })).toBe(false);
    });

    it('skips duplicate requests when unsupported, already held, or pending', () => {
        expect(canRequestSessionWakeLock({
            enabled: true,
            visibilityState: 'visible',
            hasWakeLockApi: false,
            hasActiveSentinel: false,
            isRequestPending: false,
        })).toBe(false);

        expect(canRequestSessionWakeLock({
            enabled: true,
            visibilityState: 'visible',
            hasWakeLockApi: true,
            hasActiveSentinel: true,
            isRequestPending: false,
        })).toBe(false);

        expect(canRequestSessionWakeLock({
            enabled: true,
            visibilityState: 'visible',
            hasWakeLockApi: true,
            hasActiveSentinel: false,
            isRequestPending: true,
        })).toBe(false);
    });

    it('reacquires only for active visible sessions', () => {
        expect(shouldReacquireSessionWakeLock({
            enabled: true,
            visibilityState: 'visible',
        })).toBe(true);

        expect(shouldReacquireSessionWakeLock({
            enabled: true,
            visibilityState: 'hidden',
        })).toBe(false);

        expect(shouldReacquireSessionWakeLock({
            enabled: false,
            visibilityState: 'visible',
        })).toBe(false);
    });
});
