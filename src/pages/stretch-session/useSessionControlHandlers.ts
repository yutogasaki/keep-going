import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { getExercisesByClass, type ClassLevel, type Exercise } from '../../data/exercises';
import {
    getExercisePlacementOrder,
    isRestPlacement,
} from '../../data/exercisePlacement';
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
                const usedIds = new Set([
                    ...sessionExercises.map(e => e.id),
                    ...skippedIds,
                    currentExercise.id,
                ]);
                // ビルトイン + セッション中のカスタム/先生種目から代替を探す
                const builtInPool = getExercisesByClass(classLevel);
                const sessionPool = sessionExercises.filter(e =>
                    !builtInPool.some(b => b.id === e.id)
                );
                const allPool = [...builtInPool, ...sessionPool];
                const samePlacement = allPool.filter((exercise) =>
                    !usedIds.has(exercise.id)
                    && !isRestPlacement(exercise.placement)
                    && exercise.placement === currentExercise.placement
                );
                const fallbackPool = allPool.filter((exercise) =>
                    !usedIds.has(exercise.id)
                    && !isRestPlacement(exercise.placement)
                );
                const available = samePlacement.length > 0 ? samePlacement : fallbackPool;
                const replacement = available.find(e => e.sec === currentExercise.sec)
                    || available[0]
                    || null;
                if (replacement) {
                    setSessionExercises((prev) => {
                        const insertionIndex = prev.findIndex((exercise, index) =>
                            index > currentIndex
                            && getExercisePlacementOrder(exercise.placement) > getExercisePlacementOrder(replacement.placement)
                        );
                        if (insertionIndex === -1) {
                            return [...prev, replacement];
                        }
                        return [
                            ...prev.slice(0, insertionIndex),
                            replacement,
                            ...prev.slice(insertionIndex),
                        ];
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
        currentIndex,
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
