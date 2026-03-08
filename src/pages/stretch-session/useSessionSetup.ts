import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { getCustomExercises, getAllSessions, getTodayKey } from '../../lib/db';
import { fetchTeacherMenuSettingsForClass } from '../../lib/teacherMenuSettings';
import { fetchTeacherExercises } from '../../lib/teacherContent';
import { fetchAllTeacherItemOverrides } from '../../lib/teacherItemOverrides';
import type { UserProfileStore } from '../../store/useAppStore';
import { type ClassLevel, type Exercise } from '../../data/exercises';
import {
    applyTeacherExerciseOverrides,
    buildAutoSessionExercises,
    buildExerciseOverrideMap,
    getDefaultBuiltInExercises,
    getMergedUserSettingIds,
    getSessionContextClassLevel,
    getSessionContextUsers,
    getSessionDailyTargetMinutes,
    mapTeacherExercisesToCustomPool,
    resolveExplicitSessionExercises,
} from './sessionSetupHelpers';

interface UseSessionSetupParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    sessionExerciseIds: string[] | null;
    sessionHybridMode?: boolean;
}

interface UseSessionSetupResult {
    classLevel: ClassLevel;
    dailyTargetMinutes: number;
    sessionExercises: Exercise[];
    setSessionExercises: Dispatch<SetStateAction<Exercise[]>>;
    isLoading: boolean;
}

export function useSessionSetup({
    users,
    sessionUserIds,
    sessionExerciseIds,
    sessionHybridMode,
}: UseSessionSetupParams): UseSessionSetupResult {
    const [isLoading, setIsLoading] = useState(true);
    const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);

    const contextUsers = useMemo(
        () => getSessionContextUsers(users, sessionUserIds),
        [users, sessionUserIds],
    );

    const classLevel = useMemo<ClassLevel>(
        () => getSessionContextClassLevel(contextUsers),
        [contextUsers],
    );

    const dailyTargetMinutes = useMemo(
        () => getSessionDailyTargetMinutes(contextUsers),
        [contextUsers],
    );

    const globalExcludedIds = useMemo(
        () => getMergedUserSettingIds(contextUsers, 'excludedExercises'),
        [contextUsers],
    );
    const globalRequiredIds = useMemo(
        () => getMergedUserSettingIds(contextUsers, 'requiredExercises'),
        [contextUsers],
    );

    useEffect(() => {
        const loadSession = async () => {
            setIsLoading(true);
            try {
                const [customExercises, teacherExercises, teacherSettings, teacherOverrides] = await Promise.all([
                    getCustomExercises(),
                    fetchTeacherExercises(),
                    fetchTeacherMenuSettingsForClass(classLevel),
                    fetchAllTeacherItemOverrides(),
                ]);

                const builtInOverrides = applyTeacherExerciseOverrides(
                    getDefaultBuiltInExercises(),
                    buildExerciseOverrideMap(teacherOverrides),
                );
                const teacherCustomPool = mapTeacherExercisesToCustomPool(teacherExercises, classLevel);
                const allCustomPool = [...customExercises, ...teacherCustomPool];

                if (!sessionExerciseIds || sessionHybridMode) {
                    const allSessions = await getAllSessions();
                    setSessionExercises(buildAutoSessionExercises({
                        classLevel,
                        dailyTargetMinutes,
                        globalRequiredIds,
                        globalExcludedIds,
                        teacherSettings,
                        sessionExerciseIds,
                        sessionHybridMode,
                        allSessions,
                        sessionUserIds,
                        allCustomPool,
                        builtInOverrides,
                        todayKey: getTodayKey(),
                    }));
                    return;
                }

                setSessionExercises(resolveExplicitSessionExercises(
                    sessionExerciseIds,
                    [...builtInOverrides, ...allCustomPool],
                ));
            } catch (err) {
                console.error('Failed to load session:', err);
                setSessionExercises([]);
            } finally {
                setIsLoading(false);
            }
        };

        void loadSession();
    }, [
        classLevel,
        dailyTargetMinutes,
        globalExcludedIds,
        globalRequiredIds,
        sessionExerciseIds,
        sessionHybridMode,
        sessionUserIds,
    ]);

    return {
        classLevel,
        dailyTargetMinutes,
        sessionExercises,
        setSessionExercises,
        isLoading,
    };
}
