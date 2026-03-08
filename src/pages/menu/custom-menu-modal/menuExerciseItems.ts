import { EXERCISES, type Exercise } from '../../../data/exercises';
import {
    getExercisePlacementLabel,
    getExercisePlacementOrder,
} from '../../../data/exercisePlacement';
import type { CustomExercise } from '../../../lib/db';
import type { TeacherExercise } from '../../../lib/teacherContent';

export type FilterId = 'all' | 'changed' | 'teacher' | 'custom';
export type MenuExercise = Exercise | TeacherExercise | CustomExercise;
type ExerciseSource = 'builtIn' | 'teacher' | 'custom';

export interface MenuExerciseItem {
    exercise: MenuExercise;
    helperText: string | null;
    isExcluded: boolean;
    isRequired: boolean;
    isRest: boolean;
    isTeacherExcluded: boolean;
    isTeacherRequired: boolean;
    isUserExcluded: boolean;
    isUserRequired: boolean;
    matchesFilter: boolean;
    matchesQuery: boolean;
    placementLabel: string;
    source: ExerciseSource;
    sourceLabel: string | null;
    teacherBadge: string | null;
    userBadge: string | null;
}

interface BuildMenuExerciseItemsParams {
    customExercises: CustomExercise[];
    excludedExercises: string[];
    filter: FilterId;
    query: string;
    requiredExercises: string[];
    teacherExercises?: TeacherExercise[];
    teacherExcludedExerciseIds?: Set<string>;
    teacherHiddenExerciseIds?: Set<string>;
    teacherRequiredExerciseIds?: Set<string>;
}

interface CycleMenuExerciseSelectionParams {
    excludedExercises: string[];
    item: Pick<
        MenuExerciseItem,
        'exercise' | 'isRest' | 'isTeacherExcluded' | 'isTeacherRequired' | 'isUserExcluded' | 'isUserRequired'
    >;
    requiredExercises: string[];
}

export const FILTER_OPTIONS: Array<{ id: FilterId; label: string }> = [
    { id: 'all', label: 'ぜんぶ' },
    { id: 'changed', label: '変更あり' },
    { id: 'teacher', label: '先生' },
    { id: 'custom', label: 'じぶん種目' },
];

const getDescription = (exercise: MenuExercise) =>
    'description' in exercise && typeof exercise.description === 'string'
        ? exercise.description
        : '';

function isTeacherExercise(exercise: MenuExercise): exercise is TeacherExercise {
    return 'classLevels' in exercise;
}

function isCustomExercise(exercise: MenuExercise): exercise is CustomExercise {
    return 'creatorId' in exercise;
}

function getExerciseSource(exercise: MenuExercise): ExerciseSource {
    if (isTeacherExercise(exercise)) {
        return 'teacher';
    }

    if (isCustomExercise(exercise)) {
        return 'custom';
    }

    return 'builtIn';
}

function getSourceLabel(source: ExerciseSource): string | null {
    if (source === 'teacher') {
        return '先生';
    }

    if (source === 'custom') {
        return 'じぶん種目';
    }

    return null;
}

export function buildMenuExerciseItems({
    customExercises,
    excludedExercises,
    filter,
    query,
    requiredExercises,
    teacherExercises,
    teacherExcludedExerciseIds,
    teacherHiddenExerciseIds,
    teacherRequiredExerciseIds,
}: BuildMenuExerciseItemsParams): MenuExerciseItem[] {
    const normalizedQuery = query.trim().toLowerCase();

    return [...EXERCISES, ...(teacherExercises ?? []), ...customExercises]
        .filter((exercise) => !teacherHiddenExerciseIds?.has(exercise.id))
        .sort((a, b) => {
            const placementDiff = getExercisePlacementOrder(a.placement) - getExercisePlacementOrder(b.placement);
            if (placementDiff !== 0) {
                return placementDiff;
            }

            return a.name.localeCompare(b.name, 'ja');
        })
        .map((exercise) => {
            const isRest = exercise.placement === 'rest';
            const isTeacherRequired = teacherRequiredExerciseIds?.has(exercise.id) ?? false;
            const isTeacherExcluded = teacherExcludedExerciseIds?.has(exercise.id) ?? false;
            const isUserRequired = requiredExercises.includes(exercise.id);
            const isUserExcluded = excludedExercises.includes(exercise.id);
            const isRequired = isUserRequired || (isTeacherRequired && !isUserExcluded);
            const isExcluded = !isRequired && (isUserExcluded || (isTeacherExcluded && !isUserRequired));
            const teacherBadge = isTeacherRequired ? '先生: 必須' : isTeacherExcluded ? '先生: 除外' : null;
            const userBadge = isUserRequired ? 'じぶん: 必須' : isUserExcluded ? 'じぶん: 除外' : null;
            const source = getExerciseSource(exercise);
            const sourceLabel = getSourceLabel(source);
            const hasAdjustment = isTeacherRequired || isTeacherExcluded || isUserRequired || isUserExcluded;
            const helperText = userBadge ?? teacherBadge ?? (isRest ? 'きゅうけい種目' : null);

            const querySource = [
                exercise.name,
                getDescription(exercise),
                helperText,
                sourceLabel,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesQuery = normalizedQuery.length === 0 || querySource.includes(normalizedQuery);
            const matchesFilter = filter === 'all'
                || (filter === 'changed' && hasAdjustment)
                || (filter === 'teacher' && (source === 'teacher' || isTeacherRequired || isTeacherExcluded))
                || (filter === 'custom' && source === 'custom');

            return {
                exercise,
                helperText,
                isExcluded,
                isRequired,
                isRest,
                isTeacherExcluded,
                isTeacherRequired,
                isUserExcluded,
                isUserRequired,
                matchesFilter,
                matchesQuery,
                placementLabel: getExercisePlacementLabel(exercise.placement),
                source,
                sourceLabel,
                teacherBadge,
                userBadge,
            };
        });
}

export function summarizeMenuExerciseItems(items: MenuExerciseItem[]) {
    const configurableItems = items.filter((item) => !item.isRest);

    return {
        changedCount: configurableItems.filter(
            (item) => item.isTeacherRequired || item.isTeacherExcluded || item.isUserRequired || item.isUserExcluded,
        ).length,
        excludedCount: configurableItems.filter((item) => item.isExcluded).length,
        requiredCount: configurableItems.filter((item) => item.isRequired).length,
        visibleItems: items.filter((item) => item.matchesQuery && item.matchesFilter),
    };
}

export function cycleMenuExerciseSelection({
    excludedExercises,
    item,
    requiredExercises,
}: CycleMenuExerciseSelectionParams) {
    if (item.isRest) {
        return { excludedExercises, requiredExercises };
    }

    if (item.isUserRequired) {
        return {
            excludedExercises,
            requiredExercises: requiredExercises.filter((id) => id !== item.exercise.id),
        };
    }

    if (item.isUserExcluded) {
        return {
            excludedExercises: excludedExercises.filter((id) => id !== item.exercise.id),
            requiredExercises: [...requiredExercises, item.exercise.id],
        };
    }

    if (item.isTeacherRequired) {
        return {
            excludedExercises: [...excludedExercises, item.exercise.id],
            requiredExercises,
        };
    }

    if (item.isTeacherExcluded) {
        return {
            excludedExercises,
            requiredExercises: [...requiredExercises, item.exercise.id],
        };
    }

    return {
        excludedExercises: [...excludedExercises, item.exercise.id],
        requiredExercises,
    };
}
