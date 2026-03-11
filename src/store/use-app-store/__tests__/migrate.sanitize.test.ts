import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_STATE_VERSION, migrateAppState } from '../migrate';
import { makeCurrentState } from './migrationTestHelpers';

vi.mock('../../../lib/db', () => ({
    getTodayKey: vi.fn(() => '2026-03-06'),
}));

vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-1234',
});

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('persisted state sanitization', () => {
    it('sanitizes corrupted current-state persisted values', () => {
        const state = makeCurrentState({
            sessionUserIds: ['ghost', 'user-1', 'user-1'],
            joinedChallengeIds: {
                'user-1': ['challenge-1', 42, 'challenge-1'],
                ghost: ['challenge-2'],
            },
            soundVolume: 9,
            notificationTime: '99:99',
            ttsEnabled: 'yes',
            bgmEnabled: undefined,
            hapticEnabled: null,
            notificationsEnabled: 'sometimes',
            hasSeenSessionControlsHint: 'done',
            dismissedHomeAnnouncementIds: ['challenge:challenge-1', null, 'challenge:challenge-1'],
            debugFuwafuwaStage: 'adult',
            debugFuwafuwaType: undefined,
            debugActiveDays: 'five',
            debugFuwafuwaScale: Number.NaN,
            sessionDraft: {
                date: '2026-03-07',
                exerciseIds: ['S01', 1],
                userIds: ['user-1', 'user-1'],
                returnTab: 'unknown',
            },
        });

        const result = migrateAppState(state, APP_STATE_VERSION);

        expect(result.sessionUserIds).toEqual(['user-1']);
        expect(result.joinedChallengeIds).toEqual({
            'user-1': ['challenge-1'],
        });
        expect(result.soundVolume).toBe(1);
        expect(result.notificationTime).toBe('21:00');
        expect(result.ttsEnabled).toBe(true);
        expect(result.bgmEnabled).toBe(true);
        expect(result.hapticEnabled).toBe(true);
        expect(result.notificationsEnabled).toBe(false);
        expect(result.hasSeenSessionControlsHint).toBe(false);
        expect(result.dismissedHomeAnnouncementIds).toEqual(['challenge:challenge-1']);
        expect(result.debugFuwafuwaStage).toBeNull();
        expect(result.debugFuwafuwaType).toBeNull();
        expect(result.debugActiveDays).toBeNull();
        expect(result.debugFuwafuwaScale).toBeNull();
        expect(result.sessionDraft).toBeNull();
    });

    it('sanitizes corrupted persisted users and aligns user-based slices to surviving users', () => {
        const state = makeCurrentState({
            users: [
                null,
                {
                    id: 'user-1',
                    name: '',
                    classLevel: '宇宙級',
                    fuwafuwaBirthDate: '',
                    fuwafuwaType: 'star',
                    fuwafuwaCycleCount: 0,
                    fuwafuwaName: '',
                    pastFuwafuwas: [
                        { id: 'past-1', name: 'もも', type: 2, activeDays: 7, finalStage: 3, sayonaraDate: '2026-03-01' },
                        { type: 'bad' },
                    ],
                    notifiedFuwafuwaStages: [1, 1, '2'],
                    dailyTargetMinutes: -30,
                    excludedExercises: ['S01', 'S01', 7],
                    requiredExercises: ['S02', null],
                    consumedMagicSeconds: -5,
                    avatarUrl: '',
                    chibifuwas: [
                        { id: 'badge-1', type: 1, challengeTitle: 'はじめて', earnedDate: '2026-03-02' },
                        { id: '', type: 'bad', challengeTitle: '', earnedDate: '' },
                    ],
                },
                {
                    id: 12,
                    name: 'ghost',
                },
            ],
            sessionUserIds: ['ghost', 'user-1'],
            joinedChallengeIds: {
                'user-1': ['challenge-1'],
                ghost: ['challenge-2'],
            },
            sessionDraft: {
                kind: 'auto',
                date: '2026-03-07',
                exerciseIds: ['S01'],
                userIds: ['ghost', 'user-1'],
                returnTab: 'home',
            },
        });

        const result = migrateAppState(state, APP_STATE_VERSION);

        expect(result.users).toEqual([
            expect.objectContaining({
                id: 'user-1',
                name: 'ゲスト',
                classLevel: '初級',
                fuwafuwaType: 0,
                fuwafuwaCycleCount: 1,
                fuwafuwaName: null,
                notifiedFuwafuwaStages: [1],
                dailyTargetMinutes: 10,
                excludedExercises: ['S01'],
                requiredExercises: ['S02'],
                consumedMagicSeconds: 0,
                avatarUrl: undefined,
                pastFuwafuwas: [
                    {
                        id: 'past-1',
                        name: 'もも',
                        type: 2,
                        activeDays: 7,
                        finalStage: 3,
                        sayonaraDate: '2026-03-01',
                    },
                ],
                chibifuwas: [
                    {
                        id: 'badge-1',
                        type: 1,
                        challengeTitle: 'はじめて',
                        earnedDate: '2026-03-02',
                    },
                ],
            }),
        ]);
        expect(result.sessionUserIds).toEqual(['user-1']);
        expect(result.joinedChallengeIds).toEqual({
            'user-1': ['challenge-1'],
        });
        expect(result.sessionDraft).toEqual({
            kind: 'auto',
            date: '2026-03-07',
            exerciseIds: ['S01'],
            userIds: ['user-1'],
            returnTab: 'home',
        });
    });

    it('is idempotent when re-run on the current app state version', () => {
        const state = makeCurrentState();
        const stateCopy = JSON.parse(JSON.stringify(state));

        const result = migrateAppState(stateCopy, APP_STATE_VERSION);

        expect(result.users).toEqual(state.users);
        expect(result.joinedChallengeIds).toEqual(state.joinedChallengeIds);
        expect(result.bgmEnabled).toBe(state.bgmEnabled);
        expect(result.hapticEnabled).toBe(state.hapticEnabled);
        expect(result.hasSeenSessionControlsHint).toBe(state.hasSeenSessionControlsHint);
        expect(result.dismissedHomeAnnouncementIds).toEqual(state.dismissedHomeAnnouncementIds);
        expect(result.sessionDraft).toBe(state.sessionDraft);
    });
});
