import React from 'react';
import { motion } from 'framer-motion';
import { getExerciseById } from '../../../data/exercises';
import type { PickerExercise } from './ExercisePickerList';

interface SelectedExercisesCardProps {
    selectedIds: string[];
    minutes: number;
    allExercises?: PickerExercise[];
    onRemoveAtIndex: (index: number) => void;
}

export const SelectedExercisesCard: React.FC<SelectedExercisesCardProps> = ({
    selectedIds,
    minutes,
    allExercises,
    onRemoveAtIndex,
}) => {
    const resolveExercise = (id: string) => {
        const builtIn = getExerciseById(id);
        if (builtIn) return { name: builtIn.name, emoji: builtIn.emoji, placement: builtIn.placement };
        const extra = allExercises?.find((e) => e.id === id);
        if (extra) return { name: extra.name, emoji: extra.emoji, placement: null };
        return null;
    };
    return (
        <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
            }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    えらんだ種目（{selectedIds.length}）
                </label>
                <span style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2BBAA0',
                    background: 'rgba(43, 186, 160, 0.1)',
                    padding: '4px 10px',
                    borderRadius: 10,
                }}>
                    約{minutes}分
                </span>
            </div>

            {selectedIds.length === 0 ? (
                <div style={{
                    background: '#F8F9FA',
                    borderRadius: 16,
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    border: '2px dashed rgba(0,0,0,0.05)',
                }}>
                    <div style={{ fontSize: 24, opacity: 0.5 }}>👇</div>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        color: '#8395A7',
                        textAlign: 'center',
                        margin: 0,
                        fontWeight: 600,
                    }}>
                        下のリストから種目をタップしてね
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedIds.map((id, index) => {
                        const exercise = resolveExercise(id);
                        if (!exercise) {
                            return null;
                        }

                        return (
                            <motion.button
                                key={`${id}-${index}`}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onRemoveAtIndex(index)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: exercise.placement === 'rest'
                                        ? 'rgba(143, 164, 178, 0.16)'
                                        : 'rgba(43, 186, 160, 0.1)',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: exercise.placement === 'rest' ? '#5A6B75' : '#00796B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: exercise.placement === 'rest'
                                        ? '0 2px 4px rgba(143, 164, 178, 0.08)'
                                        : '0 2px 4px rgba(43, 186, 160, 0.05)',
                                }}
                            >
                                {exercise.emoji} {exercise.name}
                                <span style={{
                                    background: 'rgba(0,0,0,0.05)',
                                    borderRadius: '50%',
                                    width: 16,
                                    height: 16,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: exercise.placement === 'rest' ? '#5A6B75' : '#00796B',
                                    fontSize: 10,
                                    marginLeft: 4,
                                }}>
                                    ×
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
