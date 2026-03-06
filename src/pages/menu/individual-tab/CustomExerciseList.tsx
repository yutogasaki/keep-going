import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, Edit2, EyeOff, Play, Trash2, Upload } from 'lucide-react';
import type { CustomExercise } from '../../../lib/db';
import type { PublicExercise } from '../../../lib/publicExercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';

interface CustomExerciseListProps {
    customExercises: CustomExercise[];
    isTogetherMode: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    onEdit: (exercise: CustomExercise) => void;
    onDelete: (exerciseId: string) => void;
    onStart: (exerciseId: string) => void;
    canPublish?: boolean;
    findPublishedExercise?: (exercise: CustomExercise) => PublicExercise | undefined;
    onPublish?: (exercise: CustomExercise) => void;
    onUnpublish?: (exercise: CustomExercise) => void;
}

export const CustomExerciseList: React.FC<CustomExerciseListProps> = ({
    customExercises,
    isTogetherMode,
    getCreatorName,
    onEdit,
    onDelete,
    onStart,
    canPublish,
    findPublishedExercise,
    onPublish,
    onUnpublish,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <>
            {customExercises.map((exercise, index) => {
                const published = findPublishedExercise?.(exercise);
                const isPublished = !!published;
                const expanded = expandedId === exercise.id;

                return (
                    <motion.div
                        key={exercise.id}
                        className="card"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: index * 0.03 }}
                        style={{ padding: 0, overflow: 'hidden' }}
                    >
                        {/* Main row */}
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
                                    {isTogetherMode && exercise.creatorId && (
                                        <span style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 10,
                                            fontWeight: 700,
                                            color: '#2BBAA0',
                                            background: 'rgba(43, 186, 160, 0.1)',
                                            padding: '2px 6px',
                                            borderRadius: 8,
                                            display: 'inline-block',
                                            verticalAlign: 'middle',
                                        }}>
                                            👤 {getCreatorName(exercise.creatorId)}
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
                                    {exercise.hasSplit && (
                                        <span style={{ color: '#2BBAA0' }}>切替あり</span>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setExpandedId(expanded ? null : exercise.id); }}
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
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => onStart(exercise.id)}
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

                        {/* Expanded section */}
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                                >
                                    <div style={{ padding: '10px 16px 12px' }}>
                                        {exercise.description && (
                                            <p style={{
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                color: '#8395A7',
                                                margin: '0 0 8px',
                                            }}>
                                                {exercise.description}
                                            </p>
                                        )}

                                        {isPublished && published && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                marginBottom: 8,
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 11,
                                                color: '#0984E3',
                                            }}>
                                                <Download size={11} />
                                                {published.downloadCount}人がつかってるよ
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(exercise); }}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 8,
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#8395A7',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                <Edit2 size={12} />
                                                へんしゅう
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(exercise.id); }}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: 8,
                                                    border: 'none',
                                                    background: 'rgba(225, 112, 85, 0.08)',
                                                    cursor: 'pointer',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#E17055',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                            >
                                                <Trash2 size={12} />
                                                さくじょ
                                            </button>
                                            {canPublish && onPublish && onUnpublish && (
                                                isPublished ? (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onUnpublish(exercise); }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 8,
                                                            border: 'none',
                                                            background: 'rgba(225, 112, 85, 0.08)',
                                                            cursor: 'pointer',
                                                            fontFamily: "'Noto Sans JP', sans-serif",
                                                            fontSize: 12,
                                                            color: '#E17055',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <EyeOff size={12} />
                                                        ひこうかい
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onPublish(exercise); }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 8,
                                                            border: 'none',
                                                            background: 'rgba(9, 132, 227, 0.08)',
                                                            cursor: 'pointer',
                                                            fontFamily: "'Noto Sans JP', sans-serif",
                                                            fontSize: 12,
                                                            color: '#0984E3',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 4,
                                                        }}
                                                    >
                                                        <Upload size={12} />
                                                        こうかい
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </>
    );
};
