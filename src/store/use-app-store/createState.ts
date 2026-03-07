import type { StateCreator } from 'zustand';
import { getTodayKey } from '../../lib/db';
import type { AppState, PastFuwafuwaRecord, SessionDraft, TabId } from './types';

function hasSameUsers(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const aSet = new Set(a);
    return b.every((id) => aSet.has(id));
}

function resolveSessionReturnTab(currentTab: TabId, sessionReturnTab: TabId): { currentTab: TabId; previousTab: TabId } {
    if (currentTab === sessionReturnTab) {
        return { currentTab, previousTab: currentTab };
    }

    return {
        currentTab: sessionReturnTab,
        previousTab: currentTab,
    };
}

function getResumableSessionDraft(
    sessionDraft: SessionDraft | null,
    sessionUserIds: string[],
): SessionDraft | null {
    if (!sessionDraft) return null;
    if (sessionDraft.date !== getTodayKey()) return null;
    if (sessionDraft.exerciseIds.length === 0) return null;
    if (!hasSameUsers(sessionDraft.userIds, sessionUserIds)) return null;
    return sessionDraft;
}

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
    sessionReturnTab: 'home',
    sessionDraft: null,
    setSessionDraft: (sessionDraft) => set({ sessionDraft }),
    isTeacherPreview: false,
    startSession: () => set((state) => {
        const resumableDraft = getResumableSessionDraft(state.sessionDraft, state.sessionUserIds);
        return {
            isInSession: true,
            sessionExerciseIds: resumableDraft?.exerciseIds ?? null,
            sessionReturnTab: resumableDraft?.returnTab ?? state.currentTab,
            isTeacherPreview: false,
        };
    }),
    startSessionWithExercises: (ids) => set((state) => ({
        isInSession: true,
        sessionExerciseIds: ids,
        sessionReturnTab: 'home',
        sessionDraft: {
            date: getTodayKey(),
            exerciseIds: ids,
            userIds: [...state.sessionUserIds],
            returnTab: 'home',
        },
        isTeacherPreview: false,
    })),
    startTeacherPreviewSession: (ids) => set((state) => ({
        isInSession: true,
        sessionExerciseIds: ids,
        sessionReturnTab: state.currentTab,
        isTeacherPreview: true,
    })),
    endSession: () => set({ isInSession: false, sessionExerciseIds: null, isTeacherPreview: false }),
    completeSession: () => set((state) => ({
        ...resolveSessionReturnTab(state.currentTab, state.sessionReturnTab),
        isInSession: false,
        sessionExerciseIds: null,
        isTeacherPreview: false,
    })),

    onboardingCompleted: false,
    setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
    soundVolume: 1.0,
    setSoundVolume: (soundVolume) => set({ soundVolume }),
    ttsEnabled: true,
    setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
    ttsRate: 0.95,
    setTtsRate: (ttsRate) => set({ ttsRate }),
    ttsPitch: 1.05,
    setTtsPitch: (ttsPitch) => set({ ttsPitch }),
    bgmEnabled: true,
    setBgmEnabled: (bgmEnabled) => set({ bgmEnabled }),
    hapticEnabled: true,
    setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
    notificationsEnabled: false,
    setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
    notificationTime: '21:00',
    setNotificationTime: (notificationTime) => set({ notificationTime }),
    hasSeenSessionControlsHint: false,
    setHasSeenSessionControlsHint: (hasSeenSessionControlsHint) => set({ hasSeenSessionControlsHint }),

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
