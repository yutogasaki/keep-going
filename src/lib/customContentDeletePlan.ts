import type { MenuGroup } from '../data/menuGroups';
import { type CustomExercise } from './db';
import { removeExerciseFromMenuGroup } from './menuExerciseCleanup';
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
    updatedMenuNames: string[];
    removedMenuNames: string[];
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
            updatedMenuNames: [],
            removedMenuNames: [],
        };
    }

    const publishedExercise = findPublishedExerciseMatch(exercise, publishedExercises);
    const publishedMenuIds = new Set<string>();
    const publishedMenuNames = new Set<string>();
    const updatedMenuNames: string[] = [];
    const removedMenuNames: string[] = [];

    for (const group of customGroups) {
        const nextGroup = removeExerciseFromMenuGroup(group, exercise.id);
        if (nextGroup === group) {
            continue;
        }

        const publishedMenu = findPublishedMenuMatch(group, publishedMenus);
        if (publishedMenu) {
            publishedMenuIds.add(publishedMenu.id);
            publishedMenuNames.add(group.name);
        }

        if (nextGroup === null) {
            removedMenuNames.push(group.name);
        } else {
            updatedMenuNames.push(group.name);
        }
    }

    return {
        isPublished: Boolean(publishedExercise),
        publishedExerciseId: publishedExercise?.id ?? null,
        publishedMenuIds: [...publishedMenuIds],
        publishedMenuNames: [...publishedMenuNames],
        updatedMenuNames,
        removedMenuNames,
    };
}
