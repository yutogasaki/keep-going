import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Edit2, Play, Trash2 } from 'lucide-react';
import type { CustomExercise } from '../../../lib/db';
import { ExerciseIcon } from '../../../components/ExerciseIcon';

interface CustomExerciseListProps {
    customExercises: CustomExercise[];
    isTogetherMode: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    onEdit: (exercise: CustomExercise) => void;
    onDelete: (exerciseId: string) => void;
    onStart: (exerciseId: string) => void;
}

export const CustomExerciseList: React.FC<CustomExerciseListProps> = ({
    customExercises,
    isTogetherMode,
    getCreatorName,
    onEdit,
    onDelete,
    onStart,
}) => {
    return (
        <>
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
                            onClick={() => onEdit(exercise)}
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
                            onClick={() => onDelete(exercise.id)}
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
                            onClick={() => onStart(exercise.id)}
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
        </>
    );
};
