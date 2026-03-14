export function makeV0State(overrides: Record<string, any> = {}) {
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
        ...overrides,
    };
}

export function makeV5State(overrides: Record<string, any> = {}) {
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
        hapticEnabled: true,
        dismissedHomeAnnouncementIds: [],
        challengeEnrollmentWindows: {},
        ...overrides,
    };
}

export function makeCurrentState(overrides: Record<string, any> = {}) {
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
        hapticEnabled: true,
        joinedChallengeIds: {},
        challengeEnrollmentWindows: {},
        hasSeenSessionControlsHint: false,
        dismissedHomeAnnouncementIds: [],
        homeVisitMemory: {
            soloByUserId: {},
            familyByUserSet: {},
        },
        sessionDraft: null,
        ...overrides,
    };
}
