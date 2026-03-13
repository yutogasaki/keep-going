import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Download, Edit2, EyeOff, Play, Trash2, Upload } from 'lucide-react';
import { getExercisePlacementLabel } from '../../../data/exercisePlacement';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import type { CustomExercise } from '../../../lib/db';
import type { PublicExercise } from '../../../lib/publicExercises';
import { ExerciseSelectionIndicator } from './ExerciseSelectionIndicator';
import {
    catalogExpandButtonStyle,
    catalogHeaderRowStyle,
    catalogIconSurfaceStyle,
    catalogMetaLineStyle,
    catalogPlayButtonStyle,
    catalogTitleStyle,
} from '../shared/catalogCardChrome';

interface CustomExerciseCardProps {
    exercise: CustomExercise;
    index: number;
    expanded: boolean;
    selected: boolean;
    isTogetherMode: boolean;
    creatorName: string | null;
    selectionMode?: boolean;
    publishedExercise?: PublicExercise;
    canPublish?: boolean;
    onToggleExpand: (exerciseId: string) => void;
    onToggleSelect?: (exerciseId: string) => void;
    onEdit: (exercise: CustomExercise) => void;
    onDelete: (exerciseId: string) => void;
    onStart: (exerciseId: string) => void;
    onPublish?: (exercise: CustomExercise) => void;
    onUnpublish?: (exercise: CustomExercise) => void;
}

export const CustomExerciseCard: React.FC<CustomExerciseCardProps> = ({
    exercise,
    index,
    expanded,
    selected,
    isTogetherMode,
    creatorName,
    selectionMode,
    publishedExercise,
    canPublish,
    onToggleExpand,
    onToggleSelect,
    onEdit,
    onDelete,
    onStart,
    onPublish,
    onUnpublish,
}) => {
    const isPublished = Boolean(publishedExercise);

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
                style={catalogHeaderRowStyle}
            >
                {selectionMode ? (
                    <ExerciseSelectionIndicator selected={selected} />
                ) : (
                    <div style={catalogIconSurfaceStyle}>
                        <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color="#2D3436" />
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
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
                                ...catalogTitleStyle,
                                minWidth: 0,
                            }}
                        >
                            {exercise.name}
                        </span>
                        <span
                            style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 9,
                                fontWeight: 700,
                                color: '#8B5CF6',
                                background: 'rgba(139, 92, 246, 0.1)',
                                padding: '1px 5px',
                                borderRadius: 6,
                                display: 'inline-block',
                                verticalAlign: 'middle',
                            }}
                        >
                            じぶん
                        </span>
                        {isTogetherMode && exercise.creatorId && creatorName ? (
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#2BBAA0',
                                    background: 'rgba(43, 186, 160, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: 8,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                👤 {creatorName}
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            ...catalogMetaLineStyle,
                        }}
                    >
                        <span>{exercise.sec}秒</span>
                        <span>{getExercisePlacementLabel(exercise.placement)}</span>
                        {exercise.hasSplit ? <span style={{ color: '#2BBAA0' }}>切替あり</span> : null}
                    </div>
                </div>

                {!selectionMode ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleExpand(exercise.id);
                            }}
                            style={catalogExpandButtonStyle}
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
                            style={catalogPlayButtonStyle}
                        >
                            <Play size={14} color="white" fill="white" />
                        </motion.button>
                    </div>
                ) : null}
            </div>

            <AnimatePresence>
                {!selectionMode && expanded ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ padding: '10px 16px 12px' }}>
                            {exercise.description ? (
                                <p
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        color: '#8395A7',
                                        margin: '0 0 8px',
                                    }}
                                >
                                    {exercise.description}
                                </p>
                            ) : null}

                            {isPublished && publishedExercise ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        marginBottom: 8,
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#0984E3',
                                    }}
                                >
                                    <Download size={11} />
                                    {publishedExercise.downloadCount}人がつかってるよ
                                </div>
                            ) : null}

                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onEdit(exercise);
                                    }}
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
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onDelete(exercise.id);
                                    }}
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
                                {canPublish && onPublish && onUnpublish ? (
                                    isPublished ? (
                                        <button
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onUnpublish(exercise);
                                            }}
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
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onPublish(exercise);
                                            }}
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
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};
