import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { BreakModal } from '../components/BreakModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { audio } from '../lib/audio';
import { useAppStore } from '../store/useAppStore';
import { saveSession, getTodayKey, type SessionRecord } from '../lib/db';
import { useSessionSetup } from './stretch-session/useSessionSetup';
import { useSessionTimer } from './stretch-session/useSessionTimer';
import { MainScroller } from './stretch-session/MainScroller';
import { ControlBar } from './stretch-session/ControlBar';
import { SessionControlsHint } from './stretch-session/SessionControlsHint';
import { shouldIgnoreInitialHintInteraction } from './stretch-session/sessionControlsHintUtils';
import {
    StretchCompletionScreen,
    StretchLoadingScreen,
    StretchNoExercisesScreen,
} from './stretch-session/SessionScreens';

export const StretchSession: React.FC = () => {
    const endSession = useAppStore((state) => state.endSession);
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const sessionExerciseIds = useAppStore((state) => state.sessionExerciseIds);
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
    });
    const [startedAt] = useState(() => new Date().toISOString());
    const autoCompleteSaveRef = useRef<() => Promise<void> | void>(() => { });
    const hasSavedRef = useRef(false);
    const [isMuted, setIsMuted] = useState(audio.getMuted());
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [controlsHintPending, setControlsHintPending] = useState(() => !hasSeenSessionControlsHint);
    const controlsHintOpenedAtRef = useRef<number | null>(null);
    const toggleMute = () => {
        audio.toggleMute();
        setIsMuted(audio.getMuted());
    };

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
        onSessionFinished: endSession,
        onAutoCompleteSaveRef: autoCompleteSaveRef,
    });
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

    const handleSessionTap = useCallback(() => {
        if (showControlsHint) {
            if (shouldIgnoreInitialHintInteraction(controlsHintOpenedAtRef.current, performance.now())) {
                return;
            }
            dismissControlsHint();
            return;
        }
        handleTap();
    }, [dismissControlsHint, handleTap, showControlsHint]);

    const handleSessionSwipeUp = useCallback(() => {
        if (showControlsHint) {
            if (shouldIgnoreInitialHintInteraction(controlsHintOpenedAtRef.current, performance.now())) {
                return;
            }
            dismissControlsHint();
            return;
        }
        handleSwipeUp();
    }, [dismissControlsHint, handleSwipeUp, showControlsHint]);

    const handleSessionDragEnd = useCallback((_e: unknown, info: { offset: { y: number } }) => {
        if (showControlsHint) {
            if (shouldIgnoreInitialHintInteraction(controlsHintOpenedAtRef.current, performance.now())) {
                return;
            }
            dismissControlsHint();
            return;
        }
        handleDragEnd(_e, info);
    }, [dismissControlsHint, handleDragEnd, showControlsHint]);

    const saveSessionData = useCallback(async () => {
        // Skip recording for teacher preview sessions
        if (isTeacherPreview) return;
        // Guard against double-save (auto-complete + manual end)
        if (hasSavedRef.current) return;
        hasSavedRef.current = true;

        let finalRunningTime = totalRunningTime;

        if (!sessionExerciseIds && isCompleted) {
            finalRunningTime = Math.max(totalRunningTime, dailyTargetMinutes * 60);
        }

        if (completedIds.length > 0 || finalRunningTime > 0) {
            const record: SessionRecord = {
                id: crypto.randomUUID(),
                date: getTodayKey(),
                startedAt,
                totalSeconds: finalRunningTime,
                exerciseIds: completedIds,
                skippedIds,
                userIds: sessionUserIds,
            };
            await saveSession(record);
        }
    }, [completedIds, skippedIds, totalRunningTime, startedAt, sessionUserIds, sessionExerciseIds, isCompleted, dailyTargetMinutes, isTeacherPreview]);
    autoCompleteSaveRef.current = saveSessionData;

    const handleEndSession = useCallback(async () => {
        await saveSessionData();
        endSession();
    }, [saveSessionData, endSession]);

    if (isLoading) {
        return <StretchLoadingScreen />;
    }

    if (sessionExercises.length === 0) {
        return <StretchNoExercisesScreen onBack={endSession} />;
    }

    if (!currentExercise && !isCompleted) return null;

    if (isCompleted) {
        return <StretchCompletionScreen totalRunningTime={totalRunningTime} />;
    }

    const activeExercise = currentExercise!;
    // Timer ring calculations
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
        <div className="stretch-session">
            {/* Total Progress Bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'rgba(0,0,0,0.05)',
                zIndex: 65,
            }}>
                <motion.div
                    style={{
                        height: '100%',
                        background: '#2BBAA0',
                        originX: 0,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: sessionExercises.length > 0 ? currentIndex / sessionExercises.length : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </div>

            <AnimatePresence>
                {isCounting && (
                    <CountdownOverlay
                        key="countdown"
                        onComplete={onCountdownComplete}
                        firstExercise={activeExercise}
                    />
                )}
                {isBigBreak && (
                    <BreakModal key="break-modal" onContinue={handleContinueBlock} />
                )}
            </AnimatePresence>

            <SessionControlsHint
                open={showControlsHint && !isBigBreak && !isCounting}
                onClose={dismissControlsHint}
            />

            {/* Close button */}
            <button
                onClick={() => setShowExitConfirm(true)}
                style={{
                    position: 'absolute',
                    top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
                    right: 16,
                    zIndex: 60,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--glass-bg-light)',
                    backdropFilter: 'blur(var(--blur-sm))',
                    WebkitBackdropFilter: 'blur(var(--blur-sm))',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2D4741',
                }}
            >
                <X size={20} />
            </button>

            {/* Exit confirmation dialog */}
            <ConfirmDeleteModal
                open={showExitConfirm}
                title="ストレッチをおわる？"
                message="いまのきろくをほぞんしておわりますか？"
                onCancel={() => setShowExitConfirm(false)}
                onConfirm={() => {
                    setShowExitConfirm(false);
                    handleEndSession();
                }}
                confirmLabel="おわる"
                confirmColor="#E17055"
            />

            {/* Bounce indicator for down-swipe at start */}
            <AnimatePresence>
                {showBounce && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: 80,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            zIndex: 60,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            padding: '8px 16px',
                        }}
                    >
                        ここが今日のはじめです
                    </motion.div>
                )}
            </AnimatePresence>

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
                onDragEnd={handleSessionDragEnd}
                onTap={handleSessionTap}
            />

            <ControlBar
                isMuted={isMuted}
                isPlaying={isPlaying}
                onToggleMute={toggleMute}
                onTogglePlayPause={handleSessionTap}
                onSkip={handleSessionSwipeUp}
            />
        </div >
    );
};
