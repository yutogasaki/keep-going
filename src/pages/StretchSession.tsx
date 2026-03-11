import React, { useRef, useState } from 'react';
import { audio } from '../lib/audio';
import { useAppStore } from '../store/useAppStore';
import { useSessionSetup } from './stretch-session/useSessionSetup';
import { useSessionTimer } from './stretch-session/useSessionTimer';
import { MainScroller } from './stretch-session/MainScroller';
import {
    StretchCompletionScreen,
    StretchLoadingScreen,
    StretchNoExercisesScreen,
} from './stretch-session/SessionScreens';
import { StretchSessionOverlayLayer } from './stretch-session/StretchSessionOverlayLayer';
import { useSessionControlsHint } from './stretch-session/useSessionControlsHint';
import { useSessionPersistence } from './stretch-session/useSessionPersistence';
import { useSessionWakeLock } from './stretch-session/useSessionWakeLock';

export const StretchSession: React.FC = () => {
    const completeSession = useAppStore((state) => state.completeSession);
    const endSession = useAppStore((state) => state.endSession);
    const sessionReturnTab = useAppStore((state) => state.sessionReturnTab);
    const setSessionDraft = useAppStore((state) => state.setSessionDraft);
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const sessionExerciseIds = useAppStore((state) => state.sessionExerciseIds);
    const sessionSourceMenuId = useAppStore((state) => state.sessionSourceMenuId);
    const sessionSourceMenuSource = useAppStore((state) => state.sessionSourceMenuSource);
    const sessionSourceMenuName = useAppStore((state) => state.sessionSourceMenuName);
    const sessionHybridMode = useAppStore((state) => state.sessionHybridMode);
    const isTeacherPreview = useAppStore((state) => state.isTeacherPreview);
    const hasSeenSessionControlsHint = useAppStore((state) => state.hasSeenSessionControlsHint);
    const setHasSeenSessionControlsHint = useAppStore((state) => state.setHasSeenSessionControlsHint);
    const {
        classLevel,
        dailyTargetMinutes,
        sessionExercises,
        setSessionExercises,
        isLoading,
    } = useSessionSetup({
        users,
        sessionUserIds,
        sessionExerciseIds,
        sessionHybridMode,
    });
    const [startedAt] = useState(() => new Date().toISOString());
    const autoCompleteSaveRef = useRef<() => Promise<void> | void>(() => {});
    const [isMuted, setIsMuted] = useState(audio.getMuted());
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const {
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
    } = useSessionTimer({
        isLoading,
        classLevel,
        sessionExercises,
        setSessionExercises,
        sessionExerciseIds,
        onSessionFinished: completeSession,
        onAutoCompleteSaveRef: autoCompleteSaveRef,
    });

    const { dismissControlsHint, runHintAwareAction, showControlsHint } = useSessionControlsHint({
        hasSeenSessionControlsHint,
        isBigBreak,
        isCompleted,
        isCounting,
        isLoading,
        setHasSeenSessionControlsHint,
    });

    const { handleEndSession } = useSessionPersistence({
        autoCompleteSaveRef,
        completedIds,
        dailyTargetMinutes,
        endSession,
        isCompleted,
        isLoading,
        isTeacherPreview,
        sessionDraftSetter: setSessionDraft,
        sessionExerciseIds,
        sessionExercises,
        sessionSourceMenuId,
        sessionSourceMenuSource,
        sessionSourceMenuName,
        sessionReturnTab,
        sessionUserIds,
        skippedIds,
        startedAt,
        totalRunningTime,
    });

    useSessionWakeLock({
        enabled: !isLoading && sessionExercises.length > 0 && !isCompleted,
    });

    const toggleMute = () => {
        audio.toggleMute();
        setIsMuted(audio.getMuted());
    };

    if (isLoading) {
        return <StretchLoadingScreen />;
    }

    if (sessionExercises.length === 0) {
        return <StretchNoExercisesScreen onBack={endSession} />;
    }

    if (!currentExercise && !isCompleted) {
        return null;
    }

    if (isCompleted) {
        return <StretchCompletionScreen totalRunningTime={totalRunningTime} />;
    }

    const activeExercise = currentExercise!;
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
        <div className="stretch-session">
            <StretchSessionOverlayLayer
                activeExercise={activeExercise}
                currentIndex={currentIndex}
                isBigBreak={isBigBreak}
                isCounting={isCounting}
                isMuted={isMuted}
                isPlaying={isPlaying}
                onCloseConfirm={() => setShowExitConfirm(false)}
                onConfirmExit={() => {
                    setShowExitConfirm(false);
                    void handleEndSession();
                }}
                onContinueBlock={handleContinueBlock}
                onCountdownComplete={onCountdownComplete}
                onDismissControlsHint={dismissControlsHint}
                onOpenExitConfirm={() => setShowExitConfirm(true)}
                onSkip={() => runHintAwareAction(handleSwipeUp)}
                onToggleMute={toggleMute}
                onTogglePlayPause={() => runHintAwareAction(handleTap)}
                sessionLength={sessionExercises.length}
                showBounce={showBounce}
                showControlsHint={showControlsHint}
                showExitConfirm={showExitConfirm}
            />

            <MainScroller
                activeExercise={activeExercise}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                isTransitioning={isTransitioning}
                isBigBreak={isBigBreak}
                isCounting={isCounting}
                hasLRSplit={hasLRSplit}
                isPointFlex={isPointFlex}
                currentSide={currentSide}
                showSideSwitch={showSideSwitch}
                radius={radius}
                circumference={circumference}
                dashOffset={dashOffset}
                timeLeft={timeLeft}
                phaseTimeLeft={phaseTimeLeft}
                sessionExercises={sessionExercises}
                transitionTime={transitionTime}
                onDragEnd={(event, info) => runHintAwareAction(handleDragEnd, event, info)}
                onTap={() => runHintAwareAction(handleTap)}
            />
        </div>
    );
};
