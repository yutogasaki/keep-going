import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getExerciseColor, type Exercise } from '../../data/exercises';
import { ExerciseIcon } from '../../components/ExerciseIcon';
import { ExerciseName } from '../../components/ExerciseName';
import { TimerRing } from './TimerRing';

interface ExercisePanelProps {
    activeExercise: Exercise;
    currentIndex: number;
    bgColor: string;
    isPlaying: boolean;
    isTransitioning: boolean;
    isBigBreak: boolean;
    isCounting: boolean;
    hasLRSplit: boolean;
    isPointFlex: boolean;
    currentSide: 'right' | 'left' | null;
    showSideSwitch: boolean;
    radius: number;
    circumference: number;
    dashOffset: number;
    timeLeft: number;
    phaseTimeLeft: number;
}

export const ExercisePanel: React.FC<ExercisePanelProps> = ({
    activeExercise,
    currentIndex,
    bgColor,
    isPlaying,
    isTransitioning,
    isBigBreak,
    isCounting,
    hasLRSplit,
    isPointFlex,
    currentSide,
    showSideSwitch,
    radius,
    circumference,
    dashOffset,
    timeLeft,
    phaseTimeLeft,
}) => (
    <AnimatePresence mode="popLayout">
        <motion.div
            key={activeExercise.id + '-' + currentIndex}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 20,
                background: `linear-gradient(165deg, ${bgColor} 0%, white 100%)`,
                overflow: 'hidden',
            }}
        >
            <motion.div
                animate={{ opacity: [0, 0.4, 0] }}
                transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at center, ${bgColor} 0%, transparent 70%)`,
                    zIndex: 1,
                }}
            />

            <AnimatePresence>
                {!isPlaying && !isTransitioning && !isBigBreak && !isCounting && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(255, 255, 255, 0.2)',
                            zIndex: 30,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                        }}
                    >
                        <div style={{
                            fontFamily: "'Outfit', sans-serif",
                            letterSpacing: 4,
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#2D4741',
                            marginBottom: 16,
                        }}>
                            PAUSED
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#8395A7',
                        }}>
                            一時停止中
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ zIndex: 20, textAlign: 'center' }}>
                <div style={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 16px',
                    background: 'white',
                    borderRadius: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                }}>
                    <ExerciseIcon
                        id={activeExercise.id}
                        emoji={activeExercise.emoji}
                        size={64}
                        color={getExerciseColor(activeExercise.type)}
                    />
                </div>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#2D4741',
                }}>
                    <ExerciseName name={activeExercise.name} reading={activeExercise.reading} />
                </h2>

                {(hasLRSplit || isPointFlex) && currentSide && (
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#2BBAA0',
                        marginTop: 8,
                        background: 'rgba(43, 186, 160, 0.1)',
                        padding: '4px 16px',
                        borderRadius: 20,
                        display: 'inline-block',
                    }}>
                        {isPointFlex
                            ? (currentSide === 'right' ? '🩰 ポイント (つま先伸ばす)' : '🦶 フレックス (かかと押し出す)')
                            : (currentSide === 'right' ? '▶ みぎ' : '◀ ひだり')
                        }
                    </p>
                )}
            </div>

            <AnimatePresence>
                {showSideSwitch && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{
                            position: 'absolute',
                            bottom: '22%',
                            zIndex: 30,
                            background: 'rgba(43, 186, 160, 0.9)',
                            color: 'white',
                            padding: '12px 24px',
                            borderRadius: 16,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            boxShadow: '0 4px 16px rgba(43, 186, 160, 0.4)',
                        }}
                    >
                        {isPointFlex ? 'チェンジ！ 🔄' : 'はんたいがわへ ◀'}
                    </motion.div>
                )}
            </AnimatePresence>

            <TimerRing
                radius={radius}
                circumference={circumference}
                dashOffset={dashOffset}
                timeLeft={timeLeft}
                hasLRSplit={hasLRSplit}
                isPointFlex={isPointFlex}
                phaseTimeLeft={phaseTimeLeft}
            />
        </motion.div>
    </AnimatePresence>
);
