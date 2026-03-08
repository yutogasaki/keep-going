import { isRestExercise, type Exercise } from '../../data/exercises';

export interface SessionSideCue {
    currentSide: 'right' | 'left' | null;
    announcement: string | null;
    showSideSwitch: boolean;
    hideDelayMs: number | null;
}

export interface ExerciseCompletionState {
    isRest: boolean;
    shouldTrackCompletion: boolean;
    nextTotalRunningTime: number;
    breakType: 'none' | 'small' | 'big';
    transitionSeconds: number;
    nextExerciseAnnouncement: string | null;
    shouldPulseTransition: boolean;
}

export interface SessionVisibilityUpdate {
    rememberPlayback: boolean;
    shouldPausePlayback: boolean;
    shouldResumeCountdown: boolean;
    shouldClearTransition: boolean;
    announcement: string | null;
}

export function getPhaseTimeLeft({
    timeLeft,
    isPointFlex,
    hasLRSplit,
    halfTime,
}: {
    timeLeft: number;
    isPointFlex: boolean;
    hasLRSplit: boolean;
    halfTime: number;
}): number {
    if (timeLeft <= 0) {
        return 0;
    }

    if (isPointFlex) {
        return (timeLeft - 1) % 30 + 1;
    }

    if (hasLRSplit && halfTime > 0) {
        return (timeLeft - 1) % halfTime + 1;
    }

    return 0;
}

export function getSessionSideCue({
    currentExercise,
    timeLeft,
    hasLRSplit,
    isPointFlex,
    halfTime,
}: {
    currentExercise: Exercise;
    timeLeft: number;
    hasLRSplit: boolean;
    isPointFlex: boolean;
    halfTime: number;
}): SessionSideCue {
    const elapsed = currentExercise.sec - timeLeft;

    if (isPointFlex) {
        const intervalIndex = Math.floor(elapsed / 30);
        const currentSide = intervalIndex % 2 === 0 ? 'right' : 'left';
        const isSwitchPoint = elapsed > 0 && elapsed % 30 === 0;
        return {
            currentSide,
            announcement: isSwitchPoint ? 'チェンジ' : null,
            showSideSwitch: isSwitchPoint,
            hideDelayMs: isSwitchPoint ? 2000 : null,
        };
    }

    if (!hasLRSplit) {
        return {
            currentSide: null,
            announcement: null,
            showSideSwitch: false,
            hideDelayMs: null,
        };
    }

    if (elapsed < halfTime) {
        return {
            currentSide: 'right',
            announcement: null,
            showSideSwitch: false,
            hideDelayMs: null,
        };
    }

    if (elapsed === halfTime) {
        return {
            currentSide: 'left',
            announcement: 'はんたいがわへ',
            showSideSwitch: true,
            hideDelayMs: 2000,
        };
    }

    return {
        currentSide: 'left',
        announcement: null,
        showSideSwitch: false,
        hideDelayMs: null,
    };
}

export function getSessionVisibilityUpdate({
    visibilityState,
    hasCurrentExercise,
    wasPlayingBeforeHidden,
    isPlaying,
    isCounting,
    isTransitioning,
    isBigBreak,
    isCompleted,
}: {
    visibilityState: DocumentVisibilityState;
    hasCurrentExercise: boolean;
    wasPlayingBeforeHidden: boolean;
    isPlaying: boolean;
    isCounting: boolean;
    isTransitioning: boolean;
    isBigBreak: boolean;
    isCompleted: boolean;
}): SessionVisibilityUpdate {
    if (visibilityState === 'hidden') {
        return {
            rememberPlayback: isPlaying && !isCounting && !isTransitioning && !isBigBreak && !isCompleted,
            shouldPausePlayback: true,
            shouldResumeCountdown: false,
            shouldClearTransition: false,
            announcement: null,
        };
    }

    const shouldResumeCountdown = visibilityState === 'visible' && hasCurrentExercise && wasPlayingBeforeHidden;
    return {
        rememberPlayback: false,
        shouldPausePlayback: false,
        shouldResumeCountdown,
        shouldClearTransition: shouldResumeCountdown,
        announcement: shouldResumeCountdown ? '再開します。' : null,
    };
}

export function getExerciseCompletionState({
    currentExercise,
    totalRunningTime,
    nextExercise,
}: {
    currentExercise: Exercise;
    totalRunningTime: number;
    nextExercise?: Exercise;
}): ExerciseCompletionState {
    const isRest = isRestExercise(currentExercise);
    const nextTotalRunningTime = isRest ? totalRunningTime : totalRunningTime + currentExercise.sec;
    const shouldTrackCompletion = !isRest;

    if (!isRest) {
        const bigBreakThreshold = 900;
        const previousBigBreakCount = Math.floor(totalRunningTime / bigBreakThreshold);
        const nextBigBreakCount = Math.floor(nextTotalRunningTime / bigBreakThreshold);
        if (nextBigBreakCount > previousBigBreakCount) {
            return {
                isRest,
                shouldTrackCompletion,
                nextTotalRunningTime,
                breakType: 'big',
                transitionSeconds: 0,
                nextExerciseAnnouncement: null,
                shouldPulseTransition: false,
            };
        }
    }

    let breakType: 'none' | 'small' | 'big' = 'none';
    if (!isRest) {
        const smallBreakThreshold = 300;
        const previousSmallBreakCount = Math.floor(totalRunningTime / smallBreakThreshold);
        const nextSmallBreakCount = Math.floor(nextTotalRunningTime / smallBreakThreshold);
        if (nextSmallBreakCount > previousSmallBreakCount) {
            breakType = 'small';
        }
    }

    return {
        isRest,
        shouldTrackCompletion,
        nextTotalRunningTime,
        breakType,
        transitionSeconds: breakType === 'small' ? 5 : 3,
        nextExerciseAnnouncement: nextExercise
            ? `次は、${nextExercise.reading || nextExercise.name}です`
            : null,
        shouldPulseTransition: !isRest,
    };
}
