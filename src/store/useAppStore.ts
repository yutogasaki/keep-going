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

    // Fuwafuwa State (persisted)
    fuwafuwaBirthDate: string;
    fuwafuwaType: number;
    fuwafuwaCycleCount: number;
    fuwafuwaName: string | null;
    pastFuwafuwas: PastFuwafuwaRecord[];
    setFuwafuwaBirthDate: (date: string) => void;
    setFuwafuwaType: (type: number) => void;
    setFuwafuwaName: (name: string | null) => void;
    resetFuwafuwaState: (newType: number, activeDays: number, finalStage: number) => void;

    // Debug Overrides
    debugFuwafuwaStage: number | null;
    debugFuwafuwaType: number | null;
    setDebugFuwafuwaStage: (stage: number | null) => void;
    setDebugFuwafuwaType: (type: number | null) => void;

    // Milestones
    notifiedFuwafuwaStages: number[];
    addNotifiedFuwafuwaStage: (stage: number) => void;
    activeMilestoneModal: 'egg' | 'fairy' | 'adult' | null;
    setActiveMilestoneModal: (modal: 'egg' | 'fairy' | 'adult' | null) => void;
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

            fuwafuwaBirthDate: new Date().toISOString().split('T')[0], // Default to today
            fuwafuwaType: Math.floor(Math.random() * 6), // Initial random type 0-5
            fuwafuwaCycleCount: 1,
            fuwafuwaName: null,
            pastFuwafuwas: [],
            setFuwafuwaBirthDate: (date) => set({ fuwafuwaBirthDate: date }),
            setFuwafuwaType: (type) => set({ fuwafuwaType: type }),
            setFuwafuwaName: (name) => set({ fuwafuwaName: name }),
            resetFuwafuwaState: (newType, activeDays, finalStage) => set((state) => {
                const today = new Date().toISOString().split('T')[0];
                const record: PastFuwafuwaRecord = {
                    id: crypto.randomUUID(),
                    name: state.fuwafuwaName,
                    type: state.fuwafuwaType,
                    activeDays,
                    finalStage,
                    sayonaraDate: today
                };
                return {
                    fuwafuwaBirthDate: today,
                    fuwafuwaType: newType,
                    fuwafuwaCycleCount: state.fuwafuwaCycleCount + 1,
                    fuwafuwaName: null, // Reset name for new generation
                    pastFuwafuwas: [...state.pastFuwafuwas, record],
                    notifiedFuwafuwaStages: [] // Reset notifications for new generation
                };
            }),

            debugFuwafuwaStage: null,
            debugFuwafuwaType: null,
            setDebugFuwafuwaStage: (stage) => set({ debugFuwafuwaStage: stage }),
            setDebugFuwafuwaType: (type) => set({ debugFuwafuwaType: type }),

            notifiedFuwafuwaStages: [],
            addNotifiedFuwafuwaStage: (stage) => set((state) => ({ notifiedFuwafuwaStages: [...state.notifiedFuwafuwaStages, stage] })),
            activeMilestoneModal: null,
            setActiveMilestoneModal: (modal) => set({ activeMilestoneModal: modal })
        }),
        {
            name: 'keepgoing-app-state',
            version: 2,
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
                return persistedState as AppState;
            },
            partialize: (state) => ({
                classLevel: state.classLevel,
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
                fuwafuwaBirthDate: state.fuwafuwaBirthDate,
                fuwafuwaType: state.fuwafuwaType,
                fuwafuwaCycleCount: state.fuwafuwaCycleCount,
                fuwafuwaName: state.fuwafuwaName,
                pastFuwafuwas: state.pastFuwafuwas,
            }),
        }
    )
);
