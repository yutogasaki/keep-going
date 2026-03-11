import React, { useMemo } from 'react';
import type { Exercise } from '../../../data/exercises';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';
import { StandardExerciseList } from './StandardExerciseList';
import type { IndividualSelectionProps } from './types';

interface StandardExerciseSectionProps extends IndividualSelectionProps {
    title: string;
    exercises: Exercise[];
    restExercises: Exercise[];
    requiredExerciseIds: string[];
    onStartExercise: (exerciseId: string) => void;
    teacherExerciseIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
    emptyMessage?: string | null;
    expanded: boolean;
    onToggle: () => void;
}

export const StandardExerciseSection: React.FC<StandardExerciseSectionProps> = ({
    title,
    exercises,
    restExercises,
    requiredExerciseIds,
    onStartExercise,
    teacherExerciseIds,
    isNewTeacherContent,
    emptyMessage,
    selectionMode,
    selectedIds,
    onToggleSelect,
    expanded,
    onToggle,
}) => {
    const recommendedCount = useMemo(
        () => exercises.filter((exercise) => exercise.recommended).length,
        [exercises],
    );
    const newCount = useMemo(
        () => exercises.filter((exercise) => isNewTeacherContent?.(exercise.id)).length,
        [exercises, isNewTeacherContent],
    );
    const summary = [
        recommendedCount > 0 ? `おすすめ${recommendedCount}` : null,
        newCount > 0 ? `New${newCount}` : null,
        restExercises.length > 0 ? `休憩${restExercises.length}種類` : null,
    ].filter(Boolean).join(' · ');

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CollapsibleSectionHeader
                title={title}
                count={exercises.length + (restExercises.length > 0 ? 1 : 0)}
                summary={summary || undefined}
                expanded={expanded}
                onToggle={onToggle}
            />

            {expanded ? (
                <StandardExerciseList
                    exercises={exercises}
                    restExercises={restExercises}
                    requiredExerciseIds={requiredExerciseIds}
                    onStartExercise={onStartExercise}
                    teacherExerciseIds={teacherExerciseIds}
                    isNewTeacherContent={isNewTeacherContent}
                    emptyMessage={emptyMessage}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                />
            ) : null}
        </section>
    );
};
