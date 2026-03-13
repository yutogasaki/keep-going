import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { CountdownOverlay } from '../../components/CountdownOverlay';
import { BreakModal } from '../../components/BreakModal';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ControlBar } from './ControlBar';
import { SessionControlsHint } from './SessionControlsHint';
import type { Exercise } from '../../data/exercises';

interface StretchSessionOverlayLayerProps {
    activeExercise: Exercise;
    currentIndex: number;
    isBigBreak: boolean;
    isCounting: boolean;
    isMuted: boolean;
    isPlaying: boolean;
    onCloseConfirm: () => void;
    onContinueBlock: () => void;
    onCountdownComplete: () => void;
    onDismissControlsHint: () => void;
    onOpenExitConfirm: () => void;
    onSkip: () => void;
    onToggleMute: () => void;
    onTogglePlayPause: () => void;
    onConfirmExit: () => void;
    sessionLength: number;
    showBounce: boolean;
    showControlsHint: boolean;
    showExitConfirm: boolean;
}

export const StretchSessionOverlayLayer: React.FC<StretchSessionOverlayLayerProps> = ({
    activeExercise,
    currentIndex,
    isBigBreak,
    isCounting,
    isMuted,
    isPlaying,
    onCloseConfirm,
    onConfirmExit,
    onContinueBlock,
    onCountdownComplete,
    onDismissControlsHint,
    onOpenExitConfirm,
    onSkip,
    onToggleMute,
    onTogglePlayPause,
    sessionLength,
    showBounce,
    showControlsHint,
    showExitConfirm,
}) => (
    <>
        {/* Session progress dots + counter */}
        <div style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top, 16px) + 16px)',
            left: 16,
            right: 64,
            zIndex: 65,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: sessionLength > 12 ? 3 : 4,
                flexShrink: 1,
                minWidth: 0,
                overflow: 'hidden',
            }}>
                {Array.from({ length: sessionLength }, (_, i) => {
                    const isCurrent = i === currentIndex;
                    const isDone = i < currentIndex;
                    const dotSize = sessionLength > 12 ? 6 : 8;
                    const currentSize = sessionLength > 12 ? 8 : 10;
                    return (
                        <motion.div
                            key={i}
                            animate={isCurrent ? {
                                scale: [1, 1.3, 1],
                            } : undefined}
                            transition={isCurrent ? {
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            } : undefined}
                            style={{
                                width: isCurrent ? currentSize : dotSize,
                                height: isCurrent ? currentSize : dotSize,
                                borderRadius: '50%',
                                background: isDone
                                    ? '#2BBAA0'
                                    : isCurrent
                                        ? '#2BBAA0'
                                        : 'rgba(0,0,0,0.1)',
                                flexShrink: 0,
                            }}
                        />
                    );
                })}
            </div>
            <span style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: '#8395A7',
                whiteSpace: 'nowrap',
                flexShrink: 0,
            }}>
                {currentIndex + 1}/{sessionLength}
            </span>
        </div>

        <AnimatePresence>
            {isCounting ? (
                <CountdownOverlay
                    key="countdown"
                    onComplete={onCountdownComplete}
                    firstExercise={activeExercise}
                />
            ) : null}
            {isBigBreak ? (
                <BreakModal key="break-modal" onContinue={onContinueBlock} />
            ) : null}
        </AnimatePresence>

        <SessionControlsHint
            open={showControlsHint && !isBigBreak && !isCounting}
            onClose={onDismissControlsHint}
        />

        <button
            type="button"
            onClick={onOpenExitConfirm}
            aria-label="ストレッチを終了する"
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

        <ConfirmDeleteModal
            open={showExitConfirm}
            title="ストレッチをおわる？"
            message="いまのきろくをほぞんしておわりますか？"
            onCancel={onCloseConfirm}
            onConfirm={onConfirmExit}
            confirmLabel="おわる"
            confirmColor="#E17055"
        />

        <AnimatePresence>
            {showBounce ? (
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
            ) : null}
        </AnimatePresence>

        <ControlBar
            isMuted={isMuted}
            isPlaying={isPlaying}
            onToggleMute={onToggleMute}
            onTogglePlayPause={onTogglePlayPause}
            onSkip={onSkip}
        />
    </>
);
