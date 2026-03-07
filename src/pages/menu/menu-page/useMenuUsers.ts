import { useCallback, useMemo } from 'react';
import type { UserProfileStore } from '../../../store/useAppStore';
import { getCreatorNameById, getMinClassLevel } from '../menuPageUtils';

interface UseMenuUsersParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    updateUserSettings: (
        id: string,
        updates: Partial<Pick<UserProfileStore, 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>>,
    ) => void;
}

export function useMenuUsers({
    users,
    sessionUserIds,
    updateUserSettings,
}: UseMenuUsersParams) {
    const currentUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [users, sessionUserIds],
    );

    const isTogetherMode = sessionUserIds.length > 1;

    const classLevel = useMemo(
        () => getMinClassLevel(currentUsers),
        [currentUsers],
    );

    const dailyTargetMinutes = useMemo(() => {
        if (isTogetherMode) {
            return currentUsers.length > 0
                ? Math.max(...currentUsers.map((user) => user.dailyTargetMinutes ?? 10))
                : 10;
        }

        return currentUsers[0]?.dailyTargetMinutes ?? 10;
    }, [currentUsers, isTogetherMode]);

    const excludedExercises = useMemo(
        () => Array.from(new Set(
            currentUsers.flatMap((user) => user.excludedExercises ?? []),
        )),
        [currentUsers],
    );

    const requiredExercises = useMemo(
        () => Array.from(new Set(
            currentUsers.flatMap((user) => user.requiredExercises ?? []),
        )),
        [currentUsers],
    );

    const setDailyTargetMinutes = useCallback((minutes: number) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { dailyTargetMinutes: minutes });
        }
    }, [currentUsers, isTogetherMode, updateUserSettings]);

    const setExcludedExercises = useCallback((exerciseIds: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { excludedExercises: exerciseIds });
        }
    }, [currentUsers, isTogetherMode, updateUserSettings]);

    const setRequiredExercises = useCallback((exerciseIds: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { requiredExercises: exerciseIds });
        }
    }, [currentUsers, isTogetherMode, updateUserSettings]);

    const getCreatorName = useCallback(
        (creatorId?: string) => getCreatorNameById(users, creatorId),
        [users],
    );

    return {
        currentUsers,
        classLevel,
        isTogetherMode,
        dailyTargetMinutes,
        excludedExercises,
        requiredExercises,
        setDailyTargetMinutes,
        setExcludedExercises,
        setRequiredExercises,
        getCreatorName,
        sessionUserCount: sessionUserIds.length,
        currentUserId: sessionUserIds.length === 1 ? (sessionUserIds[0] ?? users[0]?.id) : undefined,
        authorName: currentUsers[0]?.name ?? 'ゲスト',
    };
}
