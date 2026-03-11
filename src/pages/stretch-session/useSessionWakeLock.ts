import { useCallback, useEffect, useRef } from 'react';
import {
    canRequestSessionWakeLock,
    shouldReacquireSessionWakeLock,
} from './sessionWakeLockHelpers';

interface ScreenWakeLockSentinelLike {
    released: boolean;
    release: () => Promise<void>;
    addEventListener?: (type: 'release', listener: () => void) => void;
    removeEventListener?: (type: 'release', listener: () => void) => void;
}

interface ScreenWakeLockNavigatorLike {
    wakeLock?: {
        request: (type: 'screen') => Promise<ScreenWakeLockSentinelLike>;
    };
}

interface UseSessionWakeLockParams {
    enabled: boolean;
}

export function useSessionWakeLock({ enabled }: UseSessionWakeLockParams) {
    const sentinelRef = useRef<ScreenWakeLockSentinelLike | null>(null);
    const requestInFlightRef = useRef(false);
    const enabledRef = useRef(enabled);
    const releaseListenerCleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        enabledRef.current = enabled;
    }, [enabled]);

    const detachReleaseListener = useCallback(() => {
        releaseListenerCleanupRef.current?.();
        releaseListenerCleanupRef.current = null;
    }, []);

    const releaseWakeLock = useCallback(async () => {
        const sentinel = sentinelRef.current;
        detachReleaseListener();
        sentinelRef.current = null;

        if (!sentinel || sentinel.released) {
            return;
        }

        try {
            await sentinel.release();
        } catch (error) {
            console.warn('[sessionWakeLock] release failed:', error);
        }
    }, [detachReleaseListener]);

    const requestWakeLock = useCallback(async () => {
        if (typeof document === 'undefined' || typeof navigator === 'undefined') {
            return;
        }

        const wakeLockNavigator = navigator as Navigator & ScreenWakeLockNavigatorLike;
        const hasActiveSentinel = Boolean(sentinelRef.current && !sentinelRef.current.released);
        const shouldRequest = canRequestSessionWakeLock({
            enabled: enabledRef.current,
            visibilityState: document.visibilityState,
            hasWakeLockApi: Boolean(wakeLockNavigator.wakeLock),
            hasActiveSentinel,
            isRequestPending: requestInFlightRef.current,
        });

        if (!shouldRequest || !wakeLockNavigator.wakeLock) {
            return;
        }

        requestInFlightRef.current = true;

        try {
            const sentinel = await wakeLockNavigator.wakeLock.request('screen');
            sentinelRef.current = sentinel;
            detachReleaseListener();

            if (typeof sentinel.addEventListener === 'function' && typeof sentinel.removeEventListener === 'function') {
                const handleRelease = () => {
                    if (sentinelRef.current === sentinel) {
                        sentinelRef.current = null;
                    }
                    detachReleaseListener();

                    if (typeof document === 'undefined') {
                        return;
                    }

                    if (shouldReacquireSessionWakeLock({
                        enabled: enabledRef.current,
                        visibilityState: document.visibilityState,
                    })) {
                        void requestWakeLock();
                    }
                };

                sentinel.addEventListener('release', handleRelease);
                releaseListenerCleanupRef.current = () => sentinel.removeEventListener?.('release', handleRelease);
            }
        } catch (error) {
            console.warn('[sessionWakeLock] request failed:', error);
        } finally {
            requestInFlightRef.current = false;
        }
    }, [detachReleaseListener]);

    useEffect(() => {
        if (!enabled) {
            void releaseWakeLock();
            return;
        }

        void requestWakeLock();

        const handleVisibilityChange = () => {
            if (typeof document === 'undefined') {
                return;
            }

            if (document.visibilityState === 'visible') {
                void requestWakeLock();
                return;
            }

            void releaseWakeLock();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            void releaseWakeLock();
        };
    }, [enabled, releaseWakeLock, requestWakeLock]);
}
