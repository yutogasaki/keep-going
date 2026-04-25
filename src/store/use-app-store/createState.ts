import type { StateCreator } from 'zustand';
import { DEFAULT_BGM_TRACK_ID } from '../../lib/bgmTracks';
import { getTodayKey } from '../../lib/db';
import { getFamilyVisitMemoryKey } from '../../pages/home/homeVisitMemory';
import { createSessionState } from './createSessionState';
import type { AppState, PastFuwafuwaRecord } from './types';

export const createAppState: StateCreator<AppState, [], [], AppState> = (set, get) => ({
    users: [],
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

    ...createSessionState(set),

    onboardingCompleted: false,
    setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
    soundVolume: 1.0,
    setSoundVolume: (soundVolume) => set({ soundVolume }),
    ttsEnabled: true,
    setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
    bgmEnabled: true,
    setBgmEnabled: (bgmEnabled) => set({ bgmEnabled }),
    bgmVolume: 0.3,
    setBgmVolume: (bgmVolume) => set({ bgmVolume }),
    bgmTrackId: DEFAULT_BGM_TRACK_ID,
    setBgmTrackId: (bgmTrackId) => set({ bgmTrackId }),
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
        const alreadyJoined = joinedForUser.includes(challengeId);

        if (alreadyJoined && !effectiveWindow) {
            return state;
        }

        return {
            joinedChallengeIds: {
                ...state.joinedChallengeIds,
                [userId]: alreadyJoined ? joinedForUser : [...joinedForUser, challengeId],
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
