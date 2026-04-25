import type { StateCreator } from 'zustand';
import { getTodayKey } from '../../lib/db';
import type { AppState, SessionDraft, TabId } from './types';

type AppStateSetter = Parameters<StateCreator<AppState, [], [], AppState>>[0];

type SessionState = Pick<
    AppState,
    | 'sessionUserIds'
    | 'setSessionUserIds'
    | 'isInSession'
    | 'sessionExerciseIds'
    | 'sessionPlannedItems'
    | 'sessionSourceMenuId'
    | 'sessionSourceMenuSource'
    | 'sessionSourceMenuName'
    | 'sessionHybridMode'
    | 'sessionReturnTab'
    | 'sessionDraft'
    | 'sessionKind'
    | 'setSessionDraft'
    | 'isTeacherPreview'
    | 'startSession'
    | 'startSessionWithExercises'
    | 'startSessionWithPlan'
    | 'startHybridSession'
    | 'startTeacherPreviewSession'
    | 'endSession'
    | 'completeSession'
>;

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

export function createSessionState(set: AppStateSetter): SessionState {
    return {
        sessionUserIds: [],
        setSessionUserIds: (ids) => set({ sessionUserIds: ids }),

        isInSession: false,
        sessionExerciseIds: null,
        sessionPlannedItems: null,
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
                sessionPlannedItems: null,
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
            sessionPlannedItems: null,
            sessionSourceMenuId: options?.sourceMenuId ?? null,
            sessionSourceMenuSource: options?.sourceMenuSource ?? null,
            sessionSourceMenuName: options?.sourceMenuName ?? null,
            sessionReturnTab: options?.returnTab ?? 'home',
            sessionKind: 'fixed' as const,
            isTeacherPreview: false,
        })),
        startSessionWithPlan: (items, options) => set(() => ({
            isInSession: true,
            sessionExerciseIds: items.map((item) => item.id),
            sessionPlannedItems: items,
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
            sessionPlannedItems: null,
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
            sessionPlannedItems: null,
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
            sessionPlannedItems: null,
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
            sessionPlannedItems: null,
            sessionSourceMenuId: null,
            sessionSourceMenuSource: null,
            sessionSourceMenuName: null,
            sessionHybridMode: false,
            sessionDraft: state.sessionKind === 'auto' ? null : state.sessionDraft,
            sessionKind: null,
            isTeacherPreview: false,
        })),
    };
}
