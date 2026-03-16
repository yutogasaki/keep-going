import type { MenuGroup } from '../data/menuGroups';
import type { CustomExercise } from './db';
import type { PublicMenu } from './publicMenuTypes';
import type { PublicExercise } from './publicExercises';
import { createPublicExerciseDedupKey } from './publicExerciseUtils';
import { createPublicMenuDedupKey } from './publicMenuUtils';

export function findPublishedMenuMatch(
    group: MenuGroup,
    publishedMenus: PublicMenu[],
): PublicMenu | undefined {
    const sourceMatch = publishedMenus.find(
        (publishedMenu) => publishedMenu.sourceMenuGroupId === group.id,
    );
    if (sourceMatch) {
        return sourceMatch;
    }

    const groupKey = createPublicMenuDedupKey(group);
    return publishedMenus.find(
        (publishedMenu) => createPublicMenuDedupKey(publishedMenu) === groupKey,
    );
}

export function findPublishedExerciseMatch(
    exercise: CustomExercise,
    publishedExercises: PublicExercise[],
): PublicExercise | undefined {
    const sourceMatch = publishedExercises.find(
        (publishedExercise) => publishedExercise.sourceCustomExerciseId === exercise.id,
    );
    if (sourceMatch) {
        return sourceMatch;
    }

    const exerciseKey = createPublicExerciseDedupKey({
        name: exercise.name,
        emoji: exercise.emoji,
        sec: exercise.sec,
        placement: exercise.placement,
        hasSplit: exercise.hasSplit ?? false,
    });
    return publishedExercises.find(
        (publishedExercise) => createPublicExerciseDedupKey(publishedExercise) === exerciseKey,
    );
}
