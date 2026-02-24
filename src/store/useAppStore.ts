import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ClassLevel } from '../data/exercises';

type TabId = 'home' | 'record' | 'menu' | 'settings';

interface AppState {
    // Navigation
    currentTab: TabId;
    previousTab: TabId;
    setTab: (tab: TabId) => void;

    // Session state
    isInSession: boolean;
    sessionReturnedFromTab: boolean; // flag: user came back from another tab
    sessionExerciseIds: string[] | null; // null = auto-generate
    startSession: () => void;
    startSessionWithExercises: (ids: string[]) => void;
    endSession: () => void;

    // Class level (persisted)
    classLevel: ClassLevel;
    setClassLevel: (level: ClassLevel) => void;

    // App State (persisted)
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => void;

    // Settings (persisted)
    soundVolume: number;
    setSoundVolume: (vol: number) => void;
    ttsEnabled: boolean;
    setTtsEnabled: (enabled: boolean) => void;
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
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
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

            classLevel: '初級',
            setClassLevel: (level) => {
                // Determine default excluded properties
                // When selecting 'プレ', hide 'C01' and 'C02' (Planks) by default if not already configured.
                // We keep the logic simple: whenever Pre-class is selected, ensure C01 and C02 are in exclusions.
                if (level === 'プレ') {
                    set((state) => ({
                        classLevel: level,
                        excludedExercises: Array.from(new Set([...state.excludedExercises, 'C01', 'C02'])),
                    }));
                } else {
                    set({ classLevel: level });
                }
            },

            hasCompletedOnboarding: false,
            completeOnboarding: () => set({ hasCompletedOnboarding: true }),

            soundVolume: 0.5,
            setSoundVolume: (vol) => set({ soundVolume: vol }),
            ttsEnabled: true,
            setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
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
        }),
        {
            name: 'keepgoing-app-state',
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migration: Ensure 'S07' (Point & Flex) is added to required exercises for existing users
                    if (persistedState.requiredExercises && !persistedState.requiredExercises.includes('S07')) {
                        persistedState.requiredExercises.push('S07');
                    }
                }
                return persistedState as AppState;
            },
            partialize: (state) => ({
                classLevel: state.classLevel,
                hasCompletedOnboarding: state.hasCompletedOnboarding,
                soundVolume: state.soundVolume,
                ttsEnabled: state.ttsEnabled,
                notificationsEnabled: state.notificationsEnabled,
                notificationTime: state.notificationTime,
                dailyTargetMinutes: state.dailyTargetMinutes,
                excludedExercises: state.excludedExercises,
                requiredExercises: state.requiredExercises,
            }),
        }
    )
);
