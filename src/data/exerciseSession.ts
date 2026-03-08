import type { ExercisePlacement } from './exercisePlacement';
import {
    EXERCISES,
    getExerciseById,
    getExercisesByClass,
    isRestExercise,
    type ClassLevel,
    type Exercise,
} from './exerciseCatalog';

const SESSION_ORDER: ExercisePlacement[] = ['prep', 'stretch', 'core', 'barre', 'ending'];
const FILL_ORDER: ExercisePlacement[] = ['stretch', 'core', 'barre', 'ending', 'prep'];
const TARGET_COUNTS: Partial<Record<ExercisePlacement, number>> = {
    prep: 1,
    core: 2,
    barre: 1,
    ending: 1,
};

function createExerciseFromPool(poolExercise: SessionPoolExercise): Exercise {
    return {
        ...poolExercise,
        internal: poolExercise.internal || (poolExercise.hasSplit ? 'R30→L30' : 'single'),
        placement: poolExercise.placement || 'stretch',
        classes: poolExercise.classes || ['プレ', '初級', '中級', '上級'],
        priority: poolExercise.priority || 'medium',
    };
}

function orderStretchExercises(exercises: Exercise[]): Exercise[] {
    const ordered: Exercise[] = [];
    const remaining = [...exercises];

    while (remaining.length > 0) {
        if (ordered.length === 0) {
            ordered.push(remaining.splice(0, 1)[0]);
            continue;
        }

        const lastExercise = ordered[ordered.length - 1];
        let bestIndex = remaining.findIndex((exercise) => exercise.emoji !== lastExercise.emoji);
        if (bestIndex === -1) {
            bestIndex = 0;
        }
        ordered.push(remaining.splice(bestIndex, 1)[0]);
    }

    return ordered;
}

function sumSeconds(exercises: Exercise[]): number {
    return exercises.reduce((sum, exercise) => sum + exercise.sec, 0);
}

function buildAvailableByPlacement(exercises: Exercise[]) {
    return SESSION_ORDER.reduce<Record<ExercisePlacement, Exercise[]>>(
        (acc, placement) => {
            acc[placement] = exercises.filter((exercise) => exercise.placement === placement);
            return acc;
        },
        {
            prep: [],
            stretch: [],
            core: [],
            barre: [],
            ending: [],
            rest: [],
        },
    );
}

function getSortWeight(exercise: Exercise, usageCounts: Record<string, number>) {
    return Math.random() + (usageCounts[exercise.id] || 0) * 10;
}

function pickPlacementExercises(
    placement: ExercisePlacement,
    availableByPlacement: Record<ExercisePlacement, Exercise[]>,
    requiredIds: string[],
    usageCounts: Record<string, number>,
): Exercise[] {
    const available = availableByPlacement[placement];
    const required = available.filter((exercise) => requiredIds.includes(exercise.id));
    const targetCount = TARGET_COUNTS[placement];

    if (!targetCount) {
        return [...required];
    }

    const selected = [...required];
    const remaining = available
        .filter((exercise) => !requiredIds.includes(exercise.id))
        .sort((a, b) => getSortWeight(a, usageCounts) - getSortWeight(b, usageCounts));

    while (selected.length < targetCount && remaining.length > 0) {
        selected.push(remaining.shift()!);
    }

    return selected;
}

function pushUntilTarget(
    source: Exercise[],
    selected: Exercise[],
    targetSeconds: number,
    currentSecondsRef: { value: number },
) {
    for (const exercise of source) {
        if (currentSecondsRef.value >= targetSeconds) {
            break;
        }
        selected.push(exercise);
        currentSecondsRef.value += exercise.sec;
    }
}

export const DEFAULT_SESSION_TARGET_SECONDS = 600;

export type SessionPoolExercise =
    Pick<Exercise, 'id' | 'name' | 'sec' | 'emoji'>
    & Partial<Omit<Exercise, 'id' | 'name' | 'sec' | 'emoji'>>;

export interface GenerateSessionOptions {
    excludedIds?: string[];
    requiredIds?: string[];
    targetSeconds?: number;
    customPool?: SessionPoolExercise[];
    historicalCounts?: Record<string, number>;
    builtInOverrides?: Exercise[];
}

