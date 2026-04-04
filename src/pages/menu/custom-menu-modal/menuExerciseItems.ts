import { EXERCISES, type Exercise } from '../../../data/exercises';
import {
    getExercisePlacementLabel,
    getExercisePlacementOrder,
} from '../../../data/exercisePlacement';
import type { ClassLevel } from '../../../data/exercises';
import type { CustomExercise } from '../../../lib/db';
import {
    buildEffectiveExerciseSettings,
    getUserExerciseMenuStatus,
    type EffectiveExerciseMenuSetting,
} from '../../../lib/menuExerciseSettings';
import type { TeacherExercise } from '../../../lib/teacherContent';
import type { TeacherMenuSetting } from '../../../lib/teacherMenuSettings';

export type FilterId = 'all' | 'changed' | 'teacher' | 'custom';
export type MenuExercise = Exercise | TeacherExercise | CustomExercise;
type ExerciseSource = 'builtIn' | 'teacher' | 'custom';

export interface MenuExerciseItem {
    exercise: MenuExercise;
    helperText: string | null;
    isExcluded: boolean;
    isRequired: boolean;
    isRest: boolean;
    isClassDefaultRequired: boolean;
    inheritedStatus: EffectiveExerciseMenuSetting['inheritedStatus'];
    isTeacherExcluded: boolean;
    isTeacherOptional: boolean;
    isTeacherRequired: boolean;
    isUserExcluded: boolean;
    isUserOptional: boolean;
    isUserRequired: boolean;
    matchesFilter: boolean;
    matchesQuery: boolean;
    placementLabel: string;
    source: ExerciseSource;
    sourceLabel: string | null;
    classBadge: string | null;
    teacherBadge: string | null;
    userBadge: string | null;
}

interface BuildMenuExerciseItemsParams {
    classLevel: ClassLevel;
    customExercises: CustomExercise[];
    excludedExercises: string[];
    filter: FilterId;
    query: string;
    requiredExercises: string[];
    teacherExercises?: TeacherExercise[];
    teacherSettings?: TeacherMenuSetting[];
    teacherExcludedExerciseIds?: Set<string>;
    teacherHiddenExerciseIds?: Set<string>;
    teacherRequiredExerciseIds?: Set<string>;
}

