import React, { useState } from 'react';
import type { IndividualSelectionProps } from './types';
import type { Exercise } from '../../../data/exercises';
import { StandardExerciseCard } from './StandardExerciseCard';

interface StandardExerciseListProps extends IndividualSelectionProps {
    exercises: Exercise[];
    requiredExerciseIds: string[];
    onStartExercise: (exerciseId: string) => void;
    teacherExerciseIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
}

export const StandardExerciseList: React.FC<StandardExerciseListProps> = ({
    exercises,
    requiredExerciseIds,
    onStartExercise,
    teacherExerciseIds,
    isNewTeacherContent,
    selectionMode,
    selectedIds,
    onToggleSelect,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {exercises.map((exercise, index) => (
                <StandardExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    expanded={expandedId === exercise.id}
                    required={requiredExerciseIds.includes(exercise.id)}
                    selected={Boolean(selectionMode && selectedIds?.has(exercise.id))}
                    selectionMode={selectionMode}
                    teacherBadge={teacherExerciseIds?.has(exercise.id)}
                    newBadge={isNewTeacherContent?.(exercise.id)}
                    onToggleExpand={(exerciseId) => {
                        setExpandedId((current) => (current === exerciseId ? null : exerciseId));
                    }}
                    onToggleSelect={onToggleSelect}
                    onStartExercise={onStartExercise}
                />
            ))}
        </div>
    );
};
