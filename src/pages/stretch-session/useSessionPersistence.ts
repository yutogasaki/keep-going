import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import { getTodayKey, saveSession, type SessionRecord } from '../../lib/db';
import type { Exercise } from '../../data/exercises';
import type { SessionDraft, TabId } from '../../store/use-app-store/types';

interface UseSessionPersistenceParams {
    autoCompleteSaveRef: MutableRefObject<() => Promise<void> | void>;
    completedIds: string[];
    dailyTargetMinutes: number;
    endSession: () => void;
    isCompleted: boolean;
    isLoading: boolean;
    isTeacherPreview: boolean;
    sessionDraftSetter: (draft: SessionDraft | null) => void;
    sessionExerciseIds: string[] | null;
    sessionExercises: Exercise[];
    sessionReturnTab: TabId;
    sessionUserIds: string[];
    skippedIds: string[];
    startedAt: string;
    totalRunningTime: number;
}

export function useSessionPersistence({
    autoCompleteSaveRef,
    completedIds,
    dailyTargetMinutes,
    endSession,
    isCompleted,
    isLoading,
    isTeacherPreview,
    sessionDraftSetter,
    sessionExerciseIds,
    sessionExercises,
    sessionReturnTab,
    sessionUserIds,
    skippedIds,
    startedAt,
    totalRunningTime,
}: UseSessionPersistenceParams) {
    const hasSavedRef = useRef(false);

    useEffect(() => {
        if (isTeacherPreview || isLoading || sessionExercises.length === 0) {
            return;
        }

        sessionDraftSetter({
            date: getTodayKey(),
            exerciseIds: sessionExercises.map((exercise) => exercise.id),
            userIds: [...sessionUserIds],
            returnTab: sessionReturnTab,
        });
    }, [
        isLoading,
        isTeacherPreview,
        sessionDraftSetter,
        sessionExercises,
        sessionReturnTab,
        sessionUserIds,
    ]);

    const saveSessionData = useCallback(async () => {
        if (isTeacherPreview || hasSavedRef.current) {
            return;
        }
        hasSavedRef.current = true;

        let finalRunningTime = totalRunningTime;
        if (!sessionExerciseIds && isCompleted) {
            finalRunningTime = Math.max(totalRunningTime, dailyTargetMinutes * 60);
        }

        if (completedIds.length > 0 || finalRunningTime > 0) {
            const record: SessionRecord = {
                id: crypto.randomUUID(),
                date: getTodayKey(),
                startedAt,
                totalSeconds: finalRunningTime,
                exerciseIds: completedIds,
                skippedIds,
                userIds: sessionUserIds,
            };
            await saveSession(record);
        }
    }, [
        completedIds,
        dailyTargetMinutes,
        isCompleted,
        isTeacherPreview,
        sessionExerciseIds,
        sessionUserIds,
        skippedIds,
        startedAt,
        totalRunningTime,
    ]);

    autoCompleteSaveRef.current = saveSessionData;

    const handleEndSession = useCallback(async () => {
        await saveSessionData();
        endSession();
    }, [endSession, saveSessionData]);

    return { handleEndSession };
}
