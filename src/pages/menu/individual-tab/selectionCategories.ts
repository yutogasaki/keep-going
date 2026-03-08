import type { Exercise } from '../../../data/exercises';
import type { CustomExercise } from '../../../lib/db';

export type IndividualCategoryId = 'all' | 'warmup' | 'main' | 'core' | 'custom';

export interface IndividualCategoryOption {
    id: IndividualCategoryId;
    label: string;
}

export const INDIVIDUAL_CATEGORY_OPTIONS: IndividualCategoryOption[] = [
    { id: 'all', label: 'ぜんぶ' },
    { id: 'warmup', label: 'じゅんび' },
    { id: 'main', label: 'のばす' },
    { id: 'core', label: 'たいかん' },
    { id: 'custom', label: 'じぶん' },
];

export function getAvailableIndividualCategories(
    exercises: Exercise[],
    customExercises: CustomExercise[],
): IndividualCategoryId[] {
    const available = new Set<IndividualCategoryId>(['all']);

    if (exercises.some((exercise) => exercise.phase === 'warmup')) {
        available.add('warmup');
    }
    if (exercises.some((exercise) => exercise.phase === 'main')) {
        available.add('main');
    }
    if (exercises.some((exercise) => exercise.phase === 'core')) {
        available.add('core');
    }
    if (customExercises.length > 0) {
        available.add('custom');
    }

    return INDIVIDUAL_CATEGORY_OPTIONS
        .map((option) => option.id)
        .filter((id) => available.has(id));
}

export function filterStandardExercisesByCategory(
    exercises: Exercise[],
    category: IndividualCategoryId,
): Exercise[] {
    if (category === 'all' || category === 'custom') {
        return category === 'custom' ? [] : exercises;
    }

    return exercises.filter((exercise) => exercise.phase === category);
}

export function shouldShowCustomExercises(
    customExercises: CustomExercise[],
    category: IndividualCategoryId,
): boolean {
    if (customExercises.length === 0) return false;
    return category === 'all' || category === 'custom';
}
