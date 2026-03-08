import { describe, expect, it } from 'vitest';
import { buildMergedSettingsState, buildRestoredStoreState } from '../pullStoreState';
import type { UserProfileStore } from '../../../store/useAppStore';

function createUser(id: string): UserProfileStore {
    return {
        id,
        name: `user-${id}`,
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
        fuwafuwaType: 1,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: null,
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 10,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        chibifuwas: [],
    };
}

describe('pull store state helpers', () => {
    it('keeps valid selected users and filters joined challenges to restored users', () => {
        const state = buildRestoredStoreState({
            localState: {
                sessionUserIds: ['u2', 'ghost'],
                joinedChallengeIds: {
                    u1: ['challenge-a'],
                    ghost: ['challenge-b'],
                },
                soundVolume: 0.5,
            },
            users: [createUser('u1'), createUser('u2')],
            settings: {
                onboarding_completed: true,
                sound_volume: 0.8,
                tts_enabled: false,
                bgm_enabled: true,
                haptic_enabled: true,
                notifications_enabled: false,
                notification_time: '20:30',
            } as never,
        });

        expect(state.sessionUserIds).toEqual(['u2']);
        expect(state.joinedChallengeIds).toEqual({
            u1: ['challenge-a'],
        });
        expect(state.onboardingCompleted).toBe(true);
        expect(state.soundVolume).toBe(0.8);
    });

    it('falls back to the first restored user when prior selection is invalid', () => {
        const state = buildRestoredStoreState({
            localState: {
                sessionUserIds: ['ghost'],
            },
            users: [createUser('u1'), createUser('u2')],
            settings: null,
        });

        expect(state.sessionUserIds).toEqual(['u1']);
        expect(state.onboardingCompleted).toBe(true);
    });

    it('clears onboarding and selection when cloud restore has no users', () => {
        const state = buildRestoredStoreState({
            localState: {
                sessionUserIds: ['u1'],
                onboardingCompleted: true,
                ttsEnabled: false,
            },
            users: [],
            settings: {
                onboarding_completed: true,
                sound_volume: 0.9,
                tts_enabled: true,
                bgm_enabled: true,
                haptic_enabled: true,
                notifications_enabled: true,
                notification_time: '19:00',
            } as never,
        });

        expect(state.sessionUserIds).toEqual([]);
        expect(state.joinedChallengeIds).toEqual({});
        expect(state.onboardingCompleted).toBe(false);
        expect(state.ttsEnabled).toBe(true);
    });

    it('sanitizes malformed cloud settings and deduplicates restored selection data', () => {
        const state = buildRestoredStoreState({
            localState: {
                sessionUserIds: ['u2', 'u2', 'ghost'],
                joinedChallengeIds: {
                    u1: ['challenge-a', 'challenge-a', 3],
                    u2: ['challenge-b', null],
                    ghost: ['challenge-c'],
                },
                onboardingCompleted: true,
                soundVolume: 0.4,
                ttsEnabled: false,
                bgmEnabled: false,
                hapticEnabled: true,
                notificationsEnabled: true,
                notificationTime: '20:30',
            },
            users: [createUser('u1'), createUser('u2')],
            settings: {
                onboarding_completed: 'broken',
                sound_volume: 'too-loud',
                tts_enabled: 'broken',
                bgm_enabled: null,
                haptic_enabled: false,
                notifications_enabled: 'broken',
                notification_time: '99:99',
            } as never,
        });

        expect(state.sessionUserIds).toEqual(['u2']);
        expect(state.joinedChallengeIds).toEqual({
            u1: ['challenge-a'],
            u2: ['challenge-b'],
        });
        expect(state.onboardingCompleted).toBe(true);
        expect(state.soundVolume).toBe(0.4);
        expect(state.ttsEnabled).toBe(false);
        expect(state.bgmEnabled).toBe(false);
        expect(state.hapticEnabled).toBe(false);
        expect(state.notificationsEnabled).toBe(true);
        expect(state.notificationTime).toBe('20:30');
    });

    it('sanitizes merged settings while keeping local fallbacks for malformed cloud values', () => {
        const state = buildMergedSettingsState(
            {
                onboardingCompleted: false,
                soundVolume: 0.35,
                ttsEnabled: false,
                bgmEnabled: false,
                hapticEnabled: true,
                notificationsEnabled: true,
                notificationTime: '20:15',
            },
            {
                onboarding_completed: 'broken',
                sound_volume: 1.4,
                tts_enabled: 'broken',
                bgm_enabled: undefined,
                haptic_enabled: false,
                notifications_enabled: 'broken',
                notification_time: '25:00',
            } as never,
        );

        expect(state).toEqual({
            onboardingCompleted: false,
            soundVolume: 1,
            ttsEnabled: false,
            bgmEnabled: false,
            hapticEnabled: false,
            notificationsEnabled: true,
            notificationTime: '20:15',
        });
    });
});
