import { getExerciseById } from '../../../data/exercises';
import type { ExercisePlacement } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';

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

export function buildGroupCardSummary(group: MenuGroup, exerciseMap?: GroupExerciseMap) {
    const exercises = group.exerciseIds
        .map((id) => resolveGroupExercise(id, exerciseMap))
        .filter((exercise): exercise is GroupCardExerciseSummary => exercise !== null);
    const activeExercises = exercises.filter((exercise) => exercise.placement !== 'rest');
    const totalSec = activeExercises.reduce((sum, exercise) => sum + exercise.sec, 0);

    return {
        exercises,
        minutes: Math.ceil(totalSec / 60),
        exerciseCount: activeExercises.length,
    };
}
