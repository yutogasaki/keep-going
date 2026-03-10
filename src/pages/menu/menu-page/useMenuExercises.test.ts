import { describe, expect, it } from 'vitest';
import type { Exercise } from '../../../data/exercises';
import type { MenuGroup } from '../../../data/menuGroups';
import { orderMenuExercisesForDisplay, orderMenuGroupsForDisplay } from './useMenuExercises';

function createExercise(
    id: string,
    placement: Exercise['placement'],
    overrides: Partial<Exercise> = {},
): Exercise {
    return {
        id,
        name: overrides.name ?? id,
        sec: overrides.sec ?? 30,
        placement,
        internal: overrides.internal ?? 'single',
        classes: overrides.classes ?? ['初級'],
        priority: overrides.priority ?? 'medium',
        emoji: overrides.emoji ?? '🌸',
        origin: overrides.origin,
        visibility: overrides.visibility,
        focusTags: overrides.focusTags,
        recommended: overrides.recommended,
        recommendedOrder: overrides.recommendedOrder,
        displayMode: overrides.displayMode,
        hasSplit: overrides.hasSplit,
        description: overrides.description,
        reading: overrides.reading,
    };
}

function createGroup(id: string, overrides: Partial<MenuGroup> = {}): MenuGroup {
    return {
        id,
        name: overrides.name ?? id,
        emoji: overrides.emoji ?? '📋',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds ?? ['S01'],
        isPreset: overrides.isPreset ?? true,
        origin: overrides.origin,
        visibility: overrides.visibility,
        focusTags: overrides.focusTags,
        recommended: overrides.recommended,
        recommendedOrder: overrides.recommendedOrder,
        displayMode: overrides.displayMode,
        creatorId: overrides.creatorId,
    };
}

describe('useMenuExercises ordering helpers', () => {
    it('keeps inline teacher exercises at the bottom of their placement and teacher-section items after standard items', () => {
        const builtInExercises = [
            createExercise('prep-1', 'prep'),
            createExercise('stretch-1', 'stretch'),
            createExercise('stretch-2', 'stretch'),
            createExercise('core-1', 'core'),
        ];
        const restExercises = [createExercise('rest-1', 'rest')];
        const teacherExercises = [
            createExercise('teacher-stretch-plain', 'stretch', {
                origin: 'teacher',
                displayMode: 'standard_inline',
                recommended: false,
            }),
            createExercise('teacher-stretch-recommended', 'stretch', {
                origin: 'teacher',
                displayMode: 'standard_inline',
                recommended: true,
                recommendedOrder: 1,
            }),
            createExercise('teacher-core-inline', 'core', {
                origin: 'teacher',
                displayMode: 'standard_inline',
            }),
            createExercise('teacher-section', 'stretch', {
                origin: 'teacher',
                displayMode: 'teacher_section',
                recommended: true,
                recommendedOrder: 1,
            }),
        ];

        const ordered = orderMenuExercisesForDisplay(builtInExercises, restExercises, teacherExercises);

        expect(ordered.map((exercise) => exercise.id)).toEqual([
            'prep-1',
            'stretch-1',
            'stretch-2',
            'teacher-stretch-recommended',
            'teacher-stretch-plain',
            'core-1',
            'teacher-core-inline',
            'rest-1',
            'teacher-section',
        ]);
    });

    it('appends inline teacher menus after presets and keeps teacher-section menus grouped after them', () => {
        const presets = [
            createGroup('preset-1'),
            createGroup('preset-2'),
        ];
        const teacherGroups = [
            createGroup('teacher-inline-plain', {
                origin: 'teacher',
                displayMode: 'standard_inline',
            }),
            createGroup('teacher-inline-recommended', {
                origin: 'teacher',
                displayMode: 'standard_inline',
                recommended: true,
                recommendedOrder: 1,
            }),
            createGroup('teacher-section-plain', {
                origin: 'teacher',
                displayMode: 'teacher_section',
            }),
            createGroup('teacher-section-recommended', {
                origin: 'teacher',
                displayMode: 'teacher_section',
                recommended: true,
                recommendedOrder: 2,
            }),
        ];

        const ordered = orderMenuGroupsForDisplay(presets, teacherGroups);

        expect(ordered.map((group) => group.id)).toEqual([
            'preset-1',
            'preset-2',
            'teacher-inline-recommended',
            'teacher-inline-plain',
            'teacher-section-recommended',
            'teacher-section-plain',
        ]);
    });
});
