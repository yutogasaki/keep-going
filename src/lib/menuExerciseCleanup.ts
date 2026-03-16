import { getMenuGroupItems, type MenuGroup } from '../data/menuGroups';
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
