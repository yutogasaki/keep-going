import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EXERCISES, getExerciseById, getExercisesByClass } from '../exercises';

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('exercise catalog', () => {
    it('returns beginner-compatible exercises for 初級', () => {
        const result = getExercisesByClass('初級');
        expect(result.length).toBeGreaterThan(0);
        result.forEach((exercise) => {
            expect(exercise.classes).toContain('初級');
        });
    });

    it('does not include upper-only exercises in 初級', () => {
        const upperOnly = EXERCISES.filter((exercise) => exercise.classes.includes('上級') && !exercise.classes.includes('初級'));
        const resultIds = new Set(getExercisesByClass('初級').map((exercise) => exercise.id));

        upperOnly.forEach((exercise) => {
            expect(resultIds.has(exercise.id)).toBe(false);
        });
    });

    it('treats その他 the same as 初級', () => {
        const other = getExercisesByClass('その他');
        const beginner = getExercisesByClass('初級');

        expect(other.map((exercise) => exercise.id).sort()).toEqual(beginner.map((exercise) => exercise.id).sort());
    });

    it('keeps yurikago and donguri in stretch placement', () => {
        const placementById = new Map(getExercisesByClass('初級').map((exercise) => [exercise.id, exercise.placement]));

        expect(placementById.get('S06')).toBe('stretch');
        expect(placementById.get('S08')).toBe('stretch');
    });

    it('includes deep breathing as an ending exercise', () => {
        const deepBreathing = getExercisesByClass('初級').find((exercise) => exercise.id === 'S09');

        expect(deepBreathing).toBeDefined();
        expect(deepBreathing?.placement).toBe('ending');
        expect(deepBreathing?.sec).toBe(30);
    });

    it('returns the matching exercise by id', () => {
        const result = getExerciseById('S01');

        expect(result).toBeDefined();
        expect(result?.name).toBe('開脚');
    });

    it('returns undefined for unknown exercise ids', () => {
        expect(getExerciseById('nonexistent')).toBeUndefined();
    });
});