export function generateSession(classLevel: ClassLevel, options: GenerateSessionOptions = {}): Exercise[] {
    const {
        excludedIds = [],
        requiredIds = [],
        targetSeconds = DEFAULT_SESSION_TARGET_SECONDS,
        customPool = [],
        historicalCounts = {},
        builtInOverrides,
    } = options;

    const baseExercises = builtInOverrides
        ? builtInOverrides.filter((exercise) => exercise.classes.includes(classLevel === 'その他' ? '初級' : classLevel))
        : getExercisesByClass(classLevel);
    const allAvailable = [...baseExercises, ...customPool.map(createExerciseFromPool)];

    let filtered = allAvailable.filter((exercise) => !excludedIds.includes(exercise.id));
    if (filtered.length < 3) {
        filtered = allAvailable;
    }

    const availableByPlacement = buildAvailableByPlacement(filtered);
    const selectedPrep = pickPlacementExercises('prep', availableByPlacement, requiredIds, historicalCounts);
    const selectedCore = pickPlacementExercises('core', availableByPlacement, requiredIds, historicalCounts);
    const selectedBarre = pickPlacementExercises('barre', availableByPlacement, requiredIds, historicalCounts);
    const selectedEnding = pickPlacementExercises('ending', availableByPlacement, requiredIds, historicalCounts);

    const requiredStretch = availableByPlacement.stretch.filter((exercise) => requiredIds.includes(exercise.id));
    const selectedStretch = [...requiredStretch];

    const currentSecondsRef = {
        value: sumSeconds([...selectedPrep, ...selectedCore, ...selectedBarre, ...selectedEnding, ...selectedStretch]),
    };

    const remainingStretch = availableByPlacement.stretch.filter((exercise) => !requiredIds.includes(exercise.id));
    const highStretch = remainingStretch
        .filter((exercise) => exercise.priority === 'high')
        .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));
    const mediumStretch = remainingStretch
        .filter((exercise) => exercise.priority === 'medium')
        .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));

    pushUntilTarget(highStretch, selectedStretch, targetSeconds, currentSecondsRef);
    pushUntilTarget(mediumStretch, selectedStretch, targetSeconds, currentSecondsRef);

    if (currentSecondsRef.value < targetSeconds) {
        const alreadySelectedIds = new Set(
            [...selectedPrep, ...selectedStretch, ...selectedCore, ...selectedBarre, ...selectedEnding].map((exercise) => exercise.id),
        );

        for (const placement of FILL_ORDER) {
            const unused = availableByPlacement[placement]
                .filter((exercise) => !alreadySelectedIds.has(exercise.id))
                .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));

            const targetList = placement === 'stretch'
                ? selectedStretch
                : placement === 'core'
                    ? selectedCore
                    : placement === 'barre'
                        ? selectedBarre
                        : placement === 'ending'
                            ? selectedEnding
                            : selectedPrep;

            pushUntilTarget(unused, targetList, targetSeconds, currentSecondsRef);

            if (currentSecondsRef.value >= targetSeconds) {
                break;
            }
        }
    }

    if (currentSecondsRef.value < targetSeconds) {
        const countMap = new Map<string, number>();
        for (const exercise of [...selectedPrep, ...selectedStretch, ...selectedCore, ...selectedBarre, ...selectedEnding]) {
            countMap.set(exercise.id, (countMap.get(exercise.id) || 0) + 1);
        }

        for (const placement of FILL_ORDER) {
            const canRepeat = availableByPlacement[placement]
                .filter((exercise) => (countMap.get(exercise.id) || 0) < 2)
                .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));

            const targetList = placement === 'stretch'
                ? selectedStretch
                : placement === 'core'
                    ? selectedCore
                    : placement === 'barre'
                        ? selectedBarre
                        : placement === 'ending'
                            ? selectedEnding
                            : selectedPrep;

            for (const exercise of canRepeat) {
                if (currentSecondsRef.value >= targetSeconds) {
                    break;
                }

                const nextCount = (countMap.get(exercise.id) || 0) + 1;
                countMap.set(exercise.id, nextCount);
                targetList.push(exercise);
                currentSecondsRef.value += exercise.sec;
            }

            if (currentSecondsRef.value >= targetSeconds) {
                break;
            }
        }
    }

    const session = [
        ...selectedPrep,
        ...orderStretchExercises(selectedStretch),
        ...selectedCore,
        ...selectedBarre,
        ...selectedEnding,
    ];

    const restInterval = 300;
    const restExercise = EXERCISES.find((exercise) => exercise.id === 'R03');
    if (!restExercise) {
        return session;
    }

    const withRests: Exercise[] = [];
    let accumulated = 0;
    for (const exercise of session) {
        withRests.push(exercise);
        accumulated += exercise.sec;
        if (accumulated >= restInterval) {
            withRests.push(restExercise);
            accumulated = 0;
        }
    }

    if (withRests.length > 0 && isRestExercise(withRests[withRests.length - 1])) {
        withRests.pop();
    }

    return withRests;
}

export function getReplacementExercise(classLevel: ClassLevel, currentSessionIds: string[], targetSec: number): Exercise | null {
    const available = getExercisesByClass(classLevel).filter(
        (exercise) => !currentSessionIds.includes(exercise.id) && exercise.placement === 'stretch',
    );
    const match = available.find((exercise) => exercise.sec === targetSec) || available[0];
    return match || null;
}

export function generateSessionFromIds(ids: string[]): Exercise[] {
    return ids
        .map((id) => getExerciseById(id))
        .filter((exercise): exercise is Exercise => exercise !== undefined);
}

export function calculateTotalSeconds(ids: string[]): number {
    return ids.reduce((total, id) => {
        const exercise = getExerciseById(id);
        return total + (exercise?.sec || 0);
    }, 0);
}
