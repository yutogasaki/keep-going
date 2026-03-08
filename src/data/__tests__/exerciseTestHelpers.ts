import { vi } from 'vitest';
import type { Exercise } from '../exercises';

let randomSeed = 0;

function seededRandom(): number {
    randomSeed = (randomSeed * 16807 + 0) % 2147483647;
    return randomSeed / 2147483647;
}

export function seedRandom(seed: number) {
    randomSeed = seed;
    vi.spyOn(Math, 'random').mockImplementation(seededRandom);
}

export function makeCustomExercise(
    overrides: Partial<Exercise> & { id: string; name: string; sec: number; emoji: string },
) {
    return overrides;
}

export function totalSeconds(session: Exercise[]): number {
    return session.reduce((sum, exercise) => sum + exercise.sec, 0);
}
