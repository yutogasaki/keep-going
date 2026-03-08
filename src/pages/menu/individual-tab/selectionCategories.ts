import type { Exercise } from '../../../data/exercises';
import {
    EXERCISE_PLACEMENTS,
    getExercisePlacementLabel,
    isRestPlacement,
    type ExercisePlacement,
} from '../../../data/exercisePlacement';
import type { CustomExercise } from '../../../lib/db';

export type IndividualCategoryId = 'all' | ExercisePlacement;

export interface IndividualCategoryOption {
    id: IndividualCategoryId;
    label: string;
}

export const INDIVIDUAL_CATEGORY_OPTIONS: IndividualCategoryOption[] = [
    { id: 'all', label: 'ぜんぶ' },
    ...EXERCISE_PLACEMENTS.map((placement) => ({
        id: placement,
        label: getExercisePlacementLabel(placement),
    })),
];

export function getAvailableIndividualCategories(
    exercises: Exercise[],
    customExercises: CustomExercise[],
): IndividualCategoryId[] {
    const available = new Set<IndividualCategoryId>(['all']);

    for (const placement of EXERCISE_PLACEMENTS) {
        const hasStandard = exercises.some((exercise) => exercise.placement === placement);
        const hasCustom = customExercises.some((exercise) => exercise.placement === placement);
        if (hasStandard || hasCustom) {
            available.add(placement);
        }
    }

    return INDIVIDUAL_CATEGORY_OPTIONS
        .map((option) => option.id)
        .filter((id) => available.has(id));
}

export function filterStandardExercisesByCategory(
    exercises: Exercise[],
    category: IndividualCategoryId,
): Exercise[] {
    if (category === 'all') {
        return exercises;
    }

    return exercises.filter((exercise) => exercise.placement === category);
}

export function filterCustomExercisesByCategory(
    customExercises: CustomExercise[],
    category: IndividualCategoryId,
): CustomExercise[] {
    if (category === 'all') {
        return customExercises;
    }

    return customExercises.filter((exercise) => exercise.placement === category);
}

export function shouldShowCustomExercises(
    customExercises: CustomExercise[],
    category: IndividualCategoryId,
): boolean {
    return filterCustomExercisesByCategory(customExercises, category).length > 0;
}

export function isLockedPlacement(category: IndividualCategoryId): boolean {
    return category !== 'all' && isRestPlacement(category);
}
