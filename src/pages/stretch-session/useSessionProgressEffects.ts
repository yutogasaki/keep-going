import { useCallback, useEffect, useRef, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
const lazyConfetti = () => import('canvas-confetti').then((m) => m.default);
import type { Exercise } from '../../data/exercises';
import { audio } from '../../lib/audio';
import { haptics } from '../../lib/haptics';
import { getExerciseCompletionState, getSessionSideCue } from './sessionProgressHelpers';

interface UseSessionProgressEffectsParams {
    isLoading: boolean;
    sessionExercises: Exercise[];
    currentExercise: Exercise | undefined;
    currentIndex: number;
    timeLeft: number;
    isCounting: boolean;
    isPlaying: boolean;
    isTransitioning: boolean;
    transitionTime: number;
    isBigBreak: boolean;
    isCompleted: boolean;
    totalRunningTime: number;
    hasLRSplit: boolean;
    isPointFlex: boolean;
    halfTime: number;
    setTimeLeft: Dispatch<SetStateAction<number>>;
    setIsTransitioning: Dispatch<SetStateAction<boolean>>;
    setTransitionTime: Dispatch<SetStateAction<number>>;
    setCurrentSide: Dispatch<SetStateAction<'right' | 'left' | null>>;
    setShowSideSwitch: Dispatch<SetStateAction<boolean>>;
    setIsPlaying: Dispatch<SetStateAction<boolean>>;
    setIsCounting: Dispatch<SetStateAction<boolean>>;
    setIsBigBreak: Dispatch<SetStateAction<boolean>>;
    setTotalRunningTime: Dispatch<SetStateAction<number>>;
    setCompletedIds: Dispatch<SetStateAction<string[]>>;
    setCurrentIndex: Dispatch<SetStateAction<number>>;
    setIsCompleted: Dispatch<SetStateAction<boolean>>;
    onSessionFinished: () => void;
    onAutoCompleteSaveRef: MutableRefObject<() => Promise<void> | void>;
}

interface UseSessionProgressEffectsResult {
    goToNext: () => void;
}

export function useSessionProgressEffects({
    isLoading,
    sessionExercises,
    currentExercise,
    currentIndex,
    timeLeft,
    isCounting,
    isPlaying,
    isTransitioning,
    transitionTime,
    isBigBreak,
    isCompleted,
    totalRunningTime,
    hasLRSplit,
    isPointFlex,
    halfTime,
    setTimeLeft,
    setIsTransitioning,
    setTransitionTime,
    setCurrentSide,
    setShowSideSwitch,
    setIsPlaying,
    setIsCounting,
    setIsBigBreak,
    setTotalRunningTime,
    setCompletedIds,
    setCurrentIndex,
    setIsCompleted,
    onSessionFinished,
    onAutoCompleteSaveRef,
}: UseSessionProgressEffectsParams): UseSessionProgressEffectsResult {
    const wasPlayingBeforeHiddenRef = useRef(false);
    const goToNextRef = useRef<() => void>(() => { });
    const completionTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isLoading && sessionExercises.length > 0) {
            setTimeLeft(sessionExercises[0].sec);
        }
    }, [isLoading, sessionExercises, setTimeLeft]);

    useEffect(() => {
        if (!currentExercise) {
            return;
        }

        const elapsed = currentExercise.sec - timeLeft;
        if (elapsed > 0 && elapsed % 10 === 0 && timeLeft > 3 && !isTransitioning && !isCounting) {
            audio.playTick();
        }

        if (isCounting) {
            return;
        }

        const cue = getSessionSideCue({
            currentExercise,
            timeLeft,
            hasLRSplit,
            isPointFlex,
            halfTime,
        });
        setCurrentSide(cue.currentSide);
        setShowSideSwitch(cue.showSideSwitch);

        if (cue.announcement) {
            audio.speak(cue.announcement);
            haptics.pulse();
        }

        if (!cue.showSideSwitch || !cue.hideDelayMs) {
            return;
        }

        const timer = setTimeout(() => setShowSideSwitch(false), cue.hideDelayMs);
        return () => clearTimeout(timer);
    }, [
        timeLeft,
        hasLRSplit,
        currentExercise,
        halfTime,
        isTransitioning,
        isCounting,
        isPointFlex,
        setCurrentSide,
        setShowSideSwitch,
    ]);

    useEffect(() => {
        setCurrentSide(hasLRSplit ? 'right' : null);
        setShowSideSwitch(false);
    }, [currentIndex, hasLRSplit, setCurrentSide, setShowSideSwitch]);

    useEffect(() => {
        if (isCounting || !isPlaying || isTransitioning || isBigBreak || isCompleted || !currentExercise) {
            return;
        }

        if (timeLeft <= 0) {
            const completion = getExerciseCompletionState({
                currentExercise,
                totalRunningTime,
                nextExercise: sessionExercises[currentIndex + 1],
            });

            if (completion.shouldTrackCompletion) {
                setTotalRunningTime(completion.nextTotalRunningTime);
                setCompletedIds((prev) => [...prev, currentExercise.id]);
            }

            if (completion.breakType === 'big') {
                audio.playSuccess();
                setIsBigBreak(true);
                setIsPlaying(false);
                return;
            }

            if (completion.shouldPulseTransition) {
                audio.playTransition();
                haptics.pulse();
            }
            if (completion.nextExerciseAnnouncement) {
                audio.speak(completion.nextExerciseAnnouncement);
            }

            setIsTransitioning(true);
            setTransitionTime(completion.transitionSeconds);
            return;
        }

        if (timeLeft === 10 && currentExercise.placement !== 'rest') {
            audio.speak('残り10秒です');
        }

        if (timeLeft > 0 && timeLeft <= 5) {
            audio.speak(timeLeft.toString());
        }

        if (timeLeft > 0 && timeLeft <= 3) {
            audio.playTick();
            haptics.tick();
        }

        const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [
        timeLeft,
        isCounting,
        isPlaying,
        isTransitioning,
        isBigBreak,
        isCompleted,
        totalRunningTime,
        currentExercise,
        currentIndex,
        sessionExercises,
        setTotalRunningTime,
        setCompletedIds,
        setIsBigBreak,
        setIsPlaying,
        setIsTransitioning,
        setTransitionTime,
        setTimeLeft,
    ]);

    useEffect(() => {
        if (!isTransitioning) {
            return;
        }

        if (transitionTime <= 0) {
            audio.playGo();
            goToNextRef.current();
            return;
        }

        if (transitionTime > 0 && transitionTime <= 3) {
            audio.playTick();
        }

        const timer = setTimeout(() => setTransitionTime((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [transitionTime, isTransitioning, setTransitionTime]);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                wasPlayingBeforeHiddenRef.current = isPlaying && !isCounting && !isTransitioning && !isBigBreak && !isCompleted;
                setIsPlaying(false);
            } else if (document.visibilityState === 'visible') {
                if (currentExercise && wasPlayingBeforeHiddenRef.current) {
                    setIsCounting(true);
                    setIsTransitioning(false);
                    audio.speak('再開します。');
                }
                wasPlayingBeforeHiddenRef.current = false;
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [currentExercise, isPlaying, isCounting, isTransitioning, isBigBreak, isCompleted, setIsPlaying, setIsCounting, setIsTransitioning]);

    useEffect(() => {
        return () => {
            if (completionTimerRef.current) {
                clearTimeout(completionTimerRef.current);
            }
        };
    }, []);

    const goToNext = useCallback(() => {
        setIsTransitioning(false);
        const nextIndex = currentIndex + 1;
        if (nextIndex >= sessionExercises.length) {
            audio.playSuccess();
            haptics.success();
            lazyConfetti().then((confetti) => confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD5C8', '#2BBAA0', '#FFF5F0', '#B8E6D4'],
                disableForReducedMotion: true,
            }));
            setIsCompleted(true);
            setIsPlaying(false);
            onAutoCompleteSaveRef.current();
            completionTimerRef.current = window.setTimeout(() => onSessionFinished(), 3000);
            return;
        }

        setCurrentIndex(nextIndex);
        setTimeLeft(sessionExercises[nextIndex].sec);
        setIsPlaying(true);
    }, [
        currentIndex,
        sessionExercises,
        setIsTransitioning,
        setIsCompleted,
        setIsPlaying,
        onAutoCompleteSaveRef,
        onSessionFinished,
        setCurrentIndex,
        setTimeLeft,
    ]);
    goToNextRef.current = goToNext;

    return { goToNext };
}
