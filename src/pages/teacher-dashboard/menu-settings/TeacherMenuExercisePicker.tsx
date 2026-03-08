import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import { editorLabelStyle } from '../../../components/editor/EditorShell';
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
    const lookupExercise = (id: string) => exercises.find((exercise) => exercise.id === id);

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {exercises.map((exercise) => {
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
                                        {exercise.sec}秒
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
                    })}
                </div>
            </div>
        </>
    );
};
