import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../../../data/exercises';
import type { CustomExercise } from '../../../../lib/db';
import {
    filterCustomExercisesByCategory,
    filterStandardExercisesByCategory,
    getAvailableIndividualCategories,
    shouldShowCustomExercises,
} from '../selectionCategories';

const standardExercises: Exercise[] = [
    {
        id: 'prep-1',
        name: 'じゅんび',
        sec: 30,
        placement: 'prep',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '🌱',
    },
    {
        id: 'stretch-1',
        name: 'のばす',
        sec: 30,
        placement: 'stretch',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '🦵',
    },
    {
        id: 'core-1',
        name: 'たいかん',
        sec: 30,
        placement: 'core',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '💪',
    },
];

const customExercises: CustomExercise[] = [
    {
        id: 'custom-1',
        name: 'じぶんバー',
        sec: 45,
        emoji: '✨',
        placement: 'barre',
    },
    {
        id: 'custom-2',
        name: 'じぶんおわり',
        sec: 30,
        emoji: '🌙',
        placement: 'ending',
    },
];

describe('selectionCategories', () => {
    it('returns only categories that have visible items', () => {
        expect(getAvailableIndividualCategories(standardExercises, customExercises)).toEqual([
            'all',
            'prep',
            'stretch',
            'core',
            'barre',
            'ending',
        ]);
        expect(getAvailableIndividualCategories([standardExercises[1]], [])).toEqual([
            'all',
            'stretch',
        ]);
    });

    it('filters standard exercises by category', () => {
        expect(filterStandardExercisesByCategory(standardExercises, 'all')).toHaveLength(3);
        expect(filterStandardExercisesByCategory(standardExercises, 'prep').map((exercise) => exercise.id)).toEqual(['prep-1']);
        expect(filterStandardExercisesByCategory(standardExercises, 'stretch').map((exercise) => exercise.id)).toEqual(['stretch-1']);
        expect(filterStandardExercisesByCategory(standardExercises, 'core').map((exercise) => exercise.id)).toEqual(['core-1']);
    });

    it('filters custom exercises by the same placement axis', () => {
        expect(filterCustomExercisesByCategory(customExercises, 'all')).toHaveLength(2);
        expect(filterCustomExercisesByCategory(customExercises, 'barre').map((exercise) => exercise.id)).toEqual(['custom-1']);
        expect(filterCustomExercisesByCategory(customExercises, 'ending').map((exercise) => exercise.id)).toEqual(['custom-2']);
    });

    it('shows custom section only when the current placement has custom items', () => {
        expect(shouldShowCustomExercises(customExercises, 'all')).toBe(true);
        expect(shouldShowCustomExercises(customExercises, 'barre')).toBe(true);
        expect(shouldShowCustomExercises(customExercises, 'stretch')).toBe(false);
        expect(shouldShowCustomExercises([], 'all')).toBe(false);
    });
});
