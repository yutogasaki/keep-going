import { describe, expect, it } from 'vitest';
import type { MenuGroup } from '../../data/menuGroups';
import type { TeacherMenu } from '../teacherContent';
import {
    menuGroupReferencesExercise,
    pruneUnavailableExercisesFromMenuGroup,
    removeExerciseFromMenuGroup,
    removeExerciseFromTeacherMenu,
    teacherMenuReferencesExercise,
} from '../menuExerciseCleanup';

function createMenuGroup(overrides: Partial<MenuGroup> = {}): MenuGroup {
    return {
        id: overrides.id ?? 'menu-1',
        name: overrides.name ?? 'テストメニュー',
        emoji: overrides.emoji ?? '🌸',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds ?? ['S01'],
        items: overrides.items,
        isPreset: overrides.isPreset ?? false,
        creatorId: overrides.creatorId,
    };
}

function createTeacherMenu(overrides: Partial<TeacherMenu> = {}): TeacherMenu {
    return {
        id: overrides.id ?? 'teacher-menu-1',
        name: overrides.name ?? '先生メニュー',
        emoji: overrides.emoji ?? '🩰',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds ?? ['teacher-ex-1'],
        classLevels: overrides.classLevels ?? ['初級'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher@example.com',
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

describe('menuExerciseCleanup', () => {
    it('detects exercise references in custom menus', () => {
        const group = createMenuGroup({
            exerciseIds: ['S01', 'custom-1'],
        });

        expect(menuGroupReferencesExercise(group, 'custom-1')).toBe(true);
        expect(menuGroupReferencesExercise(group, 'missing')).toBe(false);
    });

    it('removes exercise refs from custom menus and keeps inline items', () => {
        const group = createMenuGroup({
            exerciseIds: ['custom-1', 'inline-1'],
            items: [
                { id: 'custom-1', kind: 'exercise_ref', exerciseId: 'custom-1' },
                {
                    id: 'inline-1',
                    kind: 'inline_only',
                    name: 'そのばジャンプ',
                    sec: 20,
                    emoji: '✨',
                    placement: 'stretch',
                    internal: 'single',
                },
            ],
        });

        expect(removeExerciseFromMenuGroup(group, 'custom-1')).toEqual({
            ...group,
            exerciseIds: ['inline-1'],
            items: [group.items![1]],
        });
    });

    it('returns null when removing the last item from a custom menu', () => {
        const group = createMenuGroup({
            exerciseIds: ['custom-1'],
        });

        expect(removeExerciseFromMenuGroup(group, 'custom-1')).toBeNull();
    });

    it('prunes unavailable exercise refs from custom menus', () => {
        const group = createMenuGroup({
            exerciseIds: ['S01', 'missing-1', 'inline-1', 'missing-2'],
            items: [
                { id: 'S01', kind: 'exercise_ref', exerciseId: 'S01' },
                { id: 'missing-1', kind: 'exercise_ref', exerciseId: 'missing-1' },
                {
                    id: 'inline-1',
                    kind: 'inline_only',
                    name: 'そのばジャンプ',
                    sec: 20,
                    emoji: '✨',
                    placement: 'stretch',
                    internal: 'single',
                },
                { id: 'missing-2', kind: 'exercise_ref', exerciseId: 'missing-2' },
            ],
        });

        const result = pruneUnavailableExercisesFromMenuGroup(group, new Set(['S01']));
        expect(result).not.toBeNull();
        expect(result!.exerciseIds).toEqual(['S01', 'inline-1']);
        expect(result!.items).toHaveLength(2);
        expect(result!.items![0]).toMatchObject({ kind: 'exercise_ref', exerciseId: 'S01' });
        expect(result!.items![1]).toMatchObject({
            kind: 'inline_only',
            name: 'そのばジャンプ',
            emoji: '✨',
        });
    });

    it('detects exercise references in teacher menus', () => {
        const menu = createTeacherMenu({
            exerciseIds: ['teacher-ex-1', 'S01'],
        });

        expect(teacherMenuReferencesExercise(menu, 'teacher-ex-1')).toBe(true);
        expect(teacherMenuReferencesExercise(menu, 'teacher-ex-2')).toBe(false);
    });

    it('removes exercise refs from teacher menus and deletes empty menus', () => {
        const menu = createTeacherMenu({
            exerciseIds: ['teacher-ex-1', 'S01'],
        });

        expect(removeExerciseFromTeacherMenu(menu, 'teacher-ex-1')).toEqual({
            ...menu,
            exerciseIds: ['S01'],
        });
        expect(removeExerciseFromTeacherMenu(createTeacherMenu(), 'teacher-ex-1')).toBeNull();
    });
});
