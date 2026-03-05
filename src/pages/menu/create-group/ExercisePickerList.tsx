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

export const ExercisePickerList: React.FC<ExercisePickerListProps> = ({
    sections,
    selectedIds,
    onAddExercise,
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
        </div>
    );
};
