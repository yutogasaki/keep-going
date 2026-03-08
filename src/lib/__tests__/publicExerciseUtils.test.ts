import { describe, expect, it } from 'vitest';
import type { PublicExercise } from '../publicExercises';
import {
    createPublicExerciseDedupKey,
    dedupeExercisesByIdentity,
    pickRecommendedExercises,
} from '../publicExerciseUtils';

function createExercise(overrides: Partial<PublicExercise> & Pick<PublicExercise, 'id' | 'name'>): PublicExercise {
    return {
        id: overrides.id,
        name: overrides.name,
        sec: overrides.sec ?? 30,
        emoji: overrides.emoji ?? '🩰',
        placement: overrides.placement ?? 'stretch',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description ?? null,
        authorName: overrides.authorName ?? 'teacher',
        accountId: overrides.accountId ?? 'account-1',
        downloadCount: overrides.downloadCount ?? 0,
        createdAt: overrides.createdAt ?? '2026-03-08T00:00:00.000Z',
    };
}

describe('publicExerciseUtils', () => {
    it('creates a stable dedupe key from exercise identity', () => {
        const exercise = createExercise({ id: 'ex-1', name: 'ゆびのばし', sec: 45, emoji: '🦶', placement: 'prep' });

        expect(createPublicExerciseDedupKey(exercise)).toBe('ゆびのばし|🦶|45|prep|0');
    });

    it('dedupes exercises by visible identity while keeping the first match', () => {
        const first = createExercise({ id: 'ex-1', name: 'ゆびのばし', sec: 45, emoji: '🦶', placement: 'prep' });
        const duplicate = createExercise({ id: 'ex-2', name: 'ゆびのばし', sec: 45, emoji: '🦶', placement: 'prep' });
        const unique = createExercise({ id: 'ex-3', name: 'ブリッジ', sec: 30, emoji: '🌈', placement: 'core' });

        expect(dedupeExercisesByIdentity([first, duplicate, unique])).toEqual([first, unique]);
    });

    it('picks trending, newest, and popular exercises without duplicate identities', () => {
        const now = Date.parse('2026-03-08T12:00:00.000Z');
        const trending = createExercise({
            id: 'ex-trending',
            name: 'トレンド',
            createdAt: '2026-03-06T12:00:00.000Z',
            downloadCount: 30,
        });
        const newestDuplicate = createExercise({
            id: 'ex-newest-dup',
            name: 'トレンド',
            createdAt: '2026-03-08T09:00:00.000Z',
            downloadCount: 5,
        });
        const newest = createExercise({
            id: 'ex-newest',
            name: 'あたらしい',
            createdAt: '2026-03-08T10:00:00.000Z',
            downloadCount: 4,
        });
        const popular = createExercise({
            id: 'ex-popular',
            name: 'にんき',
            createdAt: '2026-02-20T10:00:00.000Z',
            downloadCount: 50,
        });

        expect(
            pickRecommendedExercises(
                [trending, popular],
                [newestDuplicate, newest],
                now,
            ).map((exercise) => exercise.id),
        ).toEqual(['ex-trending', 'ex-newest', 'ex-popular']);
    });
});
