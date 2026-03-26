import type { MenuGroup } from '../../../data/menuGroups';
import type { CustomExercise } from '../../../lib/db';

export function filterVisibleCustomGroups(
    groups: MenuGroup[],
    currentUserId: string | undefined,
    isTogetherMode: boolean,
): MenuGroup[] {
    return groups.filter((group) => {
        if (isTogetherMode) {
            return true;
        }

        return !group.creatorId || group.creatorId === currentUserId;
    });
}

export function filterVisibleCustomExercises(
    exercises: CustomExercise[],
    currentUserId: string | undefined,
    isTogetherMode: boolean,
): CustomExercise[] {
    return exercises.filter((exercise) => {
        if (isTogetherMode) {
            return true;
        }

        return !exercise.creatorId || exercise.creatorId === currentUserId;
    });
}
