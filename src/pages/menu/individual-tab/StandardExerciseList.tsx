import React, { useState } from 'react';
import type { IndividualSelectionProps } from './types';
import type { Exercise } from '../../../data/exercises';
import { StandardExerciseCard } from './StandardExerciseCard';
import { IndividualSectionHeading } from './IndividualSectionHeading';
import { RestExerciseCard } from './RestExerciseCard';

interface StandardExerciseListProps extends IndividualSelectionProps {
    exercises: Exercise[];
    restExercises?: Exercise[];
    requiredExerciseIds: string[];
    onStartExercise: (exerciseId: string) => void;
    teacherExerciseIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
    title?: string;
    emptyMessage?: string | null;
}

export const StandardExerciseList: React.FC<StandardExerciseListProps> = ({
    exercises,
    restExercises = [],
    requiredExerciseIds,
    onStartExercise,
    teacherExerciseIds,
    isNewTeacherContent,
    title,
    emptyMessage,
    selectionMode,
    selectedIds,
    onToggleSelect,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {title ? <IndividualSectionHeading>{title}</IndividualSectionHeading> : null}
            {exercises.length === 0 && restExercises.length === 0 && emptyMessage ? (
                <div
                    className="card card-sm"
                    style={{
                        padding: '14px 16px',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}
                >
                    {emptyMessage}
                </div>
            ) : null}
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
            {restExercises.length > 0 ? (
                <RestExerciseCard
                    exercises={restExercises}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                />
            ) : null}
        </div>
    );
};
