export const EXERCISE_PLACEMENTS = ['prep', 'stretch', 'core', 'barre', 'ending', 'rest'] as const;

export type ExercisePlacement = (typeof EXERCISE_PLACEMENTS)[number];

export const SESSION_PLACEMENTS = ['prep', 'stretch', 'core', 'barre', 'ending'] as const;

export const EXERCISE_PLACEMENT_LABELS: Record<ExercisePlacement, string> = {
    prep: '準備',
    stretch: 'ストレッチ',
    core: '体幹',
    barre: 'バー',
    ending: 'おわり',
    rest: '休憩',
};

export const EXERCISE_PLACEMENT_ACCENT_COLORS: Record<ExercisePlacement, string> = {
    prep: '#4ECDC4',
    stretch: '#2BBAA0',
    core: '#3D8BFF',
    barre: '#FF8CC6',
    ending: '#8E7CFF',
    rest: '#8FA4B2',
};

const EXERCISE_PLACEMENT_ORDER: Record<ExercisePlacement, number> = {
    prep: 0,
    stretch: 1,
    core: 2,
    barre: 3,
    ending: 4,
    rest: 5,
};

export function getExercisePlacementLabel(placement: ExercisePlacement): string {
    return EXERCISE_PLACEMENT_LABELS[placement];
}

export function getExercisePlacementAccentColor(placement: ExercisePlacement): string {
    return EXERCISE_PLACEMENT_ACCENT_COLORS[placement];
}

export function getExercisePlacementOrder(placement: ExercisePlacement): number {
    return EXERCISE_PLACEMENT_ORDER[placement];
}

export function isRestPlacement(placement: ExercisePlacement): boolean {
    return placement === 'rest';
}

export function isExercisePlacement(value: unknown): value is ExercisePlacement {
    return typeof value === 'string' && EXERCISE_PLACEMENTS.includes(value as ExercisePlacement);
}

export function normalizeExercisePlacement(value: unknown): ExercisePlacement {
    return isExercisePlacement(value) ? value : 'stretch';
}
