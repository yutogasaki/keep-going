import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SESSION_TARGET_SECONDS, getExercisesByClass } from '../../../data/exercises';
import {
    deleteCustomGroup,
    getCustomGroups,
    getPresetsForClass,
    type MenuGroup,
} from '../../../data/menuGroups';
import { audio } from '../../../lib/audio';
import { deleteCustomExercise, getCustomExercises, type CustomExercise } from '../../../lib/db';
import { getAccountId } from '../../../lib/sync';
import {
    fetchMyPublishedMenus,
    publishMenu,
    type PublicMenu,
    unpublishMenu,
} from '../../../lib/publicMenus';
import type { UserProfileStore } from '../../../store/useAppStore';
import { getCreatorNameById, getMinClassLevel } from '../menuPageUtils';
import type { MenuTab } from './types';

interface UseMenuPageDataParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    startSessionWithExercises: (ids: string[]) => void;
    updateUserSettings: (id: string, updates: Partial<Pick<UserProfileStore, 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>>) => void;
}

export function useMenuPageData({
    users,
    sessionUserIds,
    startSessionWithExercises,
    updateUserSettings,
}: UseMenuPageDataParams) {
    const currentUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [users, sessionUserIds],
    );

    const classLevel = useMemo(
        () => getMinClassLevel(currentUsers),
        [currentUsers],
    );

    const [tab, setTab] = useState<MenuTab>('group');
    const [presets, setPresets] = useState<MenuGroup[]>([]);
    const [customGroups, setCustomGroups] = useState<MenuGroup[]>([]);
    const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateEx, setShowCreateEx] = useState(false);
    const [editGroup, setEditGroup] = useState<MenuGroup | null>(null);
    const [editEx, setEditEx] = useState<CustomExercise | null>(null);
    const [showCustomMenu, setShowCustomMenu] = useState(false);
    const [showPublicBrowser, setShowPublicBrowser] = useState(false);
    const [myPublishedMenus, setMyPublishedMenus] = useState<PublicMenu[]>([]);

    const isTogetherMode = sessionUserIds.length > 1;

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
            currentUsers.flatMap((user) => user.excludedExercises || (user.classLevel === 'プレ' ? ['C01', 'C02'] : [])),
        )),
        [currentUsers],
    );

    const requiredExercises = useMemo(
        () => Array.from(new Set(
            currentUsers.flatMap((user) => user.requiredExercises || ['S01', 'S02', 'S07']),
        )),
        [currentUsers],
    );

    const loadCustomData = useCallback(async () => {
        const currentUserId = sessionUserIds[0] ?? users[0]?.id;

        const allGroups = await getCustomGroups();
        const allExercises = await getCustomExercises();

        setCustomGroups(allGroups.filter((group) => {
            if (isTogetherMode) {
                return true;
            }
            return !group.creatorId || group.creatorId === currentUserId;
        }));

        setCustomExercises(allExercises.filter((exercise) => {
            if (isTogetherMode) {
                return true;
            }
            return !exercise.creatorId || exercise.creatorId === currentUserId;
        }));

        if (getAccountId()) {
            fetchMyPublishedMenus().then(setMyPublishedMenus).catch(console.warn);
        }
    }, [isTogetherMode, sessionUserIds, users]);

    useEffect(() => {
        setPresets(getPresetsForClass(classLevel));
        void loadCustomData();
    }, [classLevel, sessionUserIds, loadCustomData]);

    const setDailyTargetMinutes = (minutes: number) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { dailyTargetMinutes: minutes });
        }
    };

    const setExcludedExercises = (exerciseIds: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { excludedExercises: exerciseIds });
        }
    };

    const setRequiredExercises = (exerciseIds: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { requiredExercises: exerciseIds });
        }
    };

    const handleGroupTap = (group: MenuGroup) => {
        audio.initTTS();
        startSessionWithExercises(group.exerciseIds);
    };

    const handleDeleteGroup = async (groupId: string) => {
        await deleteCustomGroup(groupId);
        await loadCustomData();
    };

    const handleDeleteEx = async (exerciseId: string) => {
        await deleteCustomExercise(exerciseId);
        await loadCustomData();
    };

    const handleCreatedGroup = () => {
        setShowCreateGroup(false);
        setEditGroup(null);
        void loadCustomData();
    };

    const handleCreatedEx = () => {
        setShowCreateEx(false);
        setEditEx(null);
        void loadCustomData();
    };

    const findPublishedMenu = useCallback((group: MenuGroup): PublicMenu | undefined => {
        return myPublishedMenus.find(
            (publishedMenu) => publishedMenu.name === group.name
                && publishedMenu.exerciseIds.join(',') === group.exerciseIds.join(','),
        );
    }, [myPublishedMenus]);

    const handlePublishGroup = async (group: MenuGroup) => {
        if (!getAccountId()) {
            return;
        }

        const authorName = currentUsers[0]?.name ?? 'ゲスト';

        try {
            await publishMenu(group, authorName);
            alert('メニューを公開しました！');
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] publish failed:', error);
            alert('公開に失敗しました');
        }
    };

    const handleUnpublishGroup = async (group: MenuGroup) => {
        const publishedMenu = findPublishedMenu(group);
        if (!publishedMenu) {
            return;
        }

        try {
            await unpublishMenu(publishedMenu.id);
            alert('メニューを非公開にしました');
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] unpublish failed:', error);
            alert('非公開に失敗しました');
        }
    };

    const exercises = getExercisesByClass(classLevel);
    const autoMenuMinutes = Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60);
    const canPublish = !!getAccountId();

    return {
        tab,
        setTab,
        classLevel,
        presets,
        customGroups,
        customExercises,
        showCreateGroup,
        setShowCreateGroup,
        showCreateEx,
        setShowCreateEx,
        editGroup,
        setEditGroup,
        editEx,
        setEditEx,
        showCustomMenu,
        setShowCustomMenu,
        showPublicBrowser,
        setShowPublicBrowser,
        isTogetherMode,
        dailyTargetMinutes,
        excludedExercises,
        requiredExercises,
        currentUsers,
        exercises,
        autoMenuMinutes,
        canPublish,
        sessionUserCount: sessionUserIds.length,
        getCreatorName: (creatorId?: string) => getCreatorNameById(users, creatorId),
        loadCustomData,
        setDailyTargetMinutes,
        setExcludedExercises,
        setRequiredExercises,
        handleGroupTap,
        handleDeleteGroup,
        handleDeleteEx,
        handleCreatedGroup,
        handleCreatedEx,
        findPublishedMenu,
        handlePublishGroup,
        handleUnpublishGroup,
        handleStartSingleExercise: (exerciseId: string) => {
            audio.initTTS();
            startSessionWithExercises([exerciseId]);
        },
        handleStartCustomExercise: (exerciseId: string) => {
            startSessionWithExercises([exerciseId]);
        },
    };
}
