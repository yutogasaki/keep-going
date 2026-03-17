import { DEFAULT_BGM_TRACK_ID } from '../../../lib/bgmTracks';
import type { PersistedAppStateRecord } from '../migrateHelpers';

export function makeV0State(overrides: PersistedAppStateRecord = {}) {
    return {
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
        fuwafuwaType: 3,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: 'テスト',
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        requiredExercises: ['S01', 'S02'],
        excludedExercises: [],
        dailyTargetMinutes: 10,
        onboardingCompleted: true,
        soundVolume: 1.0,
        ttsEnabled: true,
        bgmEnabled: true,
        bgmVolume: 0.35,
        bgmTrackId: DEFAULT_BGM_TRACK_ID,
        ...overrides,
    };
}

export function makeV5State(overrides: PersistedAppStateRecord = {}) {
    return {
        users: [{
            id: 'user-1',
            name: 'テスト',
            classLevel: '初級',
            fuwafuwaBirthDate: '2026-03-01',
            fuwafuwaType: 3,
            fuwafuwaCycleCount: 1,
            fuwafuwaName: 'テスト',
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: [],
            dailyTargetMinutes: 10,
            excludedExercises: ['C01', 'C02'],
            requiredExercises: ['S01', 'S02', 'S07'],
            consumedMagicSeconds: 0,
            challengeStars: 0,
        }],
        sessionUserIds: ['user-1'],
        onboardingCompleted: true,
        soundVolume: 1.0,
        ttsEnabled: true,
        bgmEnabled: true,
        bgmVolume: 0.35,
        bgmTrackId: DEFAULT_BGM_TRACK_ID,
        hapticEnabled: true,
        dismissedHomeAnnouncementIds: [],
        challengeEnrollmentWindows: {},
        ...overrides,
    };
}

export function makeCurrentState(overrides: PersistedAppStateRecord = {}) {
    return {
        users: [{
            id: 'user-1',
            name: 'テスト',
            classLevel: '初級',
            fuwafuwaBirthDate: '2026-03-01',
            fuwafuwaType: 3,
            fuwafuwaCycleCount: 1,
            fuwafuwaName: 'テスト',
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: [],
            dailyTargetMinutes: 10,
            excludedExercises: [],
            requiredExercises: [],
            consumedMagicSeconds: 0,
            challengeStars: 0,
            chibifuwas: [],
        }],
        sessionUserIds: ['user-1'],
        onboardingCompleted: true,
        soundVolume: 1.0,
        ttsEnabled: true,
        bgmEnabled: true,
        bgmVolume: 0.35,
        bgmTrackId: DEFAULT_BGM_TRACK_ID,
        hapticEnabled: true,
        notificationsEnabled: false,
        notificationTime: '21:00',
        joinedChallengeIds: {},
        challengeEnrollmentWindows: {},
        hasSeenSessionControlsHint: false,
        dismissedHomeAnnouncementIds: [],
        debugFuwafuwaStage: null,
        debugFuwafuwaType: null,
        debugActiveDays: null,
        debugFuwafuwaScale: null,
        homeVisitMemory: {
            soloByUserId: {},
            familyByUserSet: {},
        },
        sessionDraft: null,
        ...overrides,
    };
}
