import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import {
    EXERCISES,
    generateSession,
    type ClassLevel,
    type Exercise,
} from '../../data/exercises';
import { getAllSessions, getCustomExercises, getTodayKey } from '../../lib/db';
import { fetchTeacherMenuSettingsForClass } from '../../lib/teacherMenuSettings';
import { fetchTeacherExercises } from '../../lib/teacherContent';
import type { UserProfileStore } from '../../store/useAppStore';

interface UseSessionSetupParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    sessionExerciseIds: string[] | null;
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
}: UseSessionSetupParams): UseSessionSetupResult {
    const [isLoading, setIsLoading] = useState(true);
    const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);

    const currentUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [users, sessionUserIds]
    );
    const contextUsers = useMemo(
        () => (currentUsers.length > 0 ? currentUsers : users.slice(0, 1)),
        [currentUsers, users]
    );

    const classLevel = useMemo<ClassLevel>(() => {
        if (contextUsers.length === 0) return '初級';

        return contextUsers.reduce<ClassLevel>((min, user) => {
            const weights: Record<ClassLevel, number> = {
                'プレ': 0,
                '初級': 1,
                '中級': 2,
                '上級': 3,
                'その他': 1,
            };
            return (weights[user.classLevel] ?? 1) < (weights[min] ?? 1) ? user.classLevel : min;
        }, contextUsers[0].classLevel);
    }, [contextUsers]);

    const dailyTargetMinutes = useMemo(() => {
        if (contextUsers.length === 0) return 10;
        return Math.max(...contextUsers.map((user) => user.dailyTargetMinutes ?? 10));
    }, [contextUsers]);

    const globalExcludedIds = useMemo(
        () => Array.from(new Set(
            contextUsers.flatMap((user) => user.excludedExercises || (user.classLevel === 'プレ' ? ['C01', 'C02'] : []))
        )),
        [contextUsers]
    );
    const globalRequiredIds = useMemo(
        () => Array.from(new Set(
            contextUsers.flatMap((user) => user.requiredExercises || ['S01', 'S02', 'S07'])
        )),
        [contextUsers]
    );

    const sessionUserKey = sessionUserIds.join('|');
    const excludedIdsKey = [...globalExcludedIds].sort().join('|');
    const requiredIdsKey = [...globalRequiredIds].sort().join('|');

    useEffect(() => {
        const loadSession = async () => {
            setIsLoading(true);
            try {
                const customExList = await getCustomExercises();

                // Fetch teacher-created exercises and add to custom pool
                const teacherExList = await fetchTeacherExercises();
                const teacherExForClass = teacherExList.filter(
                    te => te.classLevels.length === 0 || te.classLevels.includes(classLevel)
                );
                const teacherAsCustom = teacherExForClass.map(te => ({
                    id: te.id,
                    name: te.name,
                    sec: te.sec,
                    emoji: te.emoji,
                    hasSplit: te.hasSplit,
                }));
                const allCustomPool = [...customExList, ...teacherAsCustom];

                const allExercises = [...EXERCISES, ...allCustomPool];

                // Fetch teacher menu settings for class-level overrides
                const teacherSettings = await fetchTeacherMenuSettingsForClass(classLevel);
                const teacherExcludedIds = teacherSettings
                    .filter(s => s.itemType === 'exercise' && (s.status === 'excluded' || s.status === 'hidden'))
                    .map(s => s.itemId);
                const teacherRequiredIds = teacherSettings
                    .filter(s => s.itemType === 'exercise' && s.status === 'required')
                    .map(s => s.itemId);

                if (!sessionExerciseIds) {
                    const allSessions = await getAllSessions();
                    const historicalCounts: Record<string, number> = {};

                    allSessions.forEach((session) => {
                        if (!session.userIds || session.userIds.some((userId) => sessionUserIds.includes(userId))) {
                            session.exerciseIds.forEach((id) => {
                                historicalCounts[id] = (historicalCounts[id] || 0) + 1;
                            });
                        }
                    });

                    const todaySessions = allSessions.filter((session) => session.date === getTodayKey());
                    // Merge teacher settings with student settings (teacher takes priority)
                    const mergedExcluded = Array.from(new Set([
                        ...todaySessions.flatMap((session) => [...session.exerciseIds, ...session.skippedIds]),
                        ...globalExcludedIds,
                        ...teacherExcludedIds,
                    ])).filter(id => !teacherRequiredIds.includes(id));

                    const mergedRequired = Array.from(new Set([
                        ...globalRequiredIds,
                        ...teacherRequiredIds,
                    ])).filter(id => !teacherExcludedIds.includes(id));

                    setSessionExercises(generateSession(classLevel, {
                        excludedIds: mergedExcluded,
                        requiredIds: mergedRequired,
                        targetSeconds: dailyTargetMinutes * 60,
                        customPool: allCustomPool,
                        historicalCounts,
                    }));
                    return;
                }

                const resolved = sessionExerciseIds
                    .map((id) => allExercises.find((exercise) => exercise.id === id))
                    .filter((exercise): exercise is Exercise => exercise !== undefined);

                setSessionExercises(resolved);
            } catch (err) {
                console.error('Failed to load session:', err);
                setSessionExercises([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSession();
    }, [
        classLevel,
        dailyTargetMinutes,
        excludedIdsKey,
        requiredIdsKey,
        sessionExerciseIds,
        sessionUserKey,
    ]);

    return {
        classLevel,
        dailyTargetMinutes,
        sessionExercises,
        setSessionExercises,
        isLoading,
    };
}
