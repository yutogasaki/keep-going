import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type Exercise } from '../../data/exercises';
import { getExercisePlacementAccentColor } from '../../data/exercisePlacement';
import { ExerciseIcon } from '../../components/ExerciseIcon';
import { ExerciseName } from '../../components/ExerciseName';

interface TransitionOverlayProps {
    isTransitioning: boolean;
    nextExercise: Exercise | undefined;
    transitionTime: number;
}

export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
    isTransitioning,
    nextExercise,
    transitionTime,
}) => (
    <AnimatePresence>
        {isTransitioning && nextExercise && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 30,
                    background: 'var(--glass-bg-heavy)',
                    backdropFilter: 'blur(var(--blur-xl))',
                    WebkitBackdropFilter: 'blur(var(--blur-xl))',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 16,
                }}
            >
                <p style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    color: '#B2BEC3',
                    letterSpacing: 3,
                }}>NEXT</p>

                <div style={{
                    width: 80,
                    height: 80,
                    background: 'white',
                    borderRadius: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-sm)',
                    marginBottom: 16,
                }}>
                    <ExerciseIcon
                        id={nextExercise.id}
                        emoji={nextExercise.emoji}
                        size={48}
                        color={getExercisePlacementAccentColor(nextExercise.placement)}
                    />
                </div>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#2D4741',
                }}>
                    <ExerciseName name={nextExercise.name} reading={nextExercise.reading} />
                </h2>
                {nextExercise.hasSplit && (
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#81ECEC',
                        fontWeight: 700,
                        background: 'rgba(129, 236, 236, 0.15)',
                        padding: '6px 14px',
                        borderRadius: 20,
                        marginTop: -8,
                    }}>
                        左右あり
                    </div>
                )}
                <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: '3px solid #2BBAA0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#2BBAA0',
                    marginTop: 8,
                }}>
                    {transitionTime}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);
