import React, { useState } from 'react';
import type { CustomExercise } from '../../../lib/db';
import type { PublicExercise } from '../../../lib/publicExercises';
import type { IndividualSelectionProps } from './types';
import { CustomExerciseCard } from './CustomExerciseCard';

interface CustomExerciseListProps extends IndividualSelectionProps {
    customExercises: CustomExercise[];
    isTogetherMode: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    onEdit: (exercise: CustomExercise) => void;
    onDelete: (exerciseId: string) => void;
    onStart: (exerciseId: string) => void;
    canPublish?: boolean;
    findPublishedExercise?: (exercise: CustomExercise) => PublicExercise | undefined;
    onPublish?: (exercise: CustomExercise) => void;
    onUnpublish?: (exercise: CustomExercise) => void;
}

export const CustomExerciseList: React.FC<CustomExerciseListProps> = ({
    customExercises,
    isTogetherMode,
    getCreatorName,
    onEdit,
    onDelete,
    onStart,
    canPublish,
    findPublishedExercise,
    onPublish,
    onUnpublish,
    selectionMode,
    selectedIds,
    onToggleSelect,
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <>
            {customExercises.map((exercise, index) => (
                <CustomExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    expanded={expandedId === exercise.id}
                    selected={Boolean(selectionMode && selectedIds?.has(exercise.id))}
                    isTogetherMode={isTogetherMode}
                    creatorName={getCreatorName(exercise.creatorId)}
                    selectionMode={selectionMode}
                    publishedExercise={findPublishedExercise?.(exercise)}
                    canPublish={canPublish}
                    onToggleExpand={(exerciseId) => {
                        setExpandedId((current) => (current === exerciseId ? null : exerciseId));
                    }}
                    onToggleSelect={onToggleSelect}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStart={onStart}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                />
            ))}
        </>
    );
};
