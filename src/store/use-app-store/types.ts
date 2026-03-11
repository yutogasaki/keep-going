import type { ClassLevel } from '../../data/exercises';

export interface PastFuwafuwaRecord {
    id: string;
    name: string | null;
    type: number;
    activeDays: number;
    finalStage: number;
    sayonaraDate: string;
}

export interface ChibifuwaRecord {
    id: string;
    type: number;
    challengeTitle: string;
    earnedDate: string;
}

export type FuwafuwaMilestoneKind = 'egg' | 'fairy' | 'adult';

export interface FuwafuwaMilestoneEvent {
    kind: FuwafuwaMilestoneKind;
    userId: string;
    source: 'system' | 'debug';
}

export type SessionMenuSource = 'preset' | 'teacher' | 'custom' | 'public';

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
    dailyTargetMinutes: number;
    excludedExercises: string[];
    requiredExercises: string[];
    consumedMagicSeconds?: number;
    challengeStars?: number;
    avatarUrl?: string;
    chibifuwas: ChibifuwaRecord[];
}

export type TabId = 'home' | 'record' | 'menu' | 'settings';
export type SessionKind = 'auto' | 'fixed' | 'hybrid' | 'teacher-preview';

export interface SessionDraft {
    date: string;
    exerciseIds: string[];
    userIds: string[];
    returnTab: TabId;
    sourceMenuId?: string | null;
    sourceMenuSource?: SessionMenuSource | null;
    sourceMenuName?: string | null;
}

export interface AppState {
    users: UserProfileStore[];
    addUser: (user: Omit<UserProfileStore, 'id' | 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises' | 'chibifuwas'>) => void;
    updateUser: (id: string, updates: Partial<UserProfileStore>) => void;
    deleteUser: (id: string) => void;
    updateUserSettings: (id: string, updates: Partial<Pick<UserProfileStore, 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>>) => void;
    consumeUserMagicEnergy: (id: string, seconds: number) => void;
    resetUserFuwafuwa: (id: string, newType: number, activeDays: number, finalStage: number) => void;
    addChibifuwa: (userId: string, record: Omit<ChibifuwaRecord, 'id'>) => void;
    addChallengeStars: (userId: string, amount: number) => void;

    currentTab: TabId;
    previousTab: TabId;
    setTab: (tab: TabId) => void;

    sessionUserIds: string[];
    setSessionUserIds: (ids: string[]) => void;
    isInSession: boolean;
    sessionExerciseIds: string[] | null;
    sessionSourceMenuId: string | null;
    sessionSourceMenuSource: SessionMenuSource | null;
    sessionSourceMenuName: string | null;
    sessionHybridMode: boolean;
    sessionReturnTab: TabId;
    sessionDraft: SessionDraft | null;
    sessionKind: SessionKind | null;
    setSessionDraft: (draft: SessionDraft | null) => void;
    isTeacherPreview: boolean;
    startSession: () => void;
    startSessionWithExercises: (
        ids: string[],
        options?: {
            sourceMenuId?: string | null;
            sourceMenuSource?: SessionMenuSource | null;
            sourceMenuName?: string | null;
            returnTab?: TabId;
        },
    ) => void;
    startHybridSession: (requiredIds: string[]) => void;
    startTeacherPreviewSession: (ids: string[]) => void;
    endSession: () => void;
    completeSession: () => void;

    onboardingCompleted: boolean;
    setOnboardingCompleted: (completed: boolean) => void;

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
    hasSeenSessionControlsHint: boolean;
    setHasSeenSessionControlsHint: (seen: boolean) => void;
    dismissedHomeAnnouncementIds: string[];
    dismissHomeAnnouncement: (announcementId: string) => void;

    debugFuwafuwaStage: number | null;
    debugFuwafuwaType: number | null;
    debugActiveDays: number | null;
    debugFuwafuwaScale: number | null;
    setDebugFuwafuwaStage: (stage: number | null) => void;
    setDebugFuwafuwaType: (type: number | null) => void;
    setDebugActiveDays: (days: number | null) => void;
    setDebugFuwafuwaScale: (scale: number | null) => void;

    activeMilestoneModal: FuwafuwaMilestoneEvent | null;
    setActiveMilestoneModal: (modal: FuwafuwaMilestoneEvent | null) => void;

    joinedChallengeIds: Record<string, string[]>;
    joinChallenge: (userId: string, challengeId: string) => void;
}
