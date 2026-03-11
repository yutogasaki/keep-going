import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export interface PickerExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    splitLabel?: string; // e.g., "R30→L30" — undefined means single
}

export interface ExercisePickerSection {
    label: string;
    exercises: PickerExercise[];
}

interface ExercisePickerListProps {
    sections: ExercisePickerSection[];
    selectedIds: string[];
    onAddExercise: (exerciseId: string) => void;
    restExercises?: PickerExercise[];
}

const ExerciseRow: React.FC<{
    exercise: PickerExercise;
    count: number;
    onAdd: () => void;
}> = ({ exercise, count, onAdd }) => (
    <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onAdd}
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
                {exercise.sec}秒 {exercise.splitLabel ? `(${exercise.splitLabel})` : ''}
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

const RestPickerCard: React.FC<{
    exercises: PickerExercise[];
    selectedIds: string[];
    onAddExercise: (exerciseId: string) => void;
}> = ({ exercises, selectedIds, onAddExercise }) => (
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
            休憩
        </label>
        <div
            className="card"
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                padding: '16px 20px',
                border: '1px solid rgba(143, 164, 178, 0.16)',
                background: 'linear-gradient(135deg, rgba(248,249,250,0.96) 0%, rgba(240,243,245,0.98) 100%)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        background: 'linear-gradient(135deg, rgba(143, 164, 178, 0.18), rgba(178, 190, 195, 0.22))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                    }}
                >
                    💤
                </div>
                <div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 4,
                    }}>
                        休憩
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        lineHeight: 1.5,
                    }}>
                        はさむ秒数をえらぶ
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {exercises.map((exercise) => {
                    const count = selectedIds.filter((id) => id === exercise.id).length;
                    return (
                        <motion.button
                            key={exercise.id}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onAddExercise(exercise.id)}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '10px 14px',
                                borderRadius: 9999,
                                border: count > 0 ? '1.5px solid #8FA4B2' : '1px solid rgba(143, 164, 178, 0.24)',
                                background: count > 0 ? 'rgba(143, 164, 178, 0.16)' : 'rgba(255,255,255,0.92)',
                                color: '#5A6B75',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            {exercise.sec}秒
                            {count > 0 ? (
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 20,
                                        height: 20,
                                        padding: '0 6px',
                                        borderRadius: 9999,
                                        background: '#8FA4B2',
                                        color: 'white',
                                        fontFamily: "'Outfit', sans-serif",
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}
                                >
                                    ×{count}
                                </span>
                            ) : null}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    </div>
);

export const ExercisePickerList: React.FC<ExercisePickerListProps> = ({
    sections,
    selectedIds,
    onAddExercise,
    restExercises,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {sections.map((section) => {
                if (section.exercises.length === 0) return null;
                return (
                    <div key={section.label}>
                        <label style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#2D3436',
                            display: 'block',
                            marginBottom: 12,
                            marginLeft: 4,
                        }}>
                            {section.label}
                        </label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {section.exercises.map((exercise) => {
                                const count = selectedIds.filter((id) => id === exercise.id).length;
                                return (
                                    <ExerciseRow
                                        key={exercise.id}
                                        exercise={exercise}
                                        count={count}
                                        onAdd={() => onAddExercise(exercise.id)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
            {restExercises && restExercises.length > 0 ? (
                <RestPickerCard
                    exercises={restExercises}
                    selectedIds={selectedIds}
                    onAddExercise={onAddExercise}
                />
            ) : null}
        </div>
    );
};
