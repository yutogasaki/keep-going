import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClassLevel } from '../data/exercises';
import { getTodayKey } from '../lib/db';

export interface PastFuwafuwaRecord {
    id: string; // unique ID
    name: string | null;
    type: number;
    activeDays: number;
    finalStage: number; // 3 implies Adult
    sayonaraDate: string;
}

export interface UserProfileStore {
    id: string;
    name: string;
    classLevel: ClassLevel;
    fuwafuwaBirthDate: string;
    fuwafuwaType: number;
    fuwafuwaCycleCount: number;
    fuwafuwaName: string | null;
    pastFuwafuwas: PastFuwafuwaRecord[];
    notifiedFuwafuwaStages: number[];
    // Auto Menu Settings
    dailyTargetMinutes: number;
    excludedExercises: string[];
    requiredExercises: string[];
    // Tank Reset state
    consumedMagicDate?: string;
    consumedMagicSeconds?: number;
}

type TabId = 'home' | 'record' | 'menu' | 'settings';

interface AppState {
    // Users
    users: UserProfileStore[];
    addUser: (user: Omit<UserProfileStore, 'id' | 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>) => void;
    updateUser: (id: string, updates: Partial<UserProfileStore>) => void;
    deleteUser: (id: string) => void;
    // user-specific update helpers
    updateUserSettings: (id: string, updates: Partial<Pick<UserProfileStore, 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>>) => void;
    consumeUserMagicEnergy: (id: string, seconds: number, date: string) => void;
    resetUserFuwafuwa: (id: string, newType: number, activeDays: number, finalStage: number) => void;

    // Navigation
    currentTab: TabId;
    previousTab: TabId;
    setTab: (tab: TabId) => void;

    // Session state
    sessionUserIds: string[]; // Who is actually about to train (based on HomeScreen swipe)
    setSessionUserIds: (ids: string[]) => void;
    isInSession: boolean;
    sessionReturnedFromTab: boolean; // flag: user came back from another tab
    sessionExerciseIds: string[] | null; // null = auto-generate
    startSession: () => void;
    startSessionWithExercises: (ids: string[]) => void;
    endSession: () => void;

    // App State (persisted)
    onboardingCompleted: boolean;
    setOnboardingCompleted: (completed: boolean) => void;
    hasSeenMenuTip: boolean;
    setHasSeenMenuTip: (seen: boolean) => void;

    // Settings (persisted)
    soundVolume: number;
    setSoundVolume: (vol: number) => void;
    ttsEnabled: boolean;
    setTtsEnabled: (enabled: boolean) => void;
    bgmEnabled: boolean;
    setBgmEnabled: (enabled: boolean) => void;
    hapticEnabled: boolean;
    setHapticEnabled: (enabled: boolean) => void;
    notificationsEnabled: boolean;
    setNotificationsEnabled: (enabled: boolean) => void;
    notificationTime: string;
    setNotificationTime: (time: string) => void;

    // Note: Advanced Customizations (dailyTargetMinutes, excludedExercises, requiredExercises) are now per-user in UserProfileStore.

    // Debug Overrides
    debugFuwafuwaStage: number | null;
    debugFuwafuwaType: number | null;
    debugActiveDays: number | null;
    debugFuwafuwaScale: number | null;
    setDebugFuwafuwaStage: (stage: number | null) => void;
    setDebugFuwafuwaType: (type: number | null) => void;
    setDebugActiveDays: (days: number | null) => void;
    setDebugFuwafuwaScale: (scale: number | null) => void;

