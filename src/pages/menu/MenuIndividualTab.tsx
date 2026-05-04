import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isRestExercise, type Exercise } from '../../data/exercises';
import { getExercisePlacementLabel } from '../../data/exercisePlacement';
import type { CustomExercise } from '../../lib/db';
import { SelectionBar } from './individual-tab/SelectionBar';
import type { MenuIndividualTabProps } from './individual-tab/types';
import {
    filterCustomExercisesByCategory,
    filterStandardExercisesByCategory,
    getAvailableIndividualCategories,
    type IndividualCategoryId,
} from './individual-tab/selectionCategories';
import { IndividualCategoryToolbar } from './individual-tab/IndividualCategoryToolbar';
import { PublicExerciseSection } from './individual-tab/PublicExerciseSection';
import { StandardExerciseCard } from './individual-tab/StandardExerciseCard';
import { CustomExerciseCard } from './individual-tab/CustomExerciseCard';
import { RestExerciseCard } from './individual-tab/RestExerciseCard';
import { CreateCustomExerciseCard } from './individual-tab/CreateCustomExerciseCard';
import { ShowMoreButton } from './shared/ShowMoreButton';
import { OriginFilter, type OriginFilterId } from './shared/OriginFilter';

const INITIAL_VISIBLE = 5;
const RECENT_DAYS = 7;

/** Discriminated union for a flat exercise list that mixes standard + custom */
type ExerciseItem =
    | { kind: 'standard'; exercise: Exercise }
    | { kind: 'custom'; exercise: CustomExercise };

export function filterRestExercisesByOrigin(
    restExercises: Exercise[],
    origin: OriginFilterId,
): Exercise[] {
    if (origin === 'all') {
        return restExercises;
    }

    if (origin === 'teacher') {
        return restExercises.filter((exercise) => exercise.origin === 'teacher');
    }

    return [];
}

