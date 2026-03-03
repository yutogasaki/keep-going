import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Edit2, Play, Plus, Star, Trash2 } from 'lucide-react';
import type { Exercise } from '../../data/exercises';
import type { CustomExercise } from '../../lib/db';
import { ExerciseIcon } from '../../components/ExerciseIcon';

interface MenuIndividualTabProps {
    exercises: Exercise[];
    requiredExercises: string[];
    customExercises: CustomExercise[];
    isTogetherMode: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    onStartExercise: (exerciseId: string) => void;
    onEditCustomExercise: (exercise: CustomExercise) => void;
    onDeleteCustomExercise: (exerciseId: string) => void;
    onStartCustomExercise: (exerciseId: string) => void;
    onCreateCustomExercise: () => void;
}

export const MenuIndividualTab: React.FC<MenuIndividualTabProps> = ({
    exercises,
    requiredExercises,
    customExercises,
    isTogetherMode,
    getCreatorName,
    onStartExercise,
    onEditCustomExercise,
    onDeleteCustomExercise,
    onStartCustomExercise,
    onCreateCustomExercise,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
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
                                {requiredExercises.includes(exercise.id) && (
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 10,
                    letterSpacing: 1,
                }}>
                    じぶん種目
                </h2>
                {customExercises.map((exercise, index) => (
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
                                {isTogetherMode && exercise.creatorId && (
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 10,
                                        fontWeight: 700,
                                        color: '#2BBAA0',
                                        background: 'rgba(43, 186, 160, 0.1)',
                                        padding: '2px 6px',
                                        borderRadius: 8,
                                        marginLeft: 8,
                                        display: 'inline-block',
                                        verticalAlign: 'middle',
                                    }}>
                                        👤 {getCreatorName(exercise.creatorId)}
                                    </span>
                                )}
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                            }}>
                                <Clock size={12} />
                                <span>約{Math.round(exercise.sec / 60)}分</span>
                                {exercise.hasSplit && (
                                    <span style={{ color: '#2BBAA0', marginLeft: 4 }}>切替あり</span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <button
                                onClick={() => onEditCustomExercise(exercise)}
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
                                <Edit2 size={16} color="#8395A7" />
                            </button>
                            <button
                                onClick={() => onDeleteCustomExercise(exercise.id)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 10,
                                    border: 'none',
                                    background: 'rgba(231, 76, 60, 0.1)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Trash2 size={16} color="#E74C3C" />
                            </button>
                            <div style={{ width: 8 }} />
                            <button
                                onClick={() => onStartCustomExercise(exercise.id)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: '#2BBAA0',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Play size={14} color="white" fill="white" />
                            </button>
                        </div>
                    </motion.div>
                ))}

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={onCreateCustomExercise}
                    className="card"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '16px 20px',
                        border: 'none',
                        background: 'white',
                        cursor: 'pointer',
                        textAlign: 'left',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        marginTop: 4,
                    }}
                >
                    <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 2px 8px rgba(178, 223, 219, 0.5)',
                    }}>
                        <Plus size={24} color="#00796B" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 4,
                        }}>
                            新しくつくる
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            lineHeight: 1.4,
                        }}>
                            オリジナル種目を追加
                        </div>
                    </div>
                </motion.button>
            </div>
        </div>
    );
};
