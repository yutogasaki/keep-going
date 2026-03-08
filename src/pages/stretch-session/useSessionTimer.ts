import { useState, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import { type ClassLevel, type Exercise } from '../../data/exercises';
import { useSessionControlHandlers } from './useSessionControlHandlers';
import { useSessionProgressEffects } from './useSessionProgressEffects';
import { getPhaseTimeLeft } from './sessionProgressHelpers';

interface UseSessionTimerParams {
    isLoading: boolean;
    classLevel: ClassLevel;
    sessionExercises: Exercise[];
    setSessionExercises: Dispatch<SetStateAction<Exercise[]>>;
    sessionExerciseIds: string[] | null;
    onSessionFinished: () => void;
    onAutoCompleteSaveRef: MutableRefObject<() => Promise<void> | void>;
}

interface UseSessionTimerResult {
    isCounting: boolean;
    currentIndex: number;
    isPlaying: boolean;
    timeLeft: number;
    completedIds: string[];
    skippedIds: string[];
    isCompleted: boolean;
    isTransitioning: boolean;
    transitionTime: number;
    isBigBreak: boolean;
    totalRunningTime: number;
    currentSide: 'right' | 'left' | null;
    showSideSwitch: boolean;
    showBounce: boolean;
    currentExercise: Exercise | undefined;
    progress: number;
    hasLRSplit: boolean;
    isPointFlex: boolean;
    phaseTimeLeft: number;
    handleSwipeUp: () => void;
    handleTap: () => void;
    handleDragEnd: (_e: unknown, info: { offset: { y: number } }) => void;
    handleContinueBlock: () => void;
    onCountdownComplete: () => void;
}

export function useSessionTimer({
    isLoading,
    classLevel,
    sessionExercises,
    setSessionExercises,
    sessionExerciseIds,
    onSessionFinished,
    onAutoCompleteSaveRef,
}: UseSessionTimerParams): UseSessionTimerResult {
    const [isCounting, setIsCounting] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [timeLeft, setTimeLeft] = useState(30);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [skippedIds, setSkippedIds] = useState<string[]>([]);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionTime, setTransitionTime] = useState(3);
    const [isBigBreak, setIsBigBreak] = useState(false);
    const [totalRunningTime, setTotalRunningTime] = useState(0);
    const [currentSide, setCurrentSide] = useState<'right' | 'left' | null>(null);
    const [showSideSwitch, setShowSideSwitch] = useState(false);
    const [showBounce, setShowBounce] = useState(false);

    const currentExercise = sessionExercises[currentIndex];
    const progress = currentExercise ? timeLeft / currentExercise.sec : 0;
    const hasLRSplit = currentExercise?.internal?.includes('→') || currentExercise?.hasSplit || false;
    const isPointFlex = currentExercise?.internal === 'P30・F30';
    const halfTime = currentExercise ? Math.floor(currentExercise.sec / 2) : 0;
    const phaseTimeLeft = getPhaseTimeLeft({
        timeLeft,
        isPointFlex,
        hasLRSplit,
        halfTime,
    });

    const { goToNext } = useSessionProgressEffects({
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
    });

    const {
        handleSwipeUp,
        handleTap,
        handleDragEnd,
        handleContinueBlock,
        onCountdownComplete,
    } = useSessionControlHandlers({
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
    });

    return {
        isCounting,
        currentIndex,
        isPlaying,
        timeLeft,
        completedIds,
        skippedIds,
        isCompleted,
        isTransitioning,
        transitionTime,
        isBigBreak,
        totalRunningTime,
        currentSide,
        showSideSwitch,
        showBounce,
        currentExercise,
        progress,
        hasLRSplit,
        isPointFlex,
        phaseTimeLeft,
        handleSwipeUp,
        handleTap,
        handleDragEnd,
        handleContinueBlock,
        onCountdownComplete,
    };
}
