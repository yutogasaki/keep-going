import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    EXERCISES,
    generateSession,
    type ClassLevel,
    type Exercise,
} from '../exercises';
import { makeCustomExercise, seedRandom, totalSeconds } from './exerciseTestHelpers';

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('generateSession', () => {
    const classLevel: ClassLevel = '初級';

    it('returns a non-empty session', () => {
        seedRandom(42);
        expect(generateSession(classLevel).length).toBeGreaterThan(0);
    });

    it('keeps placement order from prep to ending', () => {
        seedRandom(123);
        const session = generateSession(classLevel);
        let lastPlacementOrder = -1;
        const placementOrder: Record<string, number> = { prep: 0, stretch: 1, core: 2, barre: 3, ending: 4, rest: 5 };

        for (const exercise of session) {
            if (exercise.placement === 'rest') continue;
            const order = placementOrder[exercise.placement] ?? 1;
            expect(order).toBeGreaterThanOrEqual(lastPlacementOrder);
            if (order > lastPlacementOrder) {
                lastPlacementOrder = order;
            }
        }
    });

    it('stays within a reasonable range around the default target', () => {
        seedRandom(456);
        const total = totalSeconds(generateSession(classLevel));

        expect(total).toBeGreaterThan(300);
        expect(total).toBeLessThan(1200);
    });

    it('adjusts total duration when targetSeconds changes', () => {
        seedRandom(789);
        const shortSession = generateSession(classLevel, { targetSeconds: 120 });
        const longSession = generateSession(classLevel, { targetSeconds: 1800 });

        expect(totalSeconds(shortSession)).toBeLessThan(totalSeconds(longSession));
    });

    it('always includes required ids and excludes excluded ids', () => {
        seedRandom(111);
        const stretchExercise = EXERCISES.find((exercise) => exercise.classes.includes('初級') && exercise.placement === 'stretch')!;
        const requiredSession = generateSession(classLevel, { requiredIds: [stretchExercise.id] });
        const excludedSession = generateSession(classLevel, { excludedIds: [stretchExercise.id] });

        expect(requiredSession.map((exercise) => exercise.id)).toContain(stretchExercise.id);
        expect(excludedSession.map((exercise) => exercise.id)).not.toContain(stretchExercise.id);
    });

    it('falls back to a minimum session even when all ids are excluded', () => {
        seedRandom(333);
        const session = generateSession(classLevel, { excludedIds: EXERCISES.map((exercise) => exercise.id) });

        expect(session.length).toBeGreaterThan(0);
    });

    it('includes custom pool exercises and defaults their placement to stretch', () => {
        seedRandom(444);
        const customExercise = makeCustomExercise({ id: 'custom-1', name: 'テスト種目', sec: 30, emoji: '🎯' });
        const session = generateSession(classLevel, {
            customPool: [customExercise],
            requiredIds: ['custom-1'],
        });

        const found = session.find((exercise) => exercise.id === 'custom-1');
        expect(found).toBeDefined();
        expect(found?.placement).toBe('stretch');
    });

    it('applies built-in overrides', () => {
        seedRandom(666);
        const overridden = EXERCISES.map((exercise) => exercise.id === 'S01'
            ? { ...exercise, name: 'オーバーライド開脚', sec: 999 }
            : exercise);

        const session = generateSession(classLevel, {
            builtInOverrides: overridden,
            requiredIds: ['S01'],
        });
        const found = session.find((exercise) => exercise.id === 'S01');

        expect(found?.name).toBe('オーバーライド開脚');
        expect(found?.sec).toBe(999);
    });

    it('avoids too many consecutive identical stretch emojis', () => {
        seedRandom(777);
        const stretchExercises = generateSession(classLevel, { targetSeconds: 600 }).filter((exercise) => exercise.placement === 'stretch');

        if (stretchExercises.length < 3) return;

        let consecutiveCount = 0;
        for (let index = 1; index < stretchExercises.length; index += 1) {
            if (stretchExercises[index].emoji === stretchExercises[index - 1].emoji) {
                consecutiveCount += 1;
            }
        }

        const uniqueEmojis = new Set(stretchExercises.map((exercise) => exercise.emoji)).size;
        if (uniqueEmojis >= 2) {
            expect(consecutiveCount).toBeLessThan(stretchExercises.length / 2);
        }
    });

    it('statistically favors less-used historical exercises', () => {
        const stretchExercises = EXERCISES.filter((exercise) => exercise.classes.includes('初級') && exercise.placement === 'stretch');
        if (stretchExercises.length < 2) return;

        const heavilyUsed = stretchExercises[0].id;
        const lightlyUsed = stretchExercises[1].id;
        let heavyCount = 0;
        let lightCount = 0;

        for (let iteration = 0; iteration < 20; iteration += 1) {
            seedRandom(iteration * 100);
            const session = generateSession(classLevel, {
                historicalCounts: { [heavilyUsed]: 100 },
                targetSeconds: 600,
            });
            const ids = session.map((exercise) => exercise.id);
            if (ids.includes(heavilyUsed)) heavyCount += 1;
            if (ids.includes(lightlyUsed)) lightCount += 1;
        }

        expect(lightCount).toBeGreaterThanOrEqual(heavyCount);
    });

    it('caps non-rest exercise repetition at two', () => {
        seedRandom(888);
        const session = generateSession(classLevel, { targetSeconds: 3600 });
        const countMap = new Map<string, number>();

        for (const exercise of session) {
            if (exercise.placement === 'rest') continue;
            countMap.set(exercise.id, (countMap.get(exercise.id) || 0) + 1);
        }

        for (const [, count] of countMap) {
            expect(count).toBeLessThanOrEqual(2);
        }
    });

    it('does not auto-insert rests under five minutes', () => {
        seedRandom(100);
        const session = generateSession(classLevel, { targetSeconds: 200 });

        expect(session.filter((exercise) => exercise.placement === 'rest')).toHaveLength(0);
    });

    it('auto-inserts R03 rests in longer sessions and never ends on rest', () => {
        seedRandom(42);
        const session = generateSession(classLevel, { targetSeconds: 600 });
        const restExercises = session.filter((exercise) => exercise.placement === 'rest');

        expect(restExercises.length).toBeGreaterThanOrEqual(1);
        restExercises.forEach((exercise) => {
            expect(exercise.id).toBe('R03');
        });
        expect(session[session.length - 1].placement).not.toBe('rest');
    });

    it('ends auto-generated sessions with deep breathing', () => {
        seedRandom(909);
        const session = generateSession(classLevel, { targetSeconds: 240 });
        const lastExercise = session[session.length - 1];

        expect(lastExercise.id).toBe('S09');
        expect(lastExercise.name).toBe('深呼吸');
        expect(lastExercise.placement).toBe('ending');
    });
});
