import { describe, expect, it } from 'vitest';
import { buildDefaultStatusByClass, buildMenuEditorExercises, deriveVisibleClassLevels } from './teacherEditorHelpers';

describe('teacherEditorHelpers', () => {
    it('creates optional defaults for all class levels', () => {
        const statuses = buildDefaultStatusByClass();

        expect(statuses['プレ']).toBe('optional');
        expect(statuses['上級']).toBe('optional');
    });

    it('derives visible class levels by excluding hidden statuses', () => {
        expect(deriveVisibleClassLevels({
            'プレ': 'optional',
            '初級': 'required',
            '中級': 'hidden',
            '上級': 'excluded',
        })).toEqual(['プレ', '初級', '上級']);
    });

    it('merges built-in and teacher exercises for menu editing', () => {
        const exercises = buildMenuEditorExercises([
            {
                id: 'teacher-1',
                name: '先生の種目',
                sec: 45,
                emoji: '🧘',
                placement: 'prep',
                hasSplit: false,
                description: '',
                classLevels: ['初級'],
                createdBy: 'teacher@example.com',
                createdAt: '2026-03-08T00:00:00.000Z',
            },
        ]);

        expect(exercises.some((exercise) => exercise.id === 'S01')).toBe(true);
        expect(exercises.find((exercise) => exercise.id === 'teacher-1')).toMatchObject({ isTeacher: true, sec: 45 });
    });
});
