import { getExerciseById } from '../../../data/exercises';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import { getMenuGroupItems, type MenuGroup, type MenuGroupItem } from '../../../data/menuGroups';

export interface GroupCardExerciseSummary {
    id: string;
    name: string;
    emoji: string;
    sec: number;
    placement: ExercisePlacement;
}

export type GroupExerciseMap = Map<string, Omit<GroupCardExerciseSummary, 'id'>>;

function toGroupCardExerciseSummary(
    id: string,
    exercise: Omit<GroupCardExerciseSummary, 'id'>,
): GroupCardExerciseSummary {
    return {
        id,
        name: exercise.name,
        emoji: exercise.emoji,
        sec: exercise.sec,
        placement: exercise.placement,
    };
}

export function resolveGroupExercise(
    id: string,
    exerciseMap?: GroupExerciseMap,
): GroupCardExerciseSummary | null {
    const builtIn = getExerciseById(id);
    if (builtIn) {
        return toGroupCardExerciseSummary(id, builtIn);
    }

    const mapped = exerciseMap?.get(id);
    return mapped ? toGroupCardExerciseSummary(id, mapped) : null;
}

function resolveGroupItem(
    item: MenuGroupItem,
    exerciseMap?: GroupExerciseMap,
): GroupCardExerciseSummary | null {
    if (item.kind === 'inline_only') {
        return {
            id: item.id,
            name: item.name,
            emoji: item.emoji,
            sec: item.sec,
            placement: item.placement,
        };
    }

    return resolveGroupExercise(item.exerciseId, exerciseMap);
}

export function buildGroupCardSummary(group: MenuGroup, exerciseMap?: GroupExerciseMap) {
    const exercises = getMenuGroupItems(group)
        .map((item) => resolveGroupItem(item, exerciseMap))
        .filter((exercise): exercise is GroupCardExerciseSummary => exercise !== null);
    const activeExercises = exercises.filter((exercise) => exercise.placement !== 'rest');
    const totalSec = activeExercises.reduce((sum, exercise) => sum + exercise.sec, 0);

    return {
        exercises,
        minutes: Math.ceil(totalSec / 60),
        exerciseCount: activeExercises.length,
    };
}
