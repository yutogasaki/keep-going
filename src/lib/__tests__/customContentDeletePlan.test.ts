import { describe, expect, it } from 'vitest';
import type { MenuGroup } from '../../data/menuGroups';
import type { CustomExercise } from '../db';
import {
    buildCustomExerciseDeletePlan,
    buildCustomGroupDeletePlan,
    findPublishedExerciseMatch,
    findPublishedMenuMatch,
} from '../customContentDeletePlan';
import type { PublicMenu } from '../publicMenus';
import type { PublicExercise } from '../publicExercises';

function createCustomExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return {
        id: overrides.id ?? 'custom-ex-1',
        name: overrides.name ?? 'ラッキーな休憩',
        sec: overrides.sec ?? 30,
        emoji: overrides.emoji ?? '🍀',
        placement: overrides.placement ?? 'rest',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description,
        creatorId: overrides.creatorId,
    };
}

function createMenuGroup(overrides: Partial<MenuGroup> = {}): MenuGroup {
    return {
        id: overrides.id ?? 'menu-1',
        name: overrides.name ?? 'テストメニュー',
        emoji: overrides.emoji ?? '🌸',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds ?? ['custom-ex-1'],
        items: overrides.items,
        isPreset: overrides.isPreset ?? false,
        creatorId: overrides.creatorId,
    };
}

function createPublicMenu(overrides: Partial<PublicMenu> = {}): PublicMenu {
    const baseGroup = createMenuGroup(overrides);
    return {
        id: overrides.id ?? 'public-menu-1',
        name: overrides.name ?? baseGroup.name,
        emoji: overrides.emoji ?? baseGroup.emoji,
        description: overrides.description ?? baseGroup.description,
        exerciseIds: overrides.exerciseIds ?? baseGroup.exerciseIds,
        items: overrides.items ?? baseGroup.items ?? [],
        customExerciseData: overrides.customExerciseData ?? [],
        authorName: overrides.authorName ?? 'author',
        accountId: overrides.accountId ?? 'account-1',
        downloadCount: overrides.downloadCount ?? 0,
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

function createPublicExercise(overrides: Partial<PublicExercise> = {}): PublicExercise {
    const baseExercise = createCustomExercise(overrides);
    return {
        id: overrides.id ?? 'public-ex-1',
        name: overrides.name ?? baseExercise.name,
        sec: overrides.sec ?? baseExercise.sec,
        emoji: overrides.emoji ?? baseExercise.emoji,
        placement: overrides.placement ?? baseExercise.placement,
        hasSplit: overrides.hasSplit ?? baseExercise.hasSplit ?? false,
        description: overrides.description ?? baseExercise.description ?? null,
        authorName: overrides.authorName ?? 'author',
        accountId: overrides.accountId ?? 'account-1',
        downloadCount: overrides.downloadCount ?? 0,
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

describe('customContentDeletePlan', () => {
    it('matches published menus by menu identity instead of local id', () => {
        const group = createMenuGroup({ id: 'local-menu-1' });
        const publishedMenu = createPublicMenu({
            id: 'public-menu-1',
            name: group.name,
            emoji: group.emoji,
            exerciseIds: group.exerciseIds,
        });

        expect(findPublishedMenuMatch(group, [publishedMenu])?.id).toBe('public-menu-1');
    });

    it('matches published exercises by exercise definition instead of local id', () => {
        const exercise = createCustomExercise({ id: 'local-ex-1' });
        const publishedExercise = createPublicExercise({
            id: 'public-ex-1',
            name: exercise.name,
            sec: exercise.sec,
            emoji: exercise.emoji,
            placement: exercise.placement,
        });

        expect(findPublishedExerciseMatch(exercise, [publishedExercise])?.id).toBe('public-ex-1');
    });

    it('builds a delete plan for a published custom menu', () => {
        const group = createMenuGroup();
        const publishedMenu = createPublicMenu({
            id: 'public-menu-1',
            name: group.name,
            emoji: group.emoji,
            exerciseIds: group.exerciseIds,
        });

        expect(buildCustomGroupDeletePlan(group, [publishedMenu])).toEqual({
            isPublished: true,
            publishedMenuId: 'public-menu-1',
        });
    });

    it('builds a delete plan for a published exercise and impacted published menus', () => {
        const exercise = createCustomExercise({ id: 'custom-ex-1' });
        const updatedGroup = createMenuGroup({
            id: 'menu-1',
            name: 'のこるメニュー',
            exerciseIds: ['custom-ex-1', 'S01'],
        });
        const removedGroup = createMenuGroup({
            id: 'menu-2',
            name: 'きえるメニュー',
            exerciseIds: ['custom-ex-1'],
        });
        const untouchedGroup = createMenuGroup({
            id: 'menu-3',
            name: 'そのままメニュー',
            exerciseIds: ['S01'],
        });

        const publishedMenus = [
            createPublicMenu({
                id: 'public-menu-1',
                name: updatedGroup.name,
                emoji: updatedGroup.emoji,
                exerciseIds: updatedGroup.exerciseIds,
            }),
            createPublicMenu({
                id: 'public-menu-2',
                name: removedGroup.name,
                emoji: removedGroup.emoji,
                exerciseIds: removedGroup.exerciseIds,
            }),
        ];
        const publishedExercises = [createPublicExercise({ id: 'public-ex-1' })];

        expect(
            buildCustomExerciseDeletePlan(
                exercise,
                [updatedGroup, removedGroup, untouchedGroup],
                publishedMenus,
                publishedExercises,
            ),
        ).toEqual({
            isPublished: true,
            publishedExerciseId: 'public-ex-1',
            publishedMenuIds: ['public-menu-1', 'public-menu-2'],
            publishedMenuNames: ['のこるメニュー', 'きえるメニュー'],
            updatedMenuNames: ['のこるメニュー'],
            removedMenuNames: ['きえるメニュー'],
        });
    });
});
