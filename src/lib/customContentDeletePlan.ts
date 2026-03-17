import type { MenuGroup } from '../data/menuGroups';
import { type CustomExercise } from './db';
import { preserveDeletedCustomExerciseInMenuGroup } from './menuExerciseCleanup';
import type { PublicMenu } from './publicMenuTypes';
import type { PublicExercise } from './publicExercises';
import { findPublishedExerciseMatch, findPublishedMenuMatch } from './publicContentMatches';

export interface CustomGroupDeletePlan {
    isPublished: boolean;
    publishedMenuId: string | null;
}

export interface CustomExerciseDeletePlan {
    isPublished: boolean;
    publishedExerciseId: string | null;
    publishedMenuIds: string[];
    publishedMenuNames: string[];
    preservedMenuNames: string[];
}

export { findPublishedExerciseMatch, findPublishedMenuMatch };

export function buildCustomGroupDeletePlan(
    group: MenuGroup | null,
    publishedMenus: PublicMenu[],
): CustomGroupDeletePlan {
    if (!group) {
        return {
            isPublished: false,
            publishedMenuId: null,
        };
    }

    const publishedMenu = findPublishedMenuMatch(group, publishedMenus);
    return {
        isPublished: Boolean(publishedMenu),
        publishedMenuId: publishedMenu?.id ?? null,
    };
}

export function buildCustomExerciseDeletePlan(
    exercise: CustomExercise | null,
    customGroups: MenuGroup[],
    publishedMenus: PublicMenu[],
    publishedExercises: PublicExercise[],
): CustomExerciseDeletePlan {
    if (!exercise) {
        return {
            isPublished: false,
            publishedExerciseId: null,
            publishedMenuIds: [],
            publishedMenuNames: [],
            preservedMenuNames: [],
        };
    }

    const publishedExercise = findPublishedExerciseMatch(exercise, publishedExercises);
    const publishedMenuIds = new Set<string>();
    const publishedMenuNames = new Set<string>();
    const preservedMenuNames: string[] = [];

    for (const group of customGroups) {
        const nextGroup = preserveDeletedCustomExerciseInMenuGroup(group, exercise);
        if (nextGroup === group) {
            continue;
        }

        const publishedMenu = findPublishedMenuMatch(group, publishedMenus);
        if (publishedMenu) {
            publishedMenuIds.add(publishedMenu.id);
            publishedMenuNames.add(group.name);
        }

        preservedMenuNames.push(group.name);
    }

    return {
        isPublished: Boolean(publishedExercise),
        publishedExerciseId: publishedExercise?.id ?? null,
        publishedMenuIds: [...publishedMenuIds],
        publishedMenuNames: [...publishedMenuNames],
        preservedMenuNames,
    };
}