    // Milestones
    activeMilestoneModal: 'egg' | 'fairy' | 'adult' | null;
    setActiveMilestoneModal: (modal: 'egg' | 'fairy' | 'adult' | null) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            users: [],
            sessionUserIds: [],
            setSessionUserIds: (ids) => set({ sessionUserIds: ids }),
            addUser: (user) => set((state) => ({
                users: [...state.users, {
                    ...user,
                    id: crypto.randomUUID(),
                    dailyTargetMinutes: 10,
                    excludedExercises: ['C01', 'C02'],
                    requiredExercises: ['S01', 'S02', 'S07']
                }]
            })),
            updateUser: (id, updates) => set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
            })),
            updateUserSettings: (id, updates) => set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
            })),
            deleteUser: (id) => set((state) => ({
                users: state.users.filter(u => u.id !== id),
                sessionUserIds: state.sessionUserIds.filter(userId => userId !== id),
            })),
            consumeUserMagicEnergy: (id, seconds, date) => set((state) => ({
                users: state.users.map(u => {
                    if (u.id !== id) return u;
                    const prevSeconds = u.consumedMagicDate === date ? (u.consumedMagicSeconds || 0) : 0;
                    return { ...u, consumedMagicDate: date, consumedMagicSeconds: prevSeconds + seconds };
                })
            })),
            resetUserFuwafuwa: (id, newType, activeDays, finalStage) => set((state) => {
                const today = getTodayKey();
                return {
                    users: state.users.map(u => {
                        if (u.id !== id) return u;
                        const record: PastFuwafuwaRecord = {
                            id: crypto.randomUUID(),
                            name: u.fuwafuwaName,
                            type: u.fuwafuwaType,
                            activeDays,
                            finalStage,
                            sayonaraDate: today
                        };
                        return {
                            ...u,
                            fuwafuwaBirthDate: today,
                            fuwafuwaType: newType,
                            fuwafuwaCycleCount: u.fuwafuwaCycleCount + 1,
                            fuwafuwaName: null,
                            pastFuwafuwas: [...(u.pastFuwafuwas || []), record],
                            notifiedFuwafuwaStages: []
                        };
                    })
                };
            }),

            currentTab: 'home',
            previousTab: 'home',
            setTab: (tab) => {
                const prev = get().currentTab;
                set({ currentTab: tab, previousTab: prev });
            },

            isInSession: false,
            sessionReturnedFromTab: false,
            sessionExerciseIds: null,
            startSession: () => set({ isInSession: true, sessionReturnedFromTab: false, sessionExerciseIds: null }),
            startSessionWithExercises: (ids) => set({ isInSession: true, sessionReturnedFromTab: false, sessionExerciseIds: ids }),
            endSession: () => set({ isInSession: false, sessionReturnedFromTab: false, sessionExerciseIds: null }),

            onboardingCompleted: false,
            setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
            hasSeenMenuTip: false,
            setHasSeenMenuTip: (seen) => set({ hasSeenMenuTip: seen }),

            soundVolume: 1.0,
            setSoundVolume: (vol) => set({ soundVolume: vol }),
            ttsEnabled: true,
            setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
            bgmEnabled: true,
            setBgmEnabled: (enabled) => set({ bgmEnabled: enabled }),
            hapticEnabled: true,
            setHapticEnabled: (enabled) => set({ hapticEnabled: enabled }),
            notificationsEnabled: false,
            setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
            notificationTime: '21:00',
            setNotificationTime: (time) => set({ notificationTime: time }),

            debugFuwafuwaStage: null,
            debugFuwafuwaType: null,
            debugActiveDays: null,
            debugFuwafuwaScale: null,
            setDebugFuwafuwaStage: (stage) => set({ debugFuwafuwaStage: stage }),
            setDebugFuwafuwaType: (type) => set({ debugFuwafuwaType: type }),
            setDebugActiveDays: (days) => set({ debugActiveDays: days }),
            setDebugFuwafuwaScale: (scale) => set({ debugFuwafuwaScale: scale }),

            activeMilestoneModal: null,
            setActiveMilestoneModal: (modal) => set({ activeMilestoneModal: modal })
        }),
        {
            name: 'keepgoing-app-state',
            version: 6, // Bumped to 6 for consumedMagicSeconds
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    if (persistedState.requiredExercises && !persistedState.requiredExercises.includes('S07')) {
                        persistedState.requiredExercises.push('S07');
                    }
                }
                if (version < 2) {
                    persistedState.bgmEnabled = persistedState.bgmEnabled ?? true;
                    persistedState.hapticEnabled = persistedState.hapticEnabled ?? true;
                }
                if (version < 3) {
                    if (!persistedState.users || persistedState.users.length === 0) {
                        const legacyUser: any = {
                            id: crypto.randomUUID(),
                            name: persistedState.fuwafuwaName || 'ゲスト',
                            classLevel: persistedState.classLevel || '初級',
                            fuwafuwaBirthDate: persistedState.fuwafuwaBirthDate || getTodayKey(),
                            fuwafuwaType: persistedState.fuwafuwaType || Math.floor(Math.random() * 10),
                            fuwafuwaCycleCount: persistedState.fuwafuwaCycleCount || 1,
                            fuwafuwaName: persistedState.fuwafuwaName || null,
                            pastFuwafuwas: persistedState.pastFuwafuwas || [],
                            notifiedFuwafuwaStages: persistedState.notifiedFuwafuwaStages || []
                        };
                        persistedState.users = [legacyUser];
                        persistedState.sessionUserIds = [legacyUser.id];
                    }
                    delete persistedState.classLevel;
                    delete persistedState.fuwafuwaBirthDate;
                    delete persistedState.fuwafuwaType;
                    delete persistedState.fuwafuwaCycleCount;
                    delete persistedState.fuwafuwaName;
                    delete persistedState.pastFuwafuwas;
                    delete persistedState.notifiedFuwafuwaStages;
                }
                if (version < 4) {
                    if (!persistedState.excludedExercises || persistedState.excludedExercises.length === 0) {
                        persistedState.excludedExercises = ['C01', 'C02'];
                    }
                }
                if (version < 5) {
                    // Migration: Move global dailyTargetMinutes, excludedExercises, requiredExercises to individual users
                    const globalTarget = persistedState.dailyTargetMinutes ?? 10;
                    const globalExcluded = persistedState.excludedExercises ?? ['C01', 'C02'];
                    const globalRequired = persistedState.requiredExercises ?? ['S01', 'S02', 'S07'];

                    if (persistedState.users && Array.isArray(persistedState.users)) {
                        persistedState.users = persistedState.users.map((u: any, index: number) => {
                            // Assign global settings to the first user. For others, give defaults.
                            if (index === 0) {
                                return {
                                    ...u,
                                    dailyTargetMinutes: u.dailyTargetMinutes ?? globalTarget,
                                    excludedExercises: u.excludedExercises ?? globalExcluded,
                                    requiredExercises: u.requiredExercises ?? globalRequired,
                                };
                            } else {
                                return {
                                    ...u,
                                    dailyTargetMinutes: u.dailyTargetMinutes ?? 10,
                                    excludedExercises: u.excludedExercises ?? ['C01', 'C02'],
                                    requiredExercises: u.requiredExercises ?? ['S01', 'S02', 'S07'],
                                };
                            }
                        });
                    }

                    delete persistedState.dailyTargetMinutes;
                    delete persistedState.excludedExercises;
                    delete persistedState.requiredExercises;
                }
                if (version < 6) {
                    if (persistedState.users && Array.isArray(persistedState.users)) {
                        persistedState.users = persistedState.users.map((u: any) => ({
                            ...u,
                            consumedMagicDate: u.consumedMagicDate || '',
                            consumedMagicSeconds: u.consumedMagicSeconds || 0,
                        }));
                    }
                }
                return persistedState as AppState;
            },
            partialize: (state) => ({
                users: state.users,
                onboardingCompleted: state.onboardingCompleted,
                soundVolume: state.soundVolume,
                ttsEnabled: state.ttsEnabled,
                bgmEnabled: state.bgmEnabled,
                hapticEnabled: state.hapticEnabled,
                notificationsEnabled: state.notificationsEnabled,
                notificationTime: state.notificationTime,
            }),
        }
    )
);
