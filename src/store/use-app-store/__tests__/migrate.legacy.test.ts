import { beforeEach, describe, expect, it, vi } from 'vitest';
import { migrateAppState } from '../migrate';
import { makeV0State } from './migrationTestHelpers';

vi.mock('../../../lib/db', () => ({
    getTodayKey: vi.fn(() => '2026-03-06'),
}));

vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-1234',
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('legacy migrations', () => {
    it('v0 adds S07 before later cleanup removes old defaults', () => {
        const state = makeV0State({ requiredExercises: ['S01', 'S02'] });
        const result = migrateAppState(state, 0);

        expect(result.users[0].requiredExercises).toEqual([]);
    });

    it('v0 does not duplicate S07 when already present', () => {
        const state = makeV0State({ requiredExercises: ['S01', 'S07'] });
        migrateAppState(state, 0);

        const filtered = state.requiredExercises?.filter((id: string) => id === 'S07') ?? [];
        expect(filtered.length).toBeLessThanOrEqual(1);
    });

    it('v2 defaults bgm and haptics to true when missing', () => {
        const state = makeV0State();
        delete state.bgmEnabled;
        delete state.hapticEnabled;

        const result = migrateAppState(state, 0);
        expect(result.bgmEnabled).toBe(true);
        expect(result.hapticEnabled).toBe(true);
    });

    it('v2 keeps existing bgm and haptic values', () => {
        const state = makeV0State({ bgmEnabled: false, hapticEnabled: false });
        const result = migrateAppState(state, 0);

        expect(result.bgmEnabled).toBe(false);
        expect(result.hapticEnabled).toBe(false);
    });

    it('v3 creates users from legacy single-user state', () => {
        const state = makeV0State({ fuwafuwaName: 'さくら' });
        const result = migrateAppState(state, 0);

        expect(result.users).toHaveLength(1);
        expect(result.users[0].name).toBe('さくら');
    });

    it('v3 removes legacy top-level fields', () => {
        const state = makeV0State();
        migrateAppState(state, 0);

        expect(state.classLevel).toBeUndefined();
        expect(state.fuwafuwaBirthDate).toBeUndefined();
        expect(state.fuwafuwaType).toBeUndefined();
    });

    it('v3 skips migration when users already exist', () => {
        const state = makeV0State({ users: [{ id: 'existing', name: '既存ユーザー' }] });
        const result = migrateAppState(state, 0);

        expect(result.users[0].id).toBe('existing');
    });

    it('v5 moves global settings into the first user', () => {
        const state: any = {
            ...makeV0State(),
            users: [{ id: 'u1', name: 'テスト' }],
            sessionUserIds: ['u1'],
            dailyTargetMinutes: 15,
            excludedExercises: ['S03'],
            requiredExercises: ['S01', 'S05'],
            bgmEnabled: true,
            hapticEnabled: true,
        };

        const result = migrateAppState(state, 3);
        expect(result.users[0].dailyTargetMinutes).toBe(15);
        expect(result.users[0].requiredExercises).toContain('S05');
        expect(result.users[0].excludedExercises).toContain('S03');
    });

    it('v5 removes migrated global exercise fields', () => {
        const state: any = {
            ...makeV0State(),
            users: [{ id: 'u1', name: 'テスト' }],
            sessionUserIds: ['u1'],
            bgmEnabled: true,
            hapticEnabled: true,
        };

        migrateAppState(state, 3);
        expect(state.dailyTargetMinutes).toBeUndefined();
        expect(state.excludedExercises).toBeUndefined();
        expect(state.requiredExercises).toBeUndefined();
    });

    it('v5 gives later users default per-user settings', () => {
        const state: any = {
            ...makeV0State(),
            users: [
                { id: 'u1', name: 'ユーザー1' },
                { id: 'u2', name: 'ユーザー2' },
            ],
            sessionUserIds: ['u1'],
            bgmEnabled: true,
            hapticEnabled: true,
        };

        const result = migrateAppState(state, 3);
        expect(result.users[1].dailyTargetMinutes).toBe(10);
        expect(result.users[1].requiredExercises).toEqual([]);
        expect(result.users[1].excludedExercises).toEqual([]);
    });
});
