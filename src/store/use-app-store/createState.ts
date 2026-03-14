import type { StateCreator } from 'zustand';
import { getTodayKey } from '../../lib/db';
import { getFamilyVisitMemoryKey } from '../../pages/home/homeVisitMemory';
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
    if (sessionDraft.kind !== 'auto') return null;
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
                challengeStars: 0,
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
        joinedChallengeIds: Object.fromEntries(
            Object.entries(state.joinedChallengeIds).filter(([userId]) => userId !== id),
        ),
        challengeEnrollmentWindows: Object.fromEntries(
            Object.entries(state.challengeEnrollmentWindows).filter(([userId]) => userId !== id),
        ),
        homeVisitMemory: {
            soloByUserId: Object.fromEntries(
                Object.entries(state.homeVisitMemory.soloByUserId).filter(([userId]) => userId !== id),
            ),
            familyByUserSet: Object.fromEntries(
                Object.entries(state.homeVisitMemory.familyByUserSet).filter(([key]) => !key.split('|').includes(id)),
            ),
        },
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
    addChallengeStars: (userId, amount) => set((state) => ({
        users: state.users.map((user) => (
            user.id === userId
                ? { ...user, challengeStars: Math.max(0, (user.challengeStars ?? 0) + amount) }
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
    menuOpenIntent: null,
    openMenuWithIntent: (intent) => set({
        menuOpenIntent: {
            tab: intent.tab,
            placement: intent.placement ?? null,
            requestId: Date.now(),
        },
    }),
    clearMenuOpenIntent: () => set({ menuOpenIntent: null }),

    isInSession: false,
    sessionExerciseIds: null,
    sessionSourceMenuId: null,
    sessionSourceMenuSource: null,
    sessionSourceMenuName: null,
    sessionHybridMode: false,
    sessionReturnTab: 'home',
    sessionDraft: null,
    sessionKind: null,
    setSessionDraft: (sessionDraft) => set({ sessionDraft }),
    isTeacherPreview: false,
    startSession: () => set((state) => {
        const resumableDraft = getResumableSessionDraft(state.sessionDraft, state.sessionUserIds);
        return {
            isInSession: true,
            sessionExerciseIds: resumableDraft?.exerciseIds ?? null,
            sessionSourceMenuId: resumableDraft?.sourceMenuId ?? null,
            sessionSourceMenuSource: resumableDraft?.sourceMenuSource ?? null,
            sessionSourceMenuName: resumableDraft?.sourceMenuName ?? null,
            sessionReturnTab: resumableDraft?.returnTab ?? state.currentTab,
            sessionKind: 'auto' as const,
            isTeacherPreview: false,
        };
    }),
    startSessionWithExercises: (ids, options) => set(() => ({
        isInSession: true,
        sessionExerciseIds: ids,
        sessionSourceMenuId: options?.sourceMenuId ?? null,
        sessionSourceMenuSource: options?.sourceMenuSource ?? null,
        sessionSourceMenuName: options?.sourceMenuName ?? null,
        sessionReturnTab: options?.returnTab ?? 'home',
        sessionKind: 'fixed' as const,
        isTeacherPreview: false,
    })),
    startHybridSession: (requiredIds) => set((state) => ({
        isInSession: true,
        sessionExerciseIds: requiredIds,
        sessionSourceMenuId: null,
        sessionSourceMenuSource: null,
        sessionSourceMenuName: null,
        sessionHybridMode: true,
        sessionReturnTab: state.currentTab,
        sessionKind: 'hybrid' as const,
        isTeacherPreview: false,
    })),
    startTeacherPreviewSession: (ids) => set((state) => ({
        isInSession: true,
        sessionExerciseIds: ids,
        sessionSourceMenuId: null,
        sessionSourceMenuSource: null,
        sessionSourceMenuName: null,
        sessionReturnTab: state.currentTab,
        sessionKind: 'teacher-preview' as const,
        isTeacherPreview: true,
    })),
    endSession: () => set({
        isInSession: false,
        sessionExerciseIds: null,
        sessionSourceMenuId: null,
        sessionSourceMenuSource: null,
        sessionSourceMenuName: null,
        sessionHybridMode: false,
        sessionKind: null,
        isTeacherPreview: false,
    }),
    completeSession: () => set((state) => ({
        ...resolveSessionReturnTab(state.currentTab, state.sessionReturnTab),
        isInSession: false,
        sessionExerciseIds: null,
        sessionSourceMenuId: null,
        sessionSourceMenuSource: null,
        sessionSourceMenuName: null,
        sessionHybridMode: false,
        sessionDraft: state.sessionKind === 'auto' ? null : state.sessionDraft,
        sessionKind: null,
        isTeacherPreview: false,
    })),

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
    hasSeenSessionControlsHint: false,
    setHasSeenSessionControlsHint: (hasSeenSessionControlsHint) => set({ hasSeenSessionControlsHint }),
    dismissedHomeAnnouncementIds: [],
    dismissHomeAnnouncement: (announcementId) => set((state) => {
        if (!announcementId || state.dismissedHomeAnnouncementIds.includes(announcementId)) {
            return state;
        }

        return {
            dismissedHomeAnnouncementIds: [...state.dismissedHomeAnnouncementIds, announcementId],
        };
    }),
    homeVisitMemory: {
        soloByUserId: {},
        familyByUserSet: {},
    },
    markSoloHomeVisit: (userId, visitedAt) => set((state) => {
        if (!userId || !visitedAt) {
            return state;
        }

        if (state.homeVisitMemory.soloByUserId[userId] === visitedAt) {
            return state;
        }

        return {
            homeVisitMemory: {
                ...state.homeVisitMemory,
                soloByUserId: {
                    ...state.homeVisitMemory.soloByUserId,
                    [userId]: visitedAt,
                },
            },
        };
    }),
    markFamilyHomeVisit: (userIds, visitedAt) => set((state) => {
        const key = getFamilyVisitMemoryKey(userIds);
        if (!key || !visitedAt) {
            return state;
        }

        if (state.homeVisitMemory.familyByUserSet[key] === visitedAt) {
            return state;
        }

        return {
            homeVisitMemory: {
                ...state.homeVisitMemory,
                familyByUserSet: {
                    ...state.homeVisitMemory.familyByUserSet,
                    [key]: visitedAt,
                },
            },
        };
    }),

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
    challengeEnrollmentWindows: {},
    hydrateChallengeEnrollmentState: (joinedChallengeIds, challengeEnrollmentWindows) => set({
        joinedChallengeIds,
        challengeEnrollmentWindows,
    }),
    joinChallenge: (userId, challengeId, effectiveWindow) => set((state) => {
        const joinedForUser = state.joinedChallengeIds[userId] || [];
        if (joinedForUser.includes(challengeId)) {
            return state;
        }

        return {
            joinedChallengeIds: {
                ...state.joinedChallengeIds,
                [userId]: [...joinedForUser, challengeId],
            },
            challengeEnrollmentWindows: effectiveWindow ? {
                ...state.challengeEnrollmentWindows,
                [userId]: {
                    ...(state.challengeEnrollmentWindows[userId] ?? {}),
                    [challengeId]: effectiveWindow,
                },
            } : state.challengeEnrollmentWindows,
        };
    }),
});
