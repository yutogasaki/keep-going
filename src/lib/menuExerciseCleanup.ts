import { getMenuGroupItems, type MenuGroup, type MenuGroupInlineItem } from '../data/menuGroups';
import type { CustomExercise } from './db';
import type { TeacherMenu } from './teacherContent';

export function menuGroupReferencesExercise(
    group: Pick<MenuGroup, 'exerciseIds' | 'items'>,
    exerciseId: string,
): boolean {
    return getMenuGroupItems(group).some((item) => item.kind === 'exercise_ref' && item.exerciseId === exerciseId);
}

export function removeExerciseFromMenuGroup(group: MenuGroup, exerciseId: string): MenuGroup | null {
    const hadExplicitItems = Array.isArray(group.items) && group.items.length > 0;
    const sourceItems = getMenuGroupItems(group);
    const nextItems = sourceItems.filter((item) => item.kind !== 'exercise_ref' || item.exerciseId !== exerciseId);

    if (nextItems.length === sourceItems.length) {
        return group;
    }

    if (nextItems.length === 0) {
        return null;
    }

    return {
        ...group,
        exerciseIds: nextItems.map((item) => item.id),
        items: hadExplicitItems ? nextItems : undefined,
    };
}

function createPreservedInlineItem(
    sourceItemId: string,
    occurrence: number,
    exercise: CustomExercise,
): MenuGroupInlineItem {
    return {
        id: `inline-preserved-${sourceItemId}-${occurrence}`,
        kind: 'inline_only',
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        placement: exercise.placement,
        internal: exercise.hasSplit ? 'R30→L30' : 'single',
        description: exercise.description,
    };
}

export function preserveDeletedCustomExerciseInMenuGroup(
    group: MenuGroup,
    exercise: CustomExercise,
): MenuGroup {
    const sourceItems = getMenuGroupItems(group);
    let preservedCount = 0;
    const nextItems = sourceItems.map((item) => {
        if (item.kind !== 'exercise_ref' || item.exerciseId !== exercise.id) {
            return item;
        }

        preservedCount += 1;
        return createPreservedInlineItem(item.id, preservedCount, exercise);
    });

    if (preservedCount === 0) {
        return group;
    }

    return {
        ...group,
        exerciseIds: nextItems.map((item) => item.id),
        items: nextItems,
    };
}

export function pruneUnavailableExercisesFromMenuGroup(
    group: MenuGroup,
    availableExerciseIds: Set<string>,
): MenuGroup | null {
    let nextGroup: MenuGroup | null = group;

    for (const item of getMenuGroupItems(group)) {
        if (item.kind !== 'exercise_ref' || availableExerciseIds.has(item.exerciseId) || nextGroup === null) {
            continue;
        }

        nextGroup = removeExerciseFromMenuGroup(nextGroup, item.exerciseId);
    }

    return nextGroup;
}

export function teacherMenuReferencesExercise(menu: Pick<TeacherMenu, 'exerciseIds'>, exerciseId: string): boolean {
    return menu.exerciseIds.includes(exerciseId);
}

export function removeExerciseFromTeacherMenu(menu: TeacherMenu, exerciseId: string): TeacherMenu | null {
    if (!teacherMenuReferencesExercise(menu, exerciseId)) {
        return menu;
    }

    const nextExerciseIds = menu.exerciseIds.filter((id) => id !== exerciseId);
    if (nextExerciseIds.length === 0) {
        return null;
    }

    return {
        ...menu,
        exerciseIds: nextExerciseIds,
    };
}
