import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../data/exercises';
import { filterRestExercisesByOrigin } from './MenuIndividualTab';

function createRestExercise(id: string, origin?: Exercise['origin']): Exercise {
    return {
        id,
        name: id,
        sec: 10,
        placement: 'rest',
        internal: 'single',
        classes: ['初級'],
        priority: 'medium',
        emoji: '💤',
        origin,
    };
}

describe('MenuIndividualTab helpers', () => {
    it('does not show built-in rest options while the teacher origin filter is active', () => {
        const restExercises = [
            createRestExercise('builtin-rest', 'builtin'),
            createRestExercise('teacher-rest', 'teacher'),
        ];

        expect(filterRestExercisesByOrigin(restExercises, 'all').map((exercise) => exercise.id)).toEqual([
            'builtin-rest',
            'teacher-rest',
        ]);
        expect(filterRestExercisesByOrigin(restExercises, 'teacher').map((exercise) => exercise.id)).toEqual([
            'teacher-rest',
        ]);
        expect(filterRestExercisesByOrigin(restExercises, 'custom')).toEqual([]);
    });
});
