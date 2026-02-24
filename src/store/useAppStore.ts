import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClassLevel } from '../data/exercises';

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
}

type TabId = 'home' | 'record' | 'menu' | 'settings';

interface AppState {
    // Users
    users: UserProfileStore[];
    addUser: (user: Omit<UserProfileStore, 'id'>) => void;
    updateUser: (id: string, updates: Partial<UserProfileStore>) => void;
    deleteUser: (id: string) => void;
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

    // Advanced Customizations (persisted)
    dailyTargetMinutes: number;
    setDailyTargetMinutes: (minutes: number) => void;
    excludedExercises: string[];
    setExcludedExercises: (ids: string[]) => void;
    requiredExercises: string[];
    setRequiredExercises: (ids: string[]) => void;

    // Debug Overrides
    debugFuwafuwaStage: number | null;
    debugFuwafuwaType: number | null;
    setDebugFuwafuwaStage: (stage: number | null) => void;
    setDebugFuwafuwaType: (type: number | null) => void;

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
            addUser: (user) => set((state) => ({ users: [...state.users, { ...user, id: crypto.randomUUID() }] })),
            updateUser: (id, updates) => set((state) => ({
                users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
            })),
            deleteUser: (id) => set((state) => ({
                users: state.users.filter(u => u.id !== id),
                sessionUserIds: state.sessionUserIds.filter(userId => userId !== id),
            })),
            resetUserFuwafuwa: (id, newType, activeDays, finalStage) => set((state) => {
                const today = new Date().toISOString().split('T')[0];
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

            soundVolume: 0.5,
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

            dailyTargetMinutes: 10,
            setDailyTargetMinutes: (minutes) => set({ dailyTargetMinutes: minutes }),
            excludedExercises: [],
            setExcludedExercises: (ids) => set({ excludedExercises: ids }),
            requiredExercises: ['S01', 'S02', 'S07'], // Make Splits, Forward Fold & Point & Flex default MUST-DOs
            setRequiredExercises: (ids) => set({ requiredExercises: ids }),

            debugFuwafuwaStage: null,
            debugFuwafuwaType: null,
            setDebugFuwafuwaStage: (stage) => set({ debugFuwafuwaStage: stage }),
            setDebugFuwafuwaType: (type) => set({ debugFuwafuwaType: type }),

            activeMilestoneModal: null,
            setActiveMilestoneModal: (modal) => set({ activeMilestoneModal: modal })
        }),
        {
            name: 'keepgoing-app-state',
            version: 3, // Bumped to 3 for Multi-User migration
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migration: Ensure 'S07' (Point & Flex) is added to required exercises for existing users
                    if (persistedState.requiredExercises && !persistedState.requiredExercises.includes('S07')) {
                        persistedState.requiredExercises.push('S07');
                    }
                }
                if (version < 2) {
                    // Migration: Add BGM and haptic toggle defaults for existing users
                    persistedState.bgmEnabled = persistedState.bgmEnabled ?? true;
                    persistedState.hapticEnabled = persistedState.hapticEnabled ?? true;
                }
                if (version < 3) {
                    // Migration: Move single user data to users array
                    if (!persistedState.users || persistedState.users.length === 0) {
                        const legacyUser: UserProfileStore = {
                            id: crypto.randomUUID(),
                            name: persistedState.fuwafuwaName || 'ゲスト',
                            classLevel: persistedState.classLevel || '初級',
                            fuwafuwaBirthDate: persistedState.fuwafuwaBirthDate || new Date().toISOString().split('T')[0],
                            fuwafuwaType: persistedState.fuwafuwaType || Math.floor(Math.random() * 9),
                            fuwafuwaCycleCount: persistedState.fuwafuwaCycleCount || 1,
                            fuwafuwaName: persistedState.fuwafuwaName || null,
                            pastFuwafuwas: persistedState.pastFuwafuwas || [],
                            notifiedFuwafuwaStages: persistedState.notifiedFuwafuwaStages || []
                        };
                        persistedState.users = [legacyUser];
                        persistedState.sessionUserIds = [legacyUser.id];
                    }

                    // Cleanup legacy root properties if desired (Zustand will ignore them anyway based on partialize, 
                    // but we can explicitly delete them)
                    delete persistedState.classLevel;
                    delete persistedState.fuwafuwaBirthDate;
                    delete persistedState.fuwafuwaType;
                    delete persistedState.fuwafuwaCycleCount;
                    delete persistedState.fuwafuwaName;
                    delete persistedState.pastFuwafuwas;
                    delete persistedState.notifiedFuwafuwaStages;
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
                dailyTargetMinutes: state.dailyTargetMinutes,
                excludedExercises: state.excludedExercises,
                requiredExercises: state.requiredExercises,
            }),
        }
    )
);
