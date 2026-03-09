import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import { editorLabelStyle } from '../../../components/editor/EditorShell';
import { EXERCISE_PLACEMENTS, getExercisePlacementLabel } from '../../../data/exercisePlacement';
import { COLOR, FONT, FONT_SIZE, inputField } from '../../../lib/styles';
import type { MenuEditorExerciseOption } from './teacherEditorHelpers';

interface TeacherMenuExercisePickerProps {
    exerciseIds: string[];
    exercises: MenuEditorExerciseOption[];
    onAddExercise: (id: string) => void;
    onRemoveAtIndex: (index: number) => void;
}

export const TeacherMenuExercisePicker: React.FC<TeacherMenuExercisePickerProps> = ({
    exerciseIds,
    exercises,
    onAddExercise,
    onRemoveAtIndex,
}) => {
    const [query, setQuery] = useState('');
    const [placementFilter, setPlacementFilter] = useState<'all' | MenuEditorExerciseOption['placement']>('all');
    const lookupExercise = (id: string) => exercises.find((exercise) => exercise.id === id);
    const filteredExercises = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return exercises.filter((exercise) => {
            const matchesQuery = normalizedQuery.length === 0
                || exercise.name.toLowerCase().includes(normalizedQuery)
                || getExercisePlacementLabel(exercise.placement).toLowerCase().includes(normalizedQuery);
            const matchesPlacement = placementFilter === 'all' || exercise.placement === placementFilter;
            return matchesQuery && matchesPlacement;
        });
    }, [exercises, placementFilter, query]);
    const standardExercises = filteredExercises.filter((exercise) => !exercise.isTeacher);
    const teacherExercises = filteredExercises.filter((exercise) => exercise.isTeacher);

    const renderExerciseButton = (exercise: MenuEditorExerciseOption) => {
        const count = exerciseIds.filter((id) => id === exercise.id).length;
        return (
            <motion.button
                key={exercise.id}
                whileTap={{ scale: 0.98 }}
                type="button"
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
                <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color="#2D3436" />
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
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
                        {exercise.isTeacher ? (
                            <span
                                style={{
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#0984E3',
                                    background: 'rgba(9,132,227,0.1)',
                                    padding: '1px 6px',
                                    borderRadius: 6,
                                }}
                            >
                                先生
                            </span>
                        ) : null}
                    </div>
                    <span
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                        }}
                    >
                        {exercise.sec}秒 ・ {getExercisePlacementLabel(exercise.placement)}
                    </span>
                </div>
                {count > 0 ? (
                    <span
                        style={{
                            padding: '4px 10px',
                            borderRadius: 10,
                            background: '#2BBAA0',
                            color: 'white',
                            fontSize: 12,
                            fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif",
                            boxShadow: '0 2px 8px rgba(43, 186, 160, 0.4)',
                        }}
                    >
                        ×{count}
                    </span>
                ) : (
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: '#F8F9FA',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Plus size={18} color="#B2BEC3" />
                    </div>
                )}
            </motion.button>
        );
    };

    const renderExerciseSection = (title: string, sectionExercises: MenuEditorExerciseOption[]) => {
        if (sectionExercises.length === 0) return null;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#8395A7',
                        padding: '4px 4px 0',
                    }}
                >
                    {title}
                </div>
                {sectionExercises.map(renderExerciseButton)}
            </div>
        );
    };

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <label style={{ ...editorLabelStyle, marginBottom: 0 }}>
                    えらんだ種目（{exerciseIds.length}）
                </label>
            </div>

            {exerciseIds.length === 0 ? (
                <div
                    style={{
                        background: '#F8F9FA',
                        borderRadius: 16,
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        border: '2px dashed rgba(0,0,0,0.05)',
                    }}
                >
                    <div style={{ fontSize: 24, opacity: 0.5 }}>👇</div>
                    <p
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            textAlign: 'center',
                            margin: 0,
                            fontWeight: 600,
                        }}
                    >
                        下のリストから種目をタップしてね
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {exerciseIds.map((id, index) => {
                        const exercise = lookupExercise(id);
                        if (!exercise) return null;
                        return (
                            <motion.button
                                key={`${id}-${index}`}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => onRemoveAtIndex(index)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: 'rgba(43, 186, 160, 0.1)',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#00796B',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    boxShadow: '0 2px 4px rgba(43, 186, 160, 0.05)',
                                }}
                            >
                                {exercise.emoji} {exercise.name}
                                <span
                                    style={{
                                        background: 'rgba(0,0,0,0.05)',
                                        borderRadius: '50%',
                                        width: 16,
                                        height: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#00796B',
                                        fontSize: 10,
                                        marginLeft: 4,
                                    }}
                                >
                                    ×
                                </span>
                            </motion.button>
                        );
                    })}
                </div>
            )}

            <div style={{ marginTop: 20 }}>
                <label
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#2D3436',
                        display: 'block',
                        marginBottom: 12,
                        marginLeft: 4,
                    }}
                >
                    種目をタップして追加（くりかえしOK）
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="名前や位置でさがす"
                        style={{
                            ...inputField,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.dark,
                        }}
                    />
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => setPlacementFilter('all')}
                            style={{
                                padding: '7px 10px',
                                borderRadius: 999,
                                border: placementFilter === 'all' ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                background: placementFilter === 'all' ? '#E8F8F0' : '#FFF',
                                color: placementFilter === 'all' ? '#2BBAA0' : COLOR.text,
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xs,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            すべて
                        </button>
                        {EXERCISE_PLACEMENTS.map((placement) => (
                            <button
                                key={placement}
                                type="button"
                                onClick={() => setPlacementFilter(placement)}
                                style={{
                                    padding: '7px 10px',
                                    borderRadius: 999,
                                    border: placementFilter === placement ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                    background: placementFilter === placement ? '#E8F8F0' : '#FFF',
                                    color: placementFilter === placement ? '#2BBAA0' : COLOR.text,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                {getExercisePlacementLabel(placement)}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {renderExerciseSection('標準種目', standardExercises)}
                    {renderExerciseSection('先生の種目', teacherExercises)}
                    {filteredExercises.length === 0 ? (
                        <div
                            className="card"
                            style={{
                                padding: '14px 16px',
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: '#8395A7',
                            }}
                        >
                            条件に合う種目がありません
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
};
