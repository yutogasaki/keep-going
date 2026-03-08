import type { PublicExercise } from './publicExercises';

export function createPublicExerciseDedupKey(
    exercise: Pick<PublicExercise, 'name' | 'emoji' | 'sec' | 'placement' | 'hasSplit'>,
): string {
    return `${exercise.name}|${exercise.emoji}|${exercise.sec}|${exercise.placement}|${exercise.hasSplit ? '1' : '0'}`;
}

export function dedupeExercisesByIdentity(exercises: PublicExercise[]): PublicExercise[] {
    const seenKeys = new Set<string>();

    return exercises.filter((exercise) => {
        const key = createPublicExerciseDedupKey(exercise);
        if (seenKeys.has(key)) {
            return false;
        }
        seenKeys.add(key);
        return true;
    });
}

export function pickRecommendedExercises(
    popular: PublicExercise[],
    newest: PublicExercise[],
    now = Date.now(),
): PublicExercise[] {
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const trending = popular.filter((exercise) => exercise.createdAt >= oneWeekAgo);
    const result: PublicExercise[] = [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    const addOne = (list: PublicExercise[]) => {
        for (const exercise of list) {
            const key = createPublicExerciseDedupKey(exercise);
            if (seenIds.has(exercise.id) || seenKeys.has(key)) {
                continue;
            }
            result.push(exercise);
            seenIds.add(exercise.id);
            seenKeys.add(key);
            return;
        }
    };

    addOne(trending);
    addOne(newest);
    addOne(popular);

    for (const list of [trending, newest, popular]) {
        if (result.length >= 3) {
            break;
        }
        for (const exercise of list) {
            const key = createPublicExerciseDedupKey(exercise);
            if (seenIds.has(exercise.id) || seenKeys.has(key)) {
                continue;
            }
            result.push(exercise);
            seenIds.add(exercise.id);
            seenKeys.add(key);
            if (result.length >= 3) {
                break;
            }
        }
    }

    return result;
}
