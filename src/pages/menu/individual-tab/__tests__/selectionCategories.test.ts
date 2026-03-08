import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../../../data/exercises';
import type { CustomExercise } from '../../../../lib/db';
import {
    filterStandardExercisesByCategory,
    getAvailableIndividualCategories,
    shouldShowCustomExercises,
} from '../selectionCategories';

const standardExercises: Exercise[] = [
    {
        id: 'warmup-1',
        name: 'じゅんび',
        sec: 30,
        type: 'stretch',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '🌱',
        phase: 'warmup',
    },
    {
        id: 'main-1',
        name: 'のばす',
        sec: 30,
        type: 'stretch',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '🦵',
        phase: 'main',
    },
    {
        id: 'core-1',
        name: 'たいかん',
        sec: 30,
        type: 'core',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '💪',
        phase: 'core',
    },
];

const customExercises: CustomExercise[] = [
    {
        id: 'custom-1',
        name: 'じぶん',
        sec: 45,
        emoji: '✨',
    },
];

describe('selectionCategories', () => {
    it('returns only categories that have visible items', () => {
        expect(getAvailableIndividualCategories(standardExercises, customExercises)).toEqual([
            'all',
            'warmup',
            'main',
            'core',
            'custom',
        ]);
        expect(getAvailableIndividualCategories([standardExercises[1]], [])).toEqual([
            'all',
            'main',
        ]);
    });

    it('filters standard exercises by category', () => {
        expect(filterStandardExercisesByCategory(standardExercises, 'all')).toHaveLength(3);
        expect(filterStandardExercisesByCategory(standardExercises, 'warmup').map((exercise) => exercise.id)).toEqual(['warmup-1']);
        expect(filterStandardExercisesByCategory(standardExercises, 'main').map((exercise) => exercise.id)).toEqual(['main-1']);
        expect(filterStandardExercisesByCategory(standardExercises, 'core').map((exercise) => exercise.id)).toEqual(['core-1']);
        expect(filterStandardExercisesByCategory(standardExercises, 'custom')).toEqual([]);
    });

    it('shows custom section only for all/custom categories', () => {
        expect(shouldShowCustomExercises(customExercises, 'all')).toBe(true);
        expect(shouldShowCustomExercises(customExercises, 'custom')).toBe(true);
        expect(shouldShowCustomExercises(customExercises, 'main')).toBe(false);
        expect(shouldShowCustomExercises([], 'all')).toBe(false);
    });
});
