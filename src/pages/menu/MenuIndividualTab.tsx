import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isRestExercise } from '../../data/exercises';
import { getExercisePlacementLabel } from '../../data/exercisePlacement';
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
import { StandardExerciseSection } from './individual-tab/StandardExerciseSection';
import { TeacherExerciseSection } from './individual-tab/TeacherExerciseSection';
import { MenuHighlightsStrip, type MenuHighlightItem } from './shared/MenuHighlightsStrip';

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
    sectionState,
    onToggleSection,
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
    const mainExercises = useMemo(
        () => filteredExercises.filter(
            (exercise) => exercise.origin !== 'teacher' || exercise.displayMode === 'standard_inline'
        ),
        [filteredExercises],
    );
    const standardExercises = useMemo(
        () => mainExercises.filter((exercise) => !isRestExercise(exercise)),
        [mainExercises],
    );
    const restExercises = useMemo(
        () => mainExercises.filter((exercise) => isRestExercise(exercise)),
        [mainExercises],
    );
    const teacherSectionExercises = useMemo(
        () => filteredExercises.filter(
            (exercise) => exercise.origin === 'teacher' && exercise.displayMode !== 'standard_inline'
        ),
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
    const standardExpanded = sectionState.standard ?? true;
    const hasTeacherHighlights = useMemo(
        () => teacherSectionExercises.some(
            (exercise) => exercise.recommended || isNewTeacherContent?.(exercise.id),
        ),
        [isNewTeacherContent, teacherSectionExercises],
    );
    const teacherExpanded = teacherSectionExercises.length === 0
        ? false
        : sectionState.teacher ?? hasTeacherHighlights;
    const customExpanded = filteredCustomExercises.length === 0
        ? true
        : sectionState.custom ?? false;
    const highlightItems = useMemo<MenuHighlightItem[]>(
        () => filteredExercises
            .filter((exercise) => !isRestExercise(exercise) && (exercise.recommended || isNewTeacherContent?.(exercise.id)))
            .sort((left, right) => {
                const leftRecommended = left.recommended ? 0 : 1;
                const rightRecommended = right.recommended ? 0 : 1;
                if (leftRecommended !== rightRecommended) {
                    return leftRecommended - rightRecommended;
                }

                const leftNew = isNewTeacherContent?.(left.id) ? 0 : 1;
                const rightNew = isNewTeacherContent?.(right.id) ? 0 : 1;
                if (leftNew !== rightNew) {
                    return leftNew - rightNew;
                }

                const leftOrder = left.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                const rightOrder = right.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }

                return left.name.localeCompare(right.name, 'ja');
            })
            .slice(0, 3)
            .map((exercise) => ({
                id: exercise.id,
                emoji: exercise.emoji,
                title: exercise.name,
                meta: `${exercise.sec}秒 · ${getExercisePlacementLabel(exercise.placement)}`,
                caption: exercise.recommended
                    ? '先生のおすすめをすぐ始められます'
                    : '新しく届いた種目を試せます',
                badges: [
                    ...(exercise.recommended ? ['おすすめ'] : []),
                    ...(isNewTeacherContent?.(exercise.id) ? ['New'] : []),
                ],
                onSelect: () => onStartExercise(exercise.id),
            })),
        [filteredExercises, isNewTeacherContent, onStartExercise],
    );
    const mainTitle = category === 'all'
        ? '今日つかう種目'
        : category === 'rest'
            ? '休憩'
            : `${getExercisePlacementLabel(category)}の種目`;

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

            <MenuHighlightsStrip
                title="先生のおすすめ"
                description="おすすめや新着の種目を先に見つけられます"
                items={highlightItems}
            />

            <StandardExerciseSection
                title={mainTitle}
                exercises={standardExercises}
                restExercises={restExercises}
                requiredExerciseIds={requiredExercises}
                onStartExercise={onStartExercise}
                teacherExerciseIds={teacherExerciseIds}
                isNewTeacherContent={isNewTeacherContent}
                emptyMessage={
                    standardExercises.length === 0 && teacherSectionExercises.length === 0 && restExercises.length === 0
                        ? 'このカテゴリの種目はまだありません。'
                        : null
                }
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                expanded={standardExpanded}
                onToggle={() => onToggleSection('standard', !standardExpanded)}
            />

            {teacherSectionExercises.length > 0 ? (
                <TeacherExerciseSection
                    exercises={teacherSectionExercises}
                    requiredExerciseIds={requiredExercises}
                    onStartExercise={onStartExercise}
                    teacherExerciseIds={teacherExerciseIds}
                    isNewTeacherContent={isNewTeacherContent}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    expanded={teacherExpanded}
                    onToggle={() => onToggleSection('teacher', !teacherExpanded)}
                />
            ) : null}

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
                expanded={customExpanded}
                onToggle={() => onToggleSection('custom', !customExpanded)}
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
