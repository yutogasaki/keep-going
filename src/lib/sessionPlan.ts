import type { Exercise } from '../data/exercises';
import type { ExercisePlacement } from '../data/exercisePlacement';
import {
    getMenuGroupItems,
    type MenuGroup,
    type MenuGroupInlineItem,
} from '../data/menuGroups';

export interface SessionPlannedItem {
    id: string;
    kind: 'exercise_ref' | 'inline_only';
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    internal: string;
    reading?: string;
    description?: string;
}

type ResolvableExercise = Pick<
    Exercise,
    'id' | 'name' | 'sec' | 'emoji' | 'placement'
> & Partial<Pick<Exercise, 'internal' | 'reading' | 'description' | 'hasSplit'>>;

const DEFAULT_CLASSES: Exercise['classes'] = ['プレ', '初級', '中級', '上級'];

function toSessionPlannedInlineItem(item: MenuGroupInlineItem): SessionPlannedItem {
    return {
        id: item.id,
        kind: 'inline_only',
        name: item.name,
        sec: item.sec,
        emoji: item.emoji,
        placement: item.placement,
        internal: item.internal,
        reading: item.reading,
        description: item.description,
    };
}

export function createSessionPlannedItemFromExercise(
    exercise: ResolvableExercise,
    options?: { id?: string; kind?: SessionPlannedItem['kind'] },
): SessionPlannedItem {
    return {
        id: options?.id ?? exercise.id,
        kind: options?.kind ?? 'exercise_ref',
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        placement: exercise.placement,
        internal: exercise.internal || (exercise.hasSplit ? 'R30→L30' : 'single'),
        reading: exercise.reading,
        description: exercise.description,
    };
}

export function sessionPlannedItemToExercise(item: SessionPlannedItem): Exercise {
    const hasSplit = item.internal.includes('→');

    return {
        id: item.id,
        name: item.name,
        sec: item.sec,
        emoji: item.emoji,
        placement: item.placement,
        internal: item.internal,
        classes: DEFAULT_CLASSES,
        priority: 'medium',
        hasSplit,
        reading: item.reading,
        description: item.description,
    };
}

export function buildSessionPlannedItemsFromExercises(exercises: Exercise[]): SessionPlannedItem[] {
    return exercises.map((exercise) => createSessionPlannedItemFromExercise(exercise));
}

export function resolveMenuGroupToSessionPlannedItems(
    group: Pick<MenuGroup, 'exerciseIds' | 'items'>,
    exerciseLookup: Map<string, ResolvableExercise>,
): SessionPlannedItem[] {
    return getMenuGroupItems(group).flatMap((item) => {
        if (item.kind === 'inline_only') {
            return [toSessionPlannedInlineItem(item)];
        }

        const exercise = exerciseLookup.get(item.exerciseId);
        if (!exercise) {
            return [];
        }

        return [createSessionPlannedItemFromExercise(exercise, {
            id: item.id,
            kind: 'exercise_ref',
        })];
    });
}

export function isInlineSessionPlannedItem(item: SessionPlannedItem): boolean {
    return item.kind === 'inline_only';
}