interface CycleMenuExerciseSelectionParams {
    excludedExercises: string[];
    item: Pick<
        MenuExerciseItem,
        | 'exercise'
        | 'inheritedStatus'
        | 'isRest'
        | 'isTeacherExcluded'
        | 'isTeacherOptional'
        | 'isTeacherRequired'
        | 'isUserExcluded'
        | 'isUserOptional'
        | 'isUserRequired'
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
    classLevel,
    customExercises,
    excludedExercises,
    filter,
    query,
    requiredExercises,
    teacherExercises,
    teacherSettings,
    teacherExcludedExerciseIds,
    teacherHiddenExerciseIds,
    teacherRequiredExerciseIds,
}: BuildMenuExerciseItemsParams): MenuExerciseItem[] {
    const normalizedQuery = query.trim().toLowerCase();
    const allExercises = [...EXERCISES, ...(teacherExercises ?? []), ...customExercises]
        .filter((exercise) => !teacherHiddenExerciseIds?.has(exercise.id))
        .sort((a, b) => {
            const placementDiff = getExercisePlacementOrder(a.placement) - getExercisePlacementOrder(b.placement);
            if (placementDiff !== 0) {
                return placementDiff;
            }

            return a.name.localeCompare(b.name, 'ja');
        });
    const effectiveSettings = new Map(
        buildEffectiveExerciseSettings({
            classLevel,
            exerciseIds: allExercises.map((exercise) => exercise.id),
            teacherSettings: teacherSettings ?? [],
            userRequiredExerciseIds: requiredExercises,
            userExcludedExerciseIds: excludedExercises,
        }).map((setting) => [setting.itemId, setting]),
    );

    return allExercises
        .map((exercise) => {
            const isRest = exercise.placement === 'rest';
            const effectiveSetting = effectiveSettings.get(exercise.id);
            const isTeacherRequired = effectiveSetting?.teacherStatus === 'required'
                || (teacherRequiredExerciseIds?.has(exercise.id) ?? false);
            const isTeacherExcluded = effectiveSetting?.teacherStatus === 'excluded'
                || (teacherExcludedExerciseIds?.has(exercise.id) ?? false);
            const isTeacherOptional = effectiveSetting?.teacherStatus === 'optional';
            const userStatus = getUserExerciseMenuStatus(exercise.id, requiredExercises, excludedExercises);
            const isUserRequired = userStatus === 'required';
            const isUserExcluded = userStatus === 'excluded';
            const isUserOptional = userStatus === 'optional';
            const isRequired = effectiveSetting?.effectiveStatus === 'required';
            const isExcluded = effectiveSetting?.effectiveStatus === 'excluded';
            const isClassDefaultRequired = effectiveSetting?.defaultStatus === 'required';
            const inheritedStatus = effectiveSetting?.inheritedStatus ?? 'optional';
            const classBadge = isClassDefaultRequired ? 'クラス: 必須' : null;
            const teacherBadge = isTeacherRequired
                ? '先生: 必須'
                : isTeacherExcluded
                    ? '先生: 除外'
                    : isTeacherOptional
                        ? '先生: おまかせ'
                        : null;
            const userBadge = isUserRequired
                ? 'じぶん: 必須'
                : isUserExcluded
                    ? 'じぶん: 除外'
                    : isUserOptional
                        ? 'じぶん: おまかせ'
                        : null;
            const source = getExerciseSource(exercise);
            const sourceLabel = getSourceLabel(source);
            const hasAdjustment = Boolean(
                effectiveSetting
                && (effectiveSetting.defaultStatus != null || effectiveSetting.teacherStatus != null || effectiveSetting.userStatus != null),
            );
            const helperText = userBadge ?? teacherBadge ?? classBadge ?? (isRest ? 'きゅうけい種目' : null);

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
                || (filter === 'teacher' && (source === 'teacher' || isTeacherRequired || isTeacherExcluded || isTeacherOptional))
                || (filter === 'custom' && source === 'custom');

            return {
                exercise,
                helperText,
                isExcluded,
                isRequired,
                isRest,
                isClassDefaultRequired,
                inheritedStatus,
                isTeacherExcluded,
                isTeacherOptional,
                isTeacherRequired,
                isUserExcluded,
                isUserOptional,
                isUserRequired,
                matchesFilter,
                matchesQuery,
                placementLabel: getExercisePlacementLabel(exercise.placement),
                source,
                sourceLabel,
                classBadge,
                teacherBadge,
                userBadge,
            };
        });
}

export function summarizeMenuExerciseItems(items: MenuExerciseItem[]) {
    const configurableItems = items.filter((item) => !item.isRest);

    return {
        changedCount: configurableItems.filter(
            (item) => item.isClassDefaultRequired
                || item.isTeacherRequired
                || item.isTeacherExcluded
                || item.isTeacherOptional
                || item.isUserRequired
                || item.isUserExcluded
                || item.isUserOptional,
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

    const currentStatus = item.isUserOptional
        ? 'optional'
        : item.isUserRequired || item.inheritedStatus === 'required'
            ? 'required'
            : item.isUserExcluded || item.inheritedStatus === 'excluded'
                ? 'excluded'
                : 'optional';
    const nextStatus = currentStatus === 'optional'
        ? 'excluded'
        : currentStatus === 'excluded'
            ? 'required'
            : 'optional';
    const nextExcluded = excludedExercises.filter((id) => id !== item.exercise.id);
    const nextRequired = requiredExercises.filter((id) => id !== item.exercise.id);

    if (nextStatus === item.inheritedStatus) {
        return {
            excludedExercises: nextExcluded,
            requiredExercises: nextRequired,
        };
    }

    if (nextStatus === 'required') {
        return {
            excludedExercises: nextExcluded,
            requiredExercises: [...nextRequired, item.exercise.id],
        };
    }

    if (nextStatus === 'excluded') {
        return {
            excludedExercises: [...nextExcluded, item.exercise.id],
            requiredExercises: nextRequired,
        };
    }

    return {
        excludedExercises: [...nextExcluded, item.exercise.id],
        requiredExercises: [...nextRequired, item.exercise.id],
    };
}
