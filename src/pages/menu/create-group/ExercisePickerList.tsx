import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import type { Exercise } from '../../../data/exercises';

interface ExercisePickerListProps {
    availableExercises: Exercise[];
    selectedIds: string[];
    onAddExercise: (exerciseId: string) => void;
}

export const ExercisePickerList: React.FC<ExercisePickerListProps> = ({
    availableExercises,
    selectedIds,
    onAddExercise,
}) => {
    return (
        <div>
            <label style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#2D3436',
                display: 'block',
                marginBottom: 12,
                marginLeft: 4,
            }}>
                種目をタップして追加（くりかえしOK）
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableExercises.map((exercise) => {
                    const count = selectedIds.filter((selectedId) => selectedId === exercise.id).length;

                    return (
                        <motion.button
                            key={exercise.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAddExercise(exercise.id)}
                            className="card"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '16px 20px',
                                cursor: 'pointer',
                                border: count > 0 ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: count > 0 ? 'rgba(43,186,160,0.04)' : 'white',
                                textAlign: 'left',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{exercise.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    display: 'block',
                                    marginBottom: 4,
                                }}>
                                    {exercise.name}
                                </span>
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                }}>
                                    {exercise.sec}秒 {exercise.internal !== 'single' ? `(${exercise.internal})` : ''}
                                </span>
                            </div>
                            {count > 0 ? (
                                <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 10,
                                    background: '#2BBAA0',
                                    color: 'white',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    fontFamily: "'Outfit', sans-serif",
                                    boxShadow: '0 2px 8px rgba(43, 186, 160, 0.4)',
                                }}>
                                    ×{count}
                                </span>
                            ) : (
                                <div style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '50%',
                                    background: '#F8F9FA',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Plus size={18} color="#B2BEC3" />
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
