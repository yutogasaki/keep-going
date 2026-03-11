import React, { useMemo } from 'react';
import type { Exercise } from '../../../data/exercises';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';
import { StandardExerciseList } from './StandardExerciseList';
import type { IndividualSelectionProps } from './types';

interface TeacherExerciseSectionProps extends IndividualSelectionProps {
    exercises: Exercise[];
    requiredExerciseIds: string[];
    onStartExercise: (exerciseId: string) => void;
    teacherExerciseIds?: Set<string>;
    isNewTeacherContent?: (id: string) => boolean;
    expanded: boolean;
    onToggle: () => void;
}

export const TeacherExerciseSection: React.FC<TeacherExerciseSectionProps> = ({
    exercises,
    requiredExerciseIds,
    onStartExercise,
    teacherExerciseIds,
    isNewTeacherContent,
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
    ].filter(Boolean).join(' · ');

    if (exercises.length === 0) {
        return null;
    }

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <CollapsibleSectionHeader
                title="先生種目"
                count={exercises.length}
                summary={summary || undefined}
                expanded={expanded}
                onToggle={onToggle}
            />

            {expanded ? (
                <StandardExerciseList
                    exercises={exercises}
                    requiredExerciseIds={requiredExerciseIds}
                    onStartExercise={onStartExercise}
                    teacherExerciseIds={teacherExerciseIds}
                    isNewTeacherContent={isNewTeacherContent}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                />
            ) : null}
        </section>
    );
};
