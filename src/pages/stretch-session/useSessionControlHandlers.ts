import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { getReplacementExercise, type ClassLevel, type Exercise } from '../../data/exercises';
import { audio } from '../../lib/audio';
import { haptics } from '../../lib/haptics';

interface UseSessionControlHandlersParams {
    classLevel: ClassLevel;
    sessionExerciseIds: string[] | null;
    sessionExercises: Exercise[];
    setSessionExercises: Dispatch<SetStateAction<Exercise[]>>;
    currentExercise: Exercise | undefined;
    currentIndex: number;
    skippedIds: string[];
    isCounting: boolean;
    isTransitioning: boolean;
    isBigBreak: boolean;
    setIsCounting: Dispatch<SetStateAction<boolean>>;
    setIsTransitioning: Dispatch<SetStateAction<boolean>>;
    setIsPlaying: Dispatch<SetStateAction<boolean>>;
    setSkippedIds: Dispatch<SetStateAction<string[]>>;
    setCurrentIndex: Dispatch<SetStateAction<number>>;
    setTimeLeft: Dispatch<SetStateAction<number>>;
    setShowBounce: Dispatch<SetStateAction<boolean>>;
    setIsBigBreak: Dispatch<SetStateAction<boolean>>;
    setTransitionTime: Dispatch<SetStateAction<number>>;
    goToNext: () => void;
}

interface UseSessionControlHandlersResult {
    handleSwipeUp: () => void;
    handleTap: () => void;
    handleDragEnd: (_e: unknown, info: { offset: { y: number } }) => void;
    handleContinueBlock: () => void;
    onCountdownComplete: () => void;
}

export function useSessionControlHandlers({
    classLevel,
    sessionExerciseIds,
    sessionExercises,
    setSessionExercises,
    currentExercise,
    currentIndex,
    skippedIds,
    isCounting,
    isTransitioning,
    isBigBreak,
    setIsCounting,
    setIsTransitioning,
    setIsPlaying,
    setSkippedIds,
    setCurrentIndex,
    setTimeLeft,
    setShowBounce,
    setIsBigBreak,
    setTransitionTime,
    goToNext,
}: UseSessionControlHandlersParams): UseSessionControlHandlersResult {
    const handleSwipeDown = useCallback(() => {
        const firstTodayIndex = 0;
        if (currentIndex <= firstTodayIndex) {
            setShowBounce(true);
            setTimeout(() => setShowBounce(false), 400);
            return;
        }

        setIsTransitioning(false);
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setTimeLeft(sessionExercises[prevIndex].sec);
        setIsPlaying(true);
    }, [currentIndex, sessionExercises, setShowBounce, setIsTransitioning, setCurrentIndex, setTimeLeft, setIsPlaying]);

    const handleSwipeUp = useCallback(() => {
        if (isCounting) {
            setIsCounting(false);
            if (currentExercise) audio.speak(`最初は、${currentExercise.reading || currentExercise.name}です`);
            return;
        }

        if (isTransitioning) {
            goToNext();
            return;
        }

        if (currentExercise) {
            setSkippedIds((prev) => [...prev, currentExercise.id]);

            if (!sessionExerciseIds) {
                const currentIds = sessionExercises.map((exercise) => exercise.id);
                const replacement = getReplacementExercise(
                    classLevel,
                    [...currentIds, ...skippedIds, currentExercise.id],
                    currentExercise.sec
                );
                if (replacement) {
                    setSessionExercises((prev) => {
                        const cores = prev.filter((exercise) => exercise.type === 'core');
                        const stretches = prev.filter((exercise) => exercise.type === 'stretch');
                        return [...stretches, replacement, ...cores];
                    });
                }
            }
        }

        setIsTransitioning(false);
        goToNext();
    }, [
        isCounting,
        currentExercise,
        isTransitioning,
        goToNext,
        setSkippedIds,
        sessionExerciseIds,
        sessionExercises,
        classLevel,
        skippedIds,
        setSessionExercises,
        setIsTransitioning,
        setIsCounting,
    ]);

    const handleTap = useCallback(() => {
        if (isCounting) {
            setIsCounting(false);
            setIsPlaying(false);
            return;
        }

        if (isTransitioning) {
            setIsTransitioning(false);
            setIsPlaying(false);
            return;
        }

        if (!isBigBreak) {
            setIsPlaying((prev) => !prev);
        }
    }, [isCounting, isTransitioning, isBigBreak, setIsCounting, setIsPlaying, setIsTransitioning]);

    const handleDragEnd = useCallback((_e: unknown, { offset }: { offset: { y: number } }) => {
        const swipeThreshold = 50;
        if (offset.y < -swipeThreshold) handleSwipeUp();
        else if (offset.y > swipeThreshold) handleSwipeDown();
    }, [handleSwipeUp, handleSwipeDown]);

    const handleContinueBlock = useCallback(() => {
        setIsBigBreak(false);
        setIsPlaying(true);
        setIsTransitioning(true);
        setTransitionTime(3);
    }, [setIsBigBreak, setIsPlaying, setIsTransitioning, setTransitionTime]);

    const onCountdownComplete = useCallback(() => {
        setIsCounting(false);
        haptics.pulse();
        if (currentExercise) audio.speak(`最初は、${currentExercise.reading || currentExercise.name}です`);
    }, [setIsCounting, currentExercise]);

    return {
        handleSwipeUp,
        handleTap,
        handleDragEnd,
        handleContinueBlock,
        onCountdownComplete,
    };
}
