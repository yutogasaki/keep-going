import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Play, Star } from 'lucide-react';
import type { Exercise } from '../../../data/exercises';
import { getExercisePlacementLabel } from '../../../data/exercisePlacement';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import { ExerciseSelectionIndicator } from './ExerciseSelectionIndicator';

interface StandardExerciseCardProps {
    exercise: Exercise;
    index: number;
    expanded: boolean;
    required: boolean;
    selected: boolean;
    selectionMode?: boolean;
    teacherBadge?: boolean;
    newBadge?: boolean;
    onToggleExpand: (exerciseId: string) => void;
    onToggleSelect?: (exerciseId: string) => void;
    onStartExercise: (exerciseId: string) => void;
}

function getInternalLabel(internal: Exercise['internal']): string | null {
    if (internal === 'single') {
        return null;
    }

    return internal === 'P10・F10×3' ? '切替あり' : '左右あり';
}

export const StandardExerciseCard: React.FC<StandardExerciseCardProps> = ({
    exercise,
    index,
    expanded,
    required,
    selected,
    selectionMode,
    teacherBadge,
    newBadge,
    onToggleExpand,
    onToggleSelect,
    onStartExercise,
}) => {
    const internalLabel = getInternalLabel(exercise.internal);

    return (
        <motion.div
            className="card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.03 }}
            onClick={selectionMode ? () => onToggleSelect?.(exercise.id) : undefined}
            style={{
                padding: 0,
                overflow: 'hidden',
                cursor: selectionMode ? 'pointer' : undefined,
                outline: selected ? '2px solid #2BBAA0' : 'none',
                outlineOffset: -2,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 16px',
                }}
            >
                {selectionMode ? (
                    <ExerciseSelectionIndicator selected={selected} />
                ) : (
                    <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color="#2D3436" />
                )}
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 2,
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}
                        >
                            {exercise.name}
                        </span>
                        {teacherBadge ? (
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#0984E3',
                                    background: 'rgba(9, 132, 227, 0.1)',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                先生
                            </span>
                        ) : null}
                        {newBadge ? (
                            <span
                                style={{
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#FFF',
                                    background: '#FF6B6B',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                New
                            </span>
                        ) : null}
                        {required ? (
                            <span
                                style={{
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
                                }}
                            >
                                <Star size={9} fill="#F59E0B" />
                                必須
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#8395A7',
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                        }}
                    >
                        <span>{exercise.sec}秒</span>
                        <span>{getExercisePlacementLabel(exercise.placement)}</span>
                        {internalLabel ? <span style={{ color: '#2BBAA0' }}>{internalLabel}</span> : null}
                    </div>
                </div>

                {!selectionMode ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {exercise.description ? (
                            <button
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onToggleExpand(exercise.id);
                                }}
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
                                        transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                                        transition: 'transform 0.2s ease',
                                    }}
                                />
                            </button>
                        ) : null}
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
                ) : null}
            </div>

            <AnimatePresence>
                {!selectionMode && expanded && exercise.description ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ padding: '10px 16px 12px' }}>
                            <p
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    margin: 0,
                                }}
                            >
                                {exercise.description}
                            </p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};
