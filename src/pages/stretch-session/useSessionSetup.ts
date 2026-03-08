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
import { fetchAllTeacherItemOverrides } from '../../lib/teacherItemOverrides';
import type { UserProfileStore } from '../../store/useAppStore';

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
                '先生': -1,
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
            contextUsers.flatMap((user) => user.excludedExercises ?? [])
        )),
        [contextUsers]
    );
    const globalRequiredIds = useMemo(
        () => Array.from(new Set(
            contextUsers.flatMap((user) => user.requiredExercises ?? [])
        )),
        [contextUsers]
    );

    useEffect(() => {
        const loadSession = async () => {
            setIsLoading(true);
            try {
                const [customExList, teacherExList, teacherSettings, teacherOverrides] = await Promise.all([
                    getCustomExercises(),
                    fetchTeacherExercises(),
                    fetchTeacherMenuSettingsForClass(classLevel),
                    fetchAllTeacherItemOverrides(),
                ]);

                // Build override map for built-in exercises
                const overrideMap = new Map(
                    teacherOverrides
                        .filter(o => o.itemType === 'exercise')
                        .map(o => [o.itemId, o])
                );

                // Apply teacher overrides to built-in exercises
                const overriddenBuiltIns: Exercise[] = EXERCISES.map(e => {
                    const ov = overrideMap.get(e.id);
                    if (!ov) return e;
                    return {
                        ...e,
                        name: ov.nameOverride ?? e.name,
                        emoji: ov.emojiOverride ?? e.emoji,
                        sec: ov.secOverride ?? e.sec,
                        hasSplit: ov.hasSplitOverride ?? e.hasSplit,
                        description: ov.descriptionOverride ?? e.description,
                        reading: ov.nameOverride ? undefined : e.reading, // reading invalidated if name changed
                    };
                });

                // Fetch teacher-created exercises and add to custom pool
                const teacherExForClass = teacherExList.filter(
                    te => te.classLevels.length === 0 || te.classLevels.includes(classLevel)
                );
                const teacherAsCustom = teacherExForClass.map(te => ({
                    id: te.id,
                    name: te.name,
                    sec: te.sec,
                    emoji: te.emoji,
                    placement: te.placement,
                    hasSplit: te.hasSplit,
                    description: te.description,
                }));
                const allCustomPool = [...customExList, ...teacherAsCustom];

                const allExercises = [...overriddenBuiltIns, ...allCustomPool];
                const teacherExcludedIds = teacherSettings
                    .filter(s => s.itemType === 'exercise' && (s.status === 'excluded' || s.status === 'hidden'))
                    .map(s => s.itemId);
                const teacherRequiredIds = teacherSettings
                    .filter(s => s.itemType === 'exercise' && s.status === 'required')
                    .map(s => s.itemId);

                if (!sessionExerciseIds || sessionHybridMode) {
                    // 自動生成モード（ハイブリッド時は選択種目を requiredIds にマージ）
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
                    // ユーザー設定が優先、先生設定はユーザー未設定分のみ適用
                    const userSetIds = new Set([...globalRequiredIds, ...globalExcludedIds]);

                    const effectiveRequired = [
                        ...globalRequiredIds,  // ユーザーの必須（先生の除外に勝つ）
                        ...teacherRequiredIds.filter(id => !userSetIds.has(id)),  // 先生の必須（ユーザー未設定分のみ）
                    ];
                    const effectiveExcluded = [
                        ...globalExcludedIds,  // ユーザーの除外（先生の必須に勝つ）
                        ...teacherExcludedIds.filter(id => !userSetIds.has(id)),  // 先生の除外（ユーザー未設定分のみ）
                    ];

                    // ハイブリッドモード: 選択した種目を必須に追加
                    const hybridRequired = sessionHybridMode && sessionExerciseIds
                        ? [...effectiveRequired, ...sessionExerciseIds]
                        : effectiveRequired;

                    const mergedRequired = [...new Set(hybridRequired)];
                    const today = todaySessions.flatMap((session) => [...session.exerciseIds, ...session.skippedIds]);
                    const mergedExcluded = [...new Set([...today, ...effectiveExcluded])]
                        .filter(id => !mergedRequired.includes(id));

                    setSessionExercises(generateSession(classLevel, {
                        excludedIds: mergedExcluded,
                        requiredIds: mergedRequired,
                        targetSeconds: dailyTargetMinutes * 60,
                        customPool: allCustomPool,
                        historicalCounts,
                        builtInOverrides: overriddenBuiltIns,
                    }));
                    return;
                }

                const resolved: Exercise[] = sessionExerciseIds
                    .map((id) => {
                        const found = allExercises.find((exercise) => exercise.id === id);
                        if (!found) return undefined;
                        // Ensure custom/teacher exercises have all required Exercise fields
                        return {
                            internal: found.hasSplit ? 'R30→L30' : 'single',
                            classes: [] as ClassLevel[],
                            priority: 'medium' as const,
                            ...found,
                            placement: found.placement ?? 'stretch',
                        } satisfies Exercise;
                    })
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
