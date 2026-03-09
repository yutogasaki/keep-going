import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StandardExerciseList } from './individual-tab/StandardExerciseList';
import { SelectionBar } from './individual-tab/SelectionBar';
import type { MenuIndividualTabProps } from './individual-tab/types';
import {
    filterCustomExercisesByCategory,
    filterStandardExercisesByCategory,
    getAvailableIndividualCategories,
    type IndividualCategoryId,
    shouldShowCustomExercises,
} from './individual-tab/selectionCategories';
import { CustomExerciseSection } from './individual-tab/CustomExerciseSection';
import { IndividualCategoryToolbar } from './individual-tab/IndividualCategoryToolbar';
import { PublicExerciseSection } from './individual-tab/PublicExerciseSection';
import type { Exercise } from '../../data/exercises';

function sortTeacherExercises(exercises: Exercise[]): Exercise[] {
    return [...exercises].sort((left, right) => {
        const leftOrder = left.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }
        return left.name.localeCompare(right.name, 'ja');
    });
}

export const MenuIndividualTab: React.FC<MenuIndividualTabProps & {
    onStartHybridSession?: (requiredIds: string[]) => void;
}> = ({
    exercises,
    requiredExercises,
    customExercises,
    isTogetherMode,
    getCreatorName,
    onStartExercise,
    onEditCustomExercise,
    onDeleteCustomExercise,
    onStartCustomExercise,
    onCreateCustomExercise,
    teacherExerciseIds,
    isNewTeacherContent,
    canPublish,
    findPublishedExercise,
    onPublishExercise,
    onUnpublishExercise,
    onOpenPublicExerciseBrowser,
    onStartHybridSession,
}) => {
    const selectionEnabled = Boolean(onStartHybridSession);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [category, setCategory] = useState<IndividualCategoryId>('all');

    const availableCategories = useMemo(
        () => getAvailableIndividualCategories(exercises, customExercises),
        [customExercises, exercises],
    );
    const filteredExercises = useMemo(
        () => filterStandardExercisesByCategory(exercises, category),
        [category, exercises],
    );
    const recommendedTeacherExercises = useMemo(
        () => sortTeacherExercises(
            filteredExercises.filter((exercise) => exercise.origin === 'teacher' && exercise.recommended)
        ),
        [filteredExercises],
    );
    const teacherExercises = useMemo(
        () => sortTeacherExercises(
            filteredExercises.filter((exercise) => exercise.origin === 'teacher' && !exercise.recommended)
        ),
        [filteredExercises],
    );
    const standardExercises = useMemo(
        () => filteredExercises.filter((exercise) => exercise.origin !== 'teacher'),
        [filteredExercises],
    );
    const filteredCustomExercises = useMemo(
        () => filterCustomExercisesByCategory(customExercises, category),
        [category, customExercises],
    );
    const showCustomSection = useMemo(
        () => shouldShowCustomExercises(customExercises, category),
        [category, customExercises],
    );

    useEffect(() => {
        if (!availableCategories.includes(category)) {
            setCategory('all');
        }
    }, [availableCategories, category]);

    const handleToggleSelect = useCallback((exerciseId: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(exerciseId)) {
                next.delete(exerciseId);
            } else {
                next.add(exerciseId);
            }
            return next;
        });
    }, []);

    const handleReset = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleStartHybrid = useCallback(() => {
        if (selectedIds.size > 0 && onStartHybridSession) {
            onStartHybridSession([...selectedIds]);
            setSelectionMode(false);
            setSelectedIds(new Set());
        }
    }, [selectedIds, onStartHybridSession]);

    const handleToggleMode = useCallback(() => {
        setSelectionMode((prev) => {
            if (prev) {
                setSelectedIds(new Set());
            }
            return !prev;
        });
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
            <IndividualCategoryToolbar
                availableCategories={availableCategories}
                category={category}
                onCategoryChange={setCategory}
                selectionEnabled={selectionEnabled}
                selectionMode={selectionMode}
                onToggleMode={handleToggleMode}
            />

            <StandardExerciseList
                title="先生のおすすめ"
                exercises={recommendedTeacherExercises}
                requiredExerciseIds={requiredExercises}
                onStartExercise={onStartExercise}
                teacherExerciseIds={teacherExerciseIds}
                isNewTeacherContent={isNewTeacherContent}
                emptyMessage={recommendedTeacherExercises.length === 0 ? 'おすすめの先生種目はまだありません。' : null}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
            />

            <StandardExerciseList
                title="先生の種目"
                exercises={teacherExercises}
                requiredExerciseIds={requiredExercises}
                onStartExercise={onStartExercise}
                teacherExerciseIds={teacherExerciseIds}
                isNewTeacherContent={isNewTeacherContent}
                emptyMessage={teacherExercises.length === 0 ? 'このカテゴリの先生種目はまだありません。' : null}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
            />

            <StandardExerciseList
                title="みんなの種目"
                exercises={standardExercises}
                requiredExerciseIds={requiredExercises}
                onStartExercise={onStartExercise}
                teacherExerciseIds={teacherExerciseIds}
                isNewTeacherContent={isNewTeacherContent}
                emptyMessage={standardExercises.length === 0 ? 'このカテゴリの種目はまだありません。' : null}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
            />

            <CustomExerciseSection
                customExercises={filteredCustomExercises}
                showCustomSection={showCustomSection}
                isTogetherMode={isTogetherMode}
                getCreatorName={getCreatorName}
                onEdit={onEditCustomExercise}
                onDelete={onDeleteCustomExercise}
                onStart={onStartCustomExercise}
                onCreate={onCreateCustomExercise}
                canPublish={canPublish}
                findPublishedExercise={findPublishedExercise}
                onPublish={onPublishExercise}
                onUnpublish={onUnpublishExercise}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
            />

            {onOpenPublicExerciseBrowser ? (
                <PublicExerciseSection onOpenPublicExerciseBrowser={onOpenPublicExerciseBrowser} />
            ) : null}

            {selectionEnabled ? (
                <SelectionBar
                    count={selectedIds.size}
                    onStart={handleStartHybrid}
                    onReset={handleReset}
                />
            ) : null}
        </div>
    );
};
