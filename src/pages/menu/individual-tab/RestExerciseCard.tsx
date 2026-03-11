import React from 'react';
import type { Exercise } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import {
    catalogHeaderRowStyle,
    catalogIconSurfaceStyle,
    catalogMetaLineStyle,
    catalogTitleStyle,
} from '../shared/catalogCardChrome';

interface RestExerciseCardProps {
    exercises: Exercise[];
    selectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelect?: (exerciseId: string) => void;
}

export const RestExerciseCard: React.FC<RestExerciseCardProps> = ({
    exercises,
    selectionMode,
    selectedIds,
    onToggleSelect,
}) => {
    const optionLabel = exercises.map((exercise) => `${exercise.sec}秒`).join(' / ');
    const description = exercises[0]?.description ?? 'すこしやすんで、つぎにそなえよう！';
    const selectedCount = exercises.filter((exercise) => selectedIds?.has(exercise.id)).length;

    return (
        <div
            className="card"
            style={{
                padding: 0,
                overflow: 'hidden',
                outline: selectedCount > 0 ? '2px solid #8FA4B2' : 'none',
                outlineOffset: -2,
                background: 'linear-gradient(135deg, rgba(248,249,250,0.96) 0%, rgba(240,243,245,0.98) 100%)',
            }}
        >
            <div style={catalogHeaderRowStyle}>
                <div style={catalogIconSurfaceStyle}>
                    <ExerciseIcon id={exercises[0]?.id ?? 'R03'} emoji="💤" size={24} color="#5A6B75" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            ...catalogTitleStyle,
                            marginBottom: 2,
                        }}
                    >
                        休憩
                    </div>
                    <div style={catalogMetaLineStyle}>
                        <span>{optionLabel}</span>
                        <span style={{ color: '#8FA4B2' }}>組み合わせ用</span>
                    </div>
                    <div
                        style={{
                            marginTop: 8,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            lineHeight: 1.5,
                        }}
                    >
                        {description}
                    </div>
                </div>
            </div>

            <div
                style={{
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    padding: '12px 16px 14px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                }}
            >
                {exercises.map((exercise) => {
                    const selected = Boolean(selectedIds?.has(exercise.id));
                    const commonStyle: React.CSSProperties = {
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 64,
                        padding: '8px 12px',
                        borderRadius: 9999,
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                    };

                    if (!selectionMode) {
                        return (
                            <span
                                key={exercise.id}
                                style={{
                                    ...commonStyle,
                                    background: 'rgba(255,255,255,0.92)',
                                    border: '1px solid rgba(143, 164, 178, 0.24)',
                                    color: '#5A6B75',
                                }}
                            >
                                {exercise.sec}秒
                            </span>
                        );
                    }

                    return (
                        <button
                            key={exercise.id}
                            type="button"
                            onClick={() => onToggleSelect?.(exercise.id)}
                            style={{
                                ...commonStyle,
                                border: selected ? '1.5px solid #8FA4B2' : '1px solid rgba(143, 164, 178, 0.24)',
                                background: selected ? 'rgba(143, 164, 178, 0.16)' : 'rgba(255,255,255,0.92)',
                                color: '#5A6B75',
                                cursor: 'pointer',
                            }}
                        >
                            {exercise.sec}秒
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