export const MenuIndividualTab: React.FC<MenuIndividualTabProps & {
    onStartHybridSession?: (requiredIds: string[]) => void;
}> = ({
    usageStats,
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
    focusCategory,
    focusRequestId,
    onCreatePersonalChallenge,
}) => {
    const selectionEnabled = Boolean(onStartHybridSession);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [category, setCategory] = useState<IndividualCategoryId>('all');
    const [origin, setOrigin] = useState<OriginFilterId>('all');
    const [showAll, setShowAll] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const recentCutoff = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - RECENT_DAYS);
        return d.toISOString();
    }, []);

    const availableCategories = useMemo(
        () => getAvailableIndividualCategories(exercises, customExercises),
        [customExercises, exercises],
    );
    const filteredExercises = useMemo(
        () => filterStandardExercisesByCategory(exercises, category),
        [category, exercises],
    );
    const filteredCustomExercises = useMemo(
        () => filterCustomExercisesByCategory(customExercises, category),
        [category, customExercises],
    );

    // Merge standard + custom into one flat sorted list (excluding rest)
    const allItems = useMemo<ExerciseItem[]>(() => {
        const standardItems: ExerciseItem[] = filteredExercises
            .filter((e) => !isRestExercise(e))
            .map((exercise) => ({ kind: 'standard' as const, exercise }));

        const customItems: ExerciseItem[] = filteredCustomExercises
            .map((exercise) => ({ kind: 'custom' as const, exercise }));

        const combined = [...standardItems, ...customItems];

        const scoreItem = (item: ExerciseItem): number => {
            const id = item.exercise.id;
            if (item.kind === 'standard' && item.exercise.recommended) return 0;
            if (isNewTeacherContent?.(id)) return 1;
            const lastUsed = usageStats.exerciseLastUsed.get(id);
            if (lastUsed && lastUsed >= recentCutoff) return 2;
            if (item.kind === 'custom') return 5;
            if (item.kind === 'standard' && item.exercise.origin === 'teacher'
                && item.exercise.displayMode !== 'standard_inline') return 4;
            return 3;
        };

        return combined.sort((a, b) => {
            const sa = scoreItem(a);
            const sb = scoreItem(b);
            if (sa !== sb) return sa - sb;
            if (sa === 0 && a.kind === 'standard' && b.kind === 'standard') {
                const oa = a.exercise.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                const ob = b.exercise.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
                if (oa !== ob) return oa - ob;
            }
            // Within same tier, sort by last used (most recent first)
            const la = usageStats.exerciseLastUsed.get(a.exercise.id) ?? '';
            const lb = usageStats.exerciseLastUsed.get(b.exercise.id) ?? '';
            if (la !== lb) return lb.localeCompare(la);
            return a.exercise.name.localeCompare(b.exercise.name, 'ja');
        });
    }, [filteredExercises, filteredCustomExercises, isNewTeacherContent, usageStats, recentCutoff]);

    const restExercises = useMemo(
        () => filteredExercises.filter((e) => isRestExercise(e)),
        [filteredExercises],
    );

    // Origin filter
    const availableOrigins = useMemo<OriginFilterId[]>(() => {
        const origins: OriginFilterId[] = ['all'];
        if (allItems.some((item) => item.kind === 'standard' && item.exercise.origin === 'teacher')) {
            origins.push('teacher');
        }
        if (allItems.some((item) => item.kind === 'custom')) {
            origins.push('custom');
        }
        return origins;
    }, [allItems]);

    const originFiltered = useMemo(() => {
        if (origin === 'all') return allItems;
        if (origin === 'teacher') return allItems.filter((item) => item.kind === 'standard' && item.exercise.origin === 'teacher');
        return allItems.filter((item) => item.kind === 'custom');
    }, [allItems, origin]);

    const originFilteredRest = filterRestExercisesByOrigin(restExercises, origin);

    const visibleItems = showAll ? originFiltered : originFiltered.slice(0, INITIAL_VISIBLE);
    const remaining = originFiltered.length - INITIAL_VISIBLE;
    const showRest = showAll || originFiltered.length <= INITIAL_VISIBLE;

    const totalCount = originFiltered.length + (originFilteredRest.length > 0 ? 1 : 0);

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

    useEffect(() => {
        if (!availableOrigins.includes(origin)) {
            setOrigin('all');
        }
    }, [availableOrigins, origin]);

    useEffect(() => {
        if (!focusCategory) {
            return;
        }

        setCategory(focusCategory);
        setOrigin('all');
        setShowAll(false);
        setExpandedId(null);
    }, [focusCategory, focusRequestId]);

    // Reset showAll when filters change
    useEffect(() => {
        setShowAll(false);
    }, [category, origin]);

    const handleToggleExpand = useCallback((exerciseId: string) => {
        setExpandedId((current) => (current === exerciseId ? null : exerciseId));
    }, []);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
            <IndividualCategoryToolbar
                availableCategories={availableCategories}
                category={category}
                onCategoryChange={setCategory}
                selectionEnabled={selectionEnabled}
                selectionMode={selectionMode}
                onToggleMode={handleToggleMode}
            />

            <OriginFilter
                value={origin}
                onChange={setOrigin}
                available={availableOrigins}
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {visibleItems.map((item, index) =>
                            item.kind === 'standard' ? (
                                <StandardExerciseCard
                                    key={item.exercise.id}
                                    exercise={item.exercise}
                                    index={index}
                                    expanded={expandedId === item.exercise.id}
                                    required={requiredExercises.includes(item.exercise.id)}
                                    selected={Boolean(selectionMode && selectedIds.has(item.exercise.id))}
                                    selectionMode={selectionMode}
                                    teacherBadge={teacherExerciseIds?.has(item.exercise.id)}
                                    newBadge={isNewTeacherContent?.(item.exercise.id)}
                                    onToggleExpand={handleToggleExpand}
                                    onToggleSelect={handleToggleSelect}
                                    onStartExercise={onStartExercise}
                                    onCreatePersonalChallenge={onCreatePersonalChallenge}
                                />
                            ) : (
                                <CustomExerciseCard
                                    key={item.exercise.id}
                                    exercise={item.exercise}
                                    index={index}
                                    expanded={expandedId === item.exercise.id}
                                    selected={Boolean(selectionMode && selectedIds.has(item.exercise.id))}
                                    isTogetherMode={isTogetherMode}
                                    creatorName={getCreatorName(item.exercise.creatorId)}
                                    selectionMode={selectionMode}
                                    publishedExercise={findPublishedExercise?.(item.exercise)}
                                    canPublish={canPublish}
                                    onToggleExpand={handleToggleExpand}
                                    onToggleSelect={handleToggleSelect}
                                    onEdit={onEditCustomExercise}
                                    onDelete={onDeleteCustomExercise}
                                    onStart={onStartCustomExercise}
                                    onPublish={onPublishExercise}
                                    onUnpublish={onUnpublishExercise}
                                    onCreatePersonalChallenge={onCreatePersonalChallenge}
                                />
                            ),
                        )}
                        {showRest && originFilteredRest.length > 0 ? (
                            <RestExerciseCard
                                exercises={originFilteredRest}
                                selectionMode={selectionMode}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                            />
                        ) : null}
                    </div>
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

            <CreateCustomExerciseCard onCreate={onCreateCustomExercise} />

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
