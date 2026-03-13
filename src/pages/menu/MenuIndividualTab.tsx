import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isRestExercise, type Exercise } from '../../data/exercises';
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
import { IndividualCategoryToolbar } from './individual-tab/IndividualCategoryToolbar';
import { PublicExerciseSection } from './individual-tab/PublicExerciseSection';
import { StandardExerciseList } from './individual-tab/StandardExerciseList';
import { CustomExerciseList } from './individual-tab/CustomExerciseList';
import { CreateCustomExerciseCard } from './individual-tab/CreateCustomExerciseCard';
import { IndividualSectionHeading } from './individual-tab/IndividualSectionHeading';
import { ShowMoreButton } from './shared/ShowMoreButton';
import { DISPLAY_TERMS } from '../../lib/terminology';

const INITIAL_VISIBLE = 4;

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
    const [showAll, setShowAll] = useState(false);

    const availableCategories = useMemo(
        () => getAvailableIndividualCategories(exercises, customExercises),
        [customExercises, exercises],
    );
    const filteredExercises = useMemo(
        () => filterStandardExercisesByCategory(exercises, category),
        [category, exercises],
    );

    // Merge all standard + teacher section exercises into one sorted flat list
    const allExercises = useMemo(() => {
        const nonRest = filteredExercises.filter((e) => !isRestExercise(e));
        return nonRest.sort((a, b) => {
            const score = (ex: Exercise): number => {
                if (ex.recommended) return 0;
                if (isNewTeacherContent?.(ex.id)) return 1;
                // teacher section exercises come after standard
                if (ex.origin === 'teacher' && ex.displayMode !== 'standard_inline') return 3;
                return 2;
            };
            const sa = score(a);
            const sb = score(b);
            if (sa !== sb) return sa - sb;
            if (sa === 0) {
                const oa = a.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                const ob = b.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                if (oa !== ob) return oa - ob;
            }
            return a.name.localeCompare(b.name, 'ja');
        });
    }, [filteredExercises, isNewTeacherContent]);

    const restExercises = useMemo(
        () => filteredExercises.filter((e) => isRestExercise(e)),
        [filteredExercises],
    );

    const visibleExercises = showAll ? allExercises : allExercises.slice(0, INITIAL_VISIBLE);
    const remaining = allExercises.length - INITIAL_VISIBLE;

    const filteredCustomExercises = useMemo(
        () => filterCustomExercisesByCategory(customExercises, category),
        [category, customExercises],
    );
    const showCustomSection = useMemo(
        () => shouldShowCustomExercises(customExercises, category),
        [category, customExercises],
    );

    const sectionTitle = category === 'all'
        ? '種目'
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

    const totalCount = allExercises.length + (restExercises.length > 0 ? 1 : 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
            <IndividualCategoryToolbar
                availableCategories={availableCategories}
                category={category}
                onCategoryChange={setCategory}
                selectionEnabled={selectionEnabled}
                selectionMode={selectionMode}
                onToggleMode={handleToggleMode}
            />

            {totalCount > 0 ? (
                <section>
                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 10,
                        letterSpacing: 1,
                    }}>
                        {sectionTitle}
                        <span style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#B2BEC3',
                            marginLeft: 8,
                        }}>
                            {totalCount}
                        </span>
                    </h2>
                    <StandardExerciseList
                        exercises={visibleExercises}
                        restExercises={showAll || allExercises.length <= INITIAL_VISIBLE ? restExercises : []}
                        requiredExerciseIds={requiredExercises}
                        onStartExercise={onStartExercise}
                        teacherExerciseIds={teacherExerciseIds}
                        isNewTeacherContent={isNewTeacherContent}
                        selectionMode={selectionMode}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                    />
                    {remaining > 0 ? (
                        <div style={{ marginTop: 8 }}>
                            <ShowMoreButton
                                remainingCount={remaining}
                                expanded={showAll}
                                onToggle={() => setShowAll((v) => !v)}
                            />
                        </div>
                    ) : null}
                </section>
            ) : (
                <div
                    className="card card-sm"
                    style={{
                        padding: '14px 16px',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}
                >
                    このカテゴリの種目はまだありません。
                </div>
            )}

            {showCustomSection ? (
                <section>
                    <IndividualSectionHeading>
                        {DISPLAY_TERMS.customExercise}
                        {filteredCustomExercises.length > 0 ? (
                            <span style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#B2BEC3',
                                marginLeft: 8,
                            }}>
                                {filteredCustomExercises.length}
                            </span>
                        ) : null}
                    </IndividualSectionHeading>
                    {filteredCustomExercises.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            <CustomExerciseList
                                customExercises={filteredCustomExercises}
                                isTogetherMode={isTogetherMode}
                                getCreatorName={getCreatorName}
                                onEdit={onEditCustomExercise}
                                onDelete={onDeleteCustomExercise}
                                onStart={onStartCustomExercise}
                                canPublish={canPublish}
                                findPublishedExercise={findPublishedExercise}
                                onPublish={onPublishExercise}
                                onUnpublish={onUnpublishExercise}
                                selectionMode={selectionMode}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                            />
                        </div>
                    ) : (
                        <div
                            className="card card-sm"
                            style={{
                                padding: '14px 16px',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                                marginTop: 8,
                            }}
                        >
                            このカテゴリの {DISPLAY_TERMS.customExercise}はまだありません。
                        </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                        <CreateCustomExerciseCard onCreate={onCreateCustomExercise} />
                    </div>
                </section>
            ) : null}

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
