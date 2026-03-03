import React from 'react';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';
import type { Exercise } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';

interface StandardExerciseListProps {
    exercises: Exercise[];
    requiredExerciseIds: string[];
    onStartExercise: (exerciseId: string) => void;
}

export const StandardExerciseList: React.FC<StandardExerciseListProps> = ({
    exercises,
    requiredExerciseIds,
    onStartExercise,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercises.map((exercise, index) => (
                <motion.div
                    key={exercise.id}
                    className="card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '14px 16px',
                    }}
                >
                    <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color="#2D3436" />
                    <div style={{ flex: 1 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 2,
                        }}>
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>
                                {exercise.name}
                            </span>
                            {requiredExerciseIds.includes(exercise.id) && (
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    padding: '1px 6px',
                                    borderRadius: 6,
                                    background: 'rgba(255, 183, 77, 0.15)',
                                    color: '#F59E0B',
                                    fontSize: 10,
                                    fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    <Star size={9} fill="#F59E0B" />
                                    必須
                                </span>
                            )}
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#8395A7',
                            display: 'flex',
                            gap: 8,
                        }}>
                            <span>{exercise.sec}秒</span>
                            <span>{exercise.type === 'stretch' ? 'ストレッチ' : '体幹'}</span>
                            {exercise.internal !== 'single' && (
                                <span style={{ color: '#2BBAA0' }}>
                                    {exercise.internal === 'P10・F10×3' ? '切替あり' : '左右あり'}
                                </span>
                            )}
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onStartExercise(exercise.id)}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'rgba(43, 186, 160, 0.1)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Play size={14} color="#2BBAA0" fill="#2BBAA0" />
                    </motion.button>
                </motion.div>
            ))}
        </div>
    );
};
