import type { StateCreator } from 'zustand';
import { getTodayKey } from '../../lib/db';
import type { AppState, PastFuwafuwaRecord } from './types';

export const createAppState: StateCreator<AppState, [], [], AppState> = (set, get) => ({
    users: [],
    sessionUserIds: [],
    setSessionUserIds: (ids) => set({ sessionUserIds: ids }),
    addUser: (user) => set((state) => ({
        users: [
            ...state.users,
            {
                ...user,
                id: crypto.randomUUID(),
                dailyTargetMinutes: 10,
                excludedExercises: [],
                requiredExercises: [],
                chibifuwas: [],
            },
        ],
    })),
    updateUser: (id, updates) => set((state) => ({
        users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
    })),
    updateUserSettings: (id, updates) => set((state) => ({
        users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
    })),
    deleteUser: (id) => set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        sessionUserIds: state.sessionUserIds.filter((userId) => userId !== id),
    })),
    consumeUserMagicEnergy: (id, seconds) => set((state) => ({
        users: state.users.map((user) => {
            if (user.id !== id) return user;
            return {
                ...user,
                consumedMagicSeconds: (user.consumedMagicSeconds || 0) + seconds,
            };
        }),
    })),
    addChibifuwa: (userId, record) => set((state) => ({
        users: state.users.map((user) => (
            user.id === userId
                ? { ...user, chibifuwas: [...(user.chibifuwas || []), { ...record, id: crypto.randomUUID() }] }
                : user
        )),
    })),
    resetUserFuwafuwa: (id, newType, activeDays, finalStage) => set((state) => {
        const today = getTodayKey();
        return {
            users: state.users.map((user) => {
                if (user.id !== id) return user;

                const record: PastFuwafuwaRecord = {
                    id: crypto.randomUUID(),
                    name: user.fuwafuwaName,
                    type: user.fuwafuwaType,
                    activeDays,
                    finalStage,
                    sayonaraDate: today,
                };

                return {
                    ...user,
                    fuwafuwaBirthDate: today,
                    fuwafuwaType: newType,
                    fuwafuwaCycleCount: user.fuwafuwaCycleCount + 1,
                    fuwafuwaName: null,
                    pastFuwafuwas: [...(user.pastFuwafuwas || []), record],
                    notifiedFuwafuwaStages: [],
                };
            }),
        };
    }),

    currentTab: 'home',
    previousTab: 'home',
    setTab: (tab) => {
        const previousTab = get().currentTab;
        set({ currentTab: tab, previousTab });
    },

    isInSession: false,
    sessionExerciseIds: null,
    isTeacherPreview: false,
    startSession: () => set({ isInSession: true, sessionExerciseIds: null, isTeacherPreview: false }),
    startSessionWithExercises: (ids) => set({ isInSession: true, sessionExerciseIds: ids, isTeacherPreview: false }),
    startTeacherPreviewSession: (ids) => set({ isInSession: true, sessionExerciseIds: ids, isTeacherPreview: true }),
    endSession: () => set({ isInSession: false, sessionExerciseIds: null, isTeacherPreview: false }),

    onboardingCompleted: false,
    setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
    soundVolume: 1.0,
    setSoundVolume: (soundVolume) => set({ soundVolume }),
    ttsEnabled: true,
    setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
    bgmEnabled: true,
    setBgmEnabled: (bgmEnabled) => set({ bgmEnabled }),
    hapticEnabled: true,
    setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
    notificationsEnabled: false,
    setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
    notificationTime: '21:00',
    setNotificationTime: (notificationTime) => set({ notificationTime }),

    debugFuwafuwaStage: null,
    debugFuwafuwaType: null,
    debugActiveDays: null,
    debugFuwafuwaScale: null,
    setDebugFuwafuwaStage: (debugFuwafuwaStage) => set({ debugFuwafuwaStage }),
    setDebugFuwafuwaType: (debugFuwafuwaType) => set({ debugFuwafuwaType }),
    setDebugActiveDays: (debugActiveDays) => set({ debugActiveDays }),
    setDebugFuwafuwaScale: (debugFuwafuwaScale) => set({ debugFuwafuwaScale }),

    activeMilestoneModal: null,
    setActiveMilestoneModal: (activeMilestoneModal) => set({ activeMilestoneModal }),

    joinedChallengeIds: {},
    joinChallenge: (userId, challengeId) => set((state) => {
        const joinedForUser = state.joinedChallengeIds[userId] || [];
        if (joinedForUser.includes(challengeId)) {
            return state;
        }

        return {
            joinedChallengeIds: {
                ...state.joinedChallengeIds,
                [userId]: [...joinedForUser, challengeId],
            },
        };
    }),
});
