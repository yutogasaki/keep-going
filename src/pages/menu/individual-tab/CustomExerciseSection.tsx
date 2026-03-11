import React, { useMemo } from 'react';
import type { CustomExercise } from '../../../lib/db';
import type { PublicExercise } from '../../../lib/publicExercises';
import { DISPLAY_TERMS } from '../../../lib/terminology';
import { CreateCustomExerciseCard } from './CreateCustomExerciseCard';
import { CustomExerciseList } from './CustomExerciseList';
import { IndividualSectionHeading } from './IndividualSectionHeading';
import { CollapsibleSectionHeader } from '../shared/CollapsibleSectionHeader';

interface CustomExerciseSectionProps {
    customExercises: CustomExercise[];
    showCustomSection: boolean;
    isTogetherMode: boolean;
    getCreatorName: (creatorId?: string) => string | null;
    onEdit: (exercise: CustomExercise) => void;
    onDelete: (exerciseId: string) => void;
    onStart: (exerciseId: string) => void;
    onCreate: () => void;
    canPublish?: boolean;
    findPublishedExercise?: (exercise: CustomExercise) => PublicExercise | undefined;
    onPublish?: (exercise: CustomExercise) => void;
    onUnpublish?: (exercise: CustomExercise) => void;
    selectionMode?: boolean;
    selectedIds?: Set<string>;
    onToggleSelect?: (exerciseId: string) => void;
    expanded: boolean;
    onToggle: () => void;
}

export const CustomExerciseSection: React.FC<CustomExerciseSectionProps> = ({
    customExercises,
    showCustomSection,
    isTogetherMode,
    getCreatorName,
    onEdit,
    onDelete,
    onStart,
    onCreate,
    canPublish,
    findPublishedExercise,
    onPublish,
    onUnpublish,
    selectionMode,
    selectedIds,
    onToggleSelect,
    expanded,
    onToggle,
}) => {
    const hasCustomExercises = customExercises.length > 0;
    const publishedCount = useMemo(
        () => customExercises.filter((exercise) => Boolean(findPublishedExercise?.(exercise))).length,
        [customExercises, findPublishedExercise],
    );
    const summary = publishedCount > 0 ? `公開中${publishedCount}` : undefined;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {hasCustomExercises ? (
                <CollapsibleSectionHeader
                    title={DISPLAY_TERMS.customExercise}
                    count={customExercises.length}
                    summary={summary}
                    expanded={expanded}
                    onToggle={onToggle}
                />
            ) : (
                <IndividualSectionHeading>{DISPLAY_TERMS.customExercise}</IndividualSectionHeading>
            )}

            {expanded && showCustomSection ? (
                <CustomExerciseList
                    customExercises={customExercises}
                    isTogetherMode={isTogetherMode}
                    getCreatorName={getCreatorName}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onStart={onStart}
                    canPublish={canPublish}
                    findPublishedExercise={findPublishedExercise}
                    onPublish={onPublish}
                    onUnpublish={onUnpublish}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                />
            ) : expanded ? (
                <div
                    className="card card-sm"
                    style={{
                        padding: '14px 16px',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}
                >
                    このカテゴリの {DISPLAY_TERMS.customExercise}はまだありません。
                </div>
            ) : null}

            {expanded ? <CreateCustomExerciseCard onCreate={onCreate} /> : null}
        </div>
    );
};
