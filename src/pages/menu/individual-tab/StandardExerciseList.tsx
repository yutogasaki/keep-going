import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Play, Star } from 'lucide-react';
import type { Exercise } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';

interface StandardExerciseListProps {
    exercises: Exercise[];
    requiredExerciseIds: string[];
    onStartExercise: (exerciseId: string) => void;
    teacherExerciseIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
}

export const StandardExerciseList: React.FC<StandardExerciseListProps> = ({
    exercises,
    requiredExerciseIds,
    onStartExercise,
    teacherExerciseIds,
    isNewTeacherContent,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercises.map((exercise, index) => (
                <motion.div
                    key={exercise.id}
                    className="card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03 }}
                    style={{ padding: 0, overflow: 'hidden' }}
                >
                    <div
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
                                {teacherExerciseIds?.has(exercise.id) && (
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#0984E3',
                                        background: 'rgba(9, 132, 227, 0.1)',
                                        padding: '1px 5px',
                                        borderRadius: 6,
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}>
                                        先生
                                    </span>
                                )}
                                {isNewTeacherContent?.(exercise.id) && (
                                    <span style={{
                                        fontFamily: "'Outfit', sans-serif",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#FFF',
                                        background: '#FF6B6B',
                                        padding: '1px 5px',
                                        borderRadius: 6,
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}>
                                        New
                                    </span>
                                )}
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
                                <span>{exercise.type === 'stretch' ? 'ストレッチ' : exercise.type === 'rest' ? '休憩' : '体幹'}</span>
                                {exercise.internal !== 'single' && (
                                    <span style={{ color: '#2BBAA0' }}>
                                        {exercise.internal === 'P10・F10×3' ? '切替あり' : '左右あり'}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            {exercise.description && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === exercise.id ? null : exercise.id); }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'rgba(0,0,0,0.04)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <ChevronDown
                                        size={16}
                                        color="#B2BEC3"
                                        style={{
                                            transform: expandedId === exercise.id ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s ease',
                                        }}
                                    />
                                </button>
                            )}
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
                        </div>
                    </div>

                    <AnimatePresence>
                        {expandedId === exercise.id && exercise.description && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                            >
                                <div style={{ padding: '10px 16px 12px' }}>
                                    <p style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        color: '#8395A7',
                                        margin: 0,
                                    }}>
                                        {exercise.description}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    );
};
