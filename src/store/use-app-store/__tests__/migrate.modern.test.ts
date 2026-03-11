import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    migrateAppState,
    partializeAppState,
    PERSISTED_APP_STATE_KEYS,
} from '../migrate';
import { makeCurrentState, makeV0State, makeV5State } from './migrationTestHelpers';

vi.mock('../../../lib/db', () => ({
    getTodayKey: vi.fn(() => '2026-03-06'),
}));

vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-1234',
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('modern migrations', () => {
    it('v10 converts joinedChallengeIds arrays into per-user records', () => {
        const state = makeV5State({ joinedChallengeIds: ['challenge-1', 'challenge-2'] });
        const result = migrateAppState(state, 5);

        expect(result.joinedChallengeIds).toEqual({
            'user-1': ['challenge-1', 'challenge-2'],
        });
    });

    it('v10 turns an empty challenge array into an empty record', () => {
        const state = makeV5State({ joinedChallengeIds: [] });
        const result = migrateAppState(state, 5);

        expect(result.joinedChallengeIds).toEqual({});
    });

    it('v11 removes old default required and excluded values', () => {
        const requiredState = makeV5State();
        requiredState.users[0].requiredExercises = ['S01', 'S02', 'S07', 'S05'];
        const requiredResult = migrateAppState(requiredState, 10);
        expect(requiredResult.users[0].requiredExercises).toEqual(['S05']);

        const excludedState = makeV5State();
        excludedState.users[0].excludedExercises = ['C01', 'C02', 'S03'];
        const excludedResult = migrateAppState(excludedState, 10);
        expect(excludedResult.users[0].excludedExercises).toEqual(['S03']);
    });

    it('v11 keeps user-defined exercise settings', () => {
        const state = makeV5State();
        state.users[0].requiredExercises = ['S05', 'S10'];
        state.users[0].excludedExercises = ['S03'];

        const result = migrateAppState(state, 10);
        expect(result.users[0].requiredExercises).toEqual(['S05', 'S10']);
        expect(result.users[0].excludedExercises).toEqual(['S03']);
    });

    it('v13 defaults the session controls hint flag to false', () => {
        const state = makeCurrentState();
        delete state.hasSeenSessionControlsHint;

        const result = migrateAppState(state, 12);
        expect(result.hasSeenSessionControlsHint).toBe(false);
    });

    it('v13 preserves an existing session controls hint flag', () => {
        const state = makeCurrentState({ hasSeenSessionControlsHint: true });
        const result = migrateAppState(state, 12);

        expect(result.hasSeenSessionControlsHint).toBe(true);
    });

    it('v14 defaults missing session drafts to null', () => {
        const state = makeCurrentState();
        delete state.sessionDraft;

        const result = migrateAppState(state, 13);
        expect(result.sessionDraft).toBeNull();
    });

    it('v19 drops legacy session drafts without an auto kind', () => {
        const state = makeCurrentState({
            sessionDraft: {
                date: '2026-03-07',
                exerciseIds: ['S01'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        const result = migrateAppState(state, 18);
        expect(result.sessionDraft).toBeNull();
    });

    it('keeps valid auto session drafts in the current shape', () => {
        const state = makeCurrentState({
            sessionDraft: {
                kind: 'auto' as const,
                date: '2026-03-07',
                exerciseIds: ['S01'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        const result = migrateAppState(state, 19);
        expect(result.sessionDraft).toEqual(state.sessionDraft);
    });

    it('partialize persists the selected users alongside the session draft slice', () => {
        const state = makeCurrentState({
            sessionUserIds: ['user-1', 'user-2'],
            sessionDraft: {
                kind: 'auto' as const,
                date: '2026-03-07',
                exerciseIds: ['S01', 'S02'],
                userIds: ['user-1', 'user-2'],
                returnTab: 'home',
            },
        });

        const partialized = partializeAppState(state as any);

        expect(partialized.sessionUserIds).toEqual(['user-1', 'user-2']);
        expect(partialized.sessionDraft).toEqual(state.sessionDraft);
    });

    it('keeps the persisted slice keys aligned with the declared contract', () => {
        const state = makeCurrentState();
        const partialized = partializeAppState(state as any);

        expect(Object.keys(partialized).sort()).toEqual([...PERSISTED_APP_STATE_KEYS].sort());
    });

    it('migrates a v0 state all the way to the current structure', () => {
        const state = makeV0State({
            fuwafuwaName: 'ひかる',
            classLevel: '中級',
            dailyTargetMinutes: 15,
        });

        const result = migrateAppState(state, 0);
        expect(result.users).toHaveLength(1);
        expect(result.users[0].name).toBe('ひかる');
        expect(result.users[0].classLevel).toBe('中級');
        expect(result.users[0].dailyTargetMinutes).toBe(15);
        expect(result.users[0].requiredExercises).not.toContain('S01');
        expect(result.users[0].excludedExercises).not.toContain('C01');
        expect(result.users[0].chibifuwas).toEqual([]);
        expect(result.users[0].consumedMagicSeconds).toBe(0);
        expect((result.users[0] as any).consumedMagicDate).toBeUndefined();
        expect(result.joinedChallengeIds).toEqual({});
        expect(result.hasSeenSessionControlsHint).toBe(false);
        expect(result.sessionDraft).toBeNull();
        expect((result as any).classLevel).toBeUndefined();
        expect((result as any).fuwafuwaName).toBeUndefined();
        expect((result as any).ttsRate).toBeUndefined();
        expect((result as any).ttsPitch).toBeUndefined();
    });

    it('v16 removes ttsRate and ttsPitch from pre-cleanup state', () => {
        const state = { users: [], ttsRate: 0.95, ttsPitch: 1.05 } as any;
        const result = migrateAppState(state, 15);

        expect((result as any).ttsRate).toBeUndefined();
        expect((result as any).ttsPitch).toBeUndefined();
    });

    it('v17 initializes missing challengeStars on users', () => {
        const state = makeCurrentState();
        delete state.users[0].challengeStars;

        const result = migrateAppState(state, 16);

        expect(result.users[0].challengeStars).toBe(0);
    });

    it('v17 preserves existing challengeStars', () => {
        const state = makeCurrentState();
        state.users[0].challengeStars = 7;

        const result = migrateAppState(state, 16);

        expect(result.users[0].challengeStars).toBe(7);
    });

    it('v18 initializes missing dismissedHomeAnnouncementIds', () => {
        const state = makeCurrentState();
        delete state.dismissedHomeAnnouncementIds;

        const result = migrateAppState(state, 17);

        expect(result.dismissedHomeAnnouncementIds).toEqual([]);
    });

    it('v18 preserves existing dismissedHomeAnnouncementIds', () => {
        const state = makeCurrentState({
            dismissedHomeAnnouncementIds: ['challenge:challenge-1'],
        });

        const result = migrateAppState(state, 17);

        expect(result.dismissedHomeAnnouncementIds).toEqual(['challenge:challenge-1']);
    });

    it('v19 is a no-op for already migrated state', () => {
        const state = { users: [] } as any;
        const result = migrateAppState(state, 19);

        expect((result as any).ttsRate).toBeUndefined();
        expect((result as any).ttsPitch).toBeUndefined();
    });
});
