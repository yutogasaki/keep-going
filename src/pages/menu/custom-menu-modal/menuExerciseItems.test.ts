import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../../data/exercises';
import type { CustomExercise } from '../../../lib/db';
import type { TeacherExercise } from '../../../lib/teacherContent';
import {
    buildMenuExerciseItems,
    cycleMenuExerciseSelection,
    summarizeMenuExerciseItems,
} from './menuExerciseItems';

function createTeacherExercise(overrides: Partial<TeacherExercise> & Pick<TeacherExercise, 'id' | 'name'>): TeacherExercise {
    return {
        id: overrides.id,
        name: overrides.name,
        sec: overrides.sec ?? 45,
        emoji: overrides.emoji ?? '🧘',
        placement: overrides.placement ?? 'prep',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description ?? '',
        classLevels: overrides.classLevels ?? ['初級'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher-1',
        createdAt: overrides.createdAt ?? '2026-03-08T00:00:00.000Z',
    };
}

function createCustomExercise(overrides: Partial<CustomExercise> & Pick<CustomExercise, 'id' | 'name'>): CustomExercise {
    return {
        id: overrides.id,
        name: overrides.name,
        sec: overrides.sec ?? 30,
        emoji: overrides.emoji ?? '✨',
        placement: overrides.placement ?? 'ending',
        hasSplit: overrides.hasSplit,
        description: overrides.description ?? '',
        creatorId: overrides.creatorId ?? 'user-1',
    };
}

describe('menuExerciseItems', () => {
    it('builds filtered exercise items with teacher and custom labels', () => {
        const teacherExercise = createTeacherExercise({ id: 'teacher-1', name: '先生の種目' });
        const customExercise = createCustomExercise({ id: 'custom-1', name: 'じぶん種目' });

        const items = buildMenuExerciseItems({
            customExercises: [customExercise],
            excludedExercises: [],
            filter: 'teacher',
            query: '先生',
            requiredExercises: [],
            teacherExercises: [teacherExercise],
            teacherRequiredExerciseIds: new Set(['teacher-1']),
        });

        const summary = summarizeMenuExerciseItems(items);

        expect(summary.visibleItems).toHaveLength(1);
        expect(summary.visibleItems[0]).toMatchObject({
            source: 'teacher',
            sourceLabel: '先生',
            teacherBadge: '先生: 必須',
            isRequired: true,
        });
        expect(summary.requiredCount).toBeGreaterThanOrEqual(1);
    });

    it('ignores hidden teacher items and excludes rest items from counts', () => {
        const restExercise = EXERCISES.find((exercise) => exercise.placement === 'rest');
        if (!restExercise) {
            throw new Error('expected a rest exercise fixture');
        }

        const items = buildMenuExerciseItems({
            customExercises: [],
            excludedExercises: [restExercise.id],
            filter: 'changed',
            query: '',
            requiredExercises: [],
            teacherExercises: [createTeacherExercise({ id: 'teacher-hidden', name: '非表示の先生種目' })],
            teacherHiddenExerciseIds: new Set(['teacher-hidden']),
        });

        const summary = summarizeMenuExerciseItems(items);

        expect(summary.visibleItems.some((item) => item.exercise.id === 'teacher-hidden')).toBe(false);
        expect(summary.excludedCount).toBe(0);
    });

    it('cycles user and teacher overrides in the same order as the modal', () => {
        const baseItem = buildMenuExerciseItems({
            customExercises: [],
            excludedExercises: [],
            filter: 'all',
            query: '',
            requiredExercises: [],
        }).find((item) => !item.isRest);

        if (!baseItem) {
            throw new Error('expected a non-rest exercise fixture');
        }

        const fromTeacherRequired = cycleMenuExerciseSelection({
            excludedExercises: [],
            item: {
                ...baseItem,
                isTeacherRequired: true,
            },
            requiredExercises: [],
        });

        expect(fromTeacherRequired).toEqual({
            excludedExercises: [baseItem.exercise.id],
            requiredExercises: [],
        });

        const fromUserExcluded = cycleMenuExerciseSelection({
            excludedExercises: [baseItem.exercise.id],
            item: {
                ...baseItem,
                isUserExcluded: true,
            },
            requiredExercises: [],
        });

        expect(fromUserExcluded).toEqual({
            excludedExercises: [],
            requiredExercises: [baseItem.exercise.id],
        });
    });
});
