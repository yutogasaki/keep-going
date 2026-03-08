import { useCallback, useEffect, useRef, useState } from 'react';
import { shouldIgnoreInitialHintInteraction } from './sessionControlsHintUtils';

interface UseSessionControlsHintParams {
    hasSeenSessionControlsHint: boolean;
    isBigBreak: boolean;
    isCompleted: boolean;
    isCounting: boolean;
    isLoading: boolean;
    setHasSeenSessionControlsHint: (seen: boolean) => void;
}

export function useSessionControlsHint({
    hasSeenSessionControlsHint,
    isBigBreak,
    isCompleted,
    isCounting,
    isLoading,
    setHasSeenSessionControlsHint,
}: UseSessionControlsHintParams) {
    const [controlsHintPending, setControlsHintPending] = useState(() => !hasSeenSessionControlsHint);
    const controlsHintOpenedAtRef = useRef<number | null>(null);
    const showControlsHint = controlsHintPending && !isBigBreak && !isCounting && !isCompleted && !isLoading;

    useEffect(() => {
        if (hasSeenSessionControlsHint) {
            setControlsHintPending(false);
        }
    }, [hasSeenSessionControlsHint]);

    const dismissControlsHint = useCallback(() => {
        setControlsHintPending(false);
        controlsHintOpenedAtRef.current = null;
        if (!hasSeenSessionControlsHint) {
            setHasSeenSessionControlsHint(true);
        }
    }, [hasSeenSessionControlsHint, setHasSeenSessionControlsHint]);

    useEffect(() => {
        if (showControlsHint) {
            controlsHintOpenedAtRef.current = performance.now();
            return;
        }

        controlsHintOpenedAtRef.current = null;
    }, [showControlsHint]);

    useEffect(() => {
        if (!showControlsHint) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            dismissControlsHint();
        }, 7000);

        return () => window.clearTimeout(timeoutId);
    }, [dismissControlsHint, showControlsHint]);

    const runHintAwareAction = useCallback(function <Args extends unknown[]>(
        action: (...args: Args) => void,
        ...args: Args
    ) {
        if (showControlsHint) {
            if (shouldIgnoreInitialHintInteraction(controlsHintOpenedAtRef.current, performance.now())) {
                return;
            }
            dismissControlsHint();
            return;
        }
        action(...args);
    }, [dismissControlsHint, showControlsHint]);

    return {
        dismissControlsHint,
        runHintAwareAction,
        showControlsHint,
    };
}
