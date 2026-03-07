import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Exercise } from '../../../data/exercises';
import { getPresetsForClass, type MenuGroup } from '../../../data/menuGroups';
import { audio } from '../../../lib/audio';
import { deleteCustomGroup, getCustomGroups } from '../../../lib/customGroups';
import { deleteCustomExercise, getCustomExercises, type CustomExercise } from '../../../lib/db';
import type { UserProfileStore } from '../../../store/useAppStore';
import { useMenuExercises } from './useMenuExercises';
import { useMenuPublishActions } from './useMenuPublishActions';
import { useMenuUsers } from './useMenuUsers';
import { useTeacherContent } from './useTeacherContent';
import type { MenuToastMessage } from './shared';
import type { MenuTab } from './types';

interface UseMenuPageDataParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    startSessionWithExercises: (ids: string[]) => void;
    updateUserSettings: (
        id: string,
        updates: Partial<Pick<UserProfileStore, 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>>,
    ) => void;
}

export function useMenuPageData({
    users,
    sessionUserIds,
    startSessionWithExercises,
    updateUserSettings,
}: UseMenuPageDataParams) {
    const [tab, setTab] = useState<MenuTab>('group');
    const [customGroups, setCustomGroups] = useState<MenuGroup[]>([]);
    const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateEx, setShowCreateEx] = useState(false);
    const [editGroup, setEditGroup] = useState<MenuGroup | null>(null);
    const [editEx, setEditEx] = useState<CustomExercise | null>(null);
    const [showCustomMenu, setShowCustomMenu] = useState(false);
    const [showPublicBrowser, setShowPublicBrowser] = useState(false);
    const [showPublicExerciseBrowser, setShowPublicExerciseBrowser] = useState(false);
    const [toastMessage, setToastMessage] = useState<MenuToastMessage | null>(null);

    const userContext = useMenuUsers({
        users,
        sessionUserIds,
        updateUserSettings,
    });

    const showToast = useCallback((toast: MenuToastMessage) => {
        setToastMessage(toast);
    }, []);

    const onLoadError = useCallback(() => {
        showToast({ text: '先生の設定を読み込めませんでした', type: 'error' });
    }, [showToast]);

    const teacherContent = useTeacherContent({
        classLevel: userContext.classLevel,
        onLoadError,
    });

    const publishActions = useMenuPublishActions({
        authorName: userContext.authorName,
        onToast: showToast,
    });
    const { refreshPublishedData } = publishActions;

    const presets = useMemo(
        () => getPresetsForClass(userContext.classLevel),
        [userContext.classLevel],
    );

    const exerciseData = useMenuExercises({
        classLevel: userContext.classLevel,
        presets,
        customExercises,
        teacherExercises: teacherContent.teacherExercises,
        teacherMenus: teacherContent.teacherMenus,
        teacherExcludedExerciseIds: teacherContent.teacherExcludedExerciseIds,
        teacherRequiredExerciseIds: teacherContent.teacherRequiredExerciseIds,
        teacherHiddenExerciseIds: teacherContent.teacherHiddenExerciseIds,
        teacherHiddenMenuIds: teacherContent.teacherHiddenMenuIds,
        overrideMap: teacherContent.overrideMap,
        requiredExercises: userContext.requiredExercises,
        excludedExercises: userContext.excludedExercises,
    });

    const loadCustomData = useCallback(async () => {
        const [allGroups, allExercises] = await Promise.all([
            getCustomGroups(),
            getCustomExercises(),
        ]);

        setCustomGroups(allGroups.filter((group) => {
            if (userContext.isTogetherMode) {
                return true;
            }

            return !group.creatorId || group.creatorId === userContext.currentUserId;
        }));

        setCustomExercises(allExercises.filter((exercise) => {
            if (userContext.isTogetherMode) {
                return true;
            }

            return !exercise.creatorId || exercise.creatorId === userContext.currentUserId;
        }));

        await refreshPublishedData();
    }, [
        refreshPublishedData,
        userContext.currentUserId,
        userContext.isTogetherMode,
    ]);

    useEffect(() => {
        void loadCustomData();
    }, [loadCustomData]);

    const handleGroupTap = useCallback((group: MenuGroup) => {
        audio.initTTS();
        startSessionWithExercises(group.exerciseIds);
    }, [startSessionWithExercises]);

    const handleDeleteGroup = useCallback(async (groupId: string) => {
        await deleteCustomGroup(groupId);
        await loadCustomData();
    }, [loadCustomData]);

    const handleDeleteEx = useCallback(async (exerciseId: string) => {
        await deleteCustomExercise(exerciseId);
        await loadCustomData();
    }, [loadCustomData]);

    const handleCreatedGroup = useCallback(() => {
        setShowCreateGroup(false);
        setEditGroup(null);
        void loadCustomData();
    }, [loadCustomData]);

    const handleCreatedEx = useCallback(() => {
        setShowCreateEx(false);
        setEditEx(null);
        void loadCustomData();
    }, [loadCustomData]);

    const handleStartSingleExercise = useCallback((exerciseId: string) => {
        audio.initTTS();
        startSessionWithExercises([exerciseId]);
    }, [startSessionWithExercises]);

    const handleStartCustomExercise = useCallback((exerciseId: string) => {
        startSessionWithExercises([exerciseId]);
    }, [startSessionWithExercises]);

    return {
        tab,
        setTab,
        classLevel: userContext.classLevel,
        presets: exerciseData.mergedPresets,
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
        isTogetherMode: userContext.isTogetherMode,
        dailyTargetMinutes: userContext.dailyTargetMinutes,
        excludedExercises: userContext.excludedExercises,
        requiredExercises: userContext.requiredExercises,
        currentUsers: userContext.currentUsers,
        exercises: exerciseData.exercises as Exercise[],
        exerciseMap: exerciseData.exerciseMap,
        autoMenuMinutes: exerciseData.autoMenuMinutes,
        canPublish: publishActions.canPublish,
        effectiveRequiredCount: exerciseData.effectiveRequiredCount,
        effectiveExcludedCount: exerciseData.effectiveExcludedCount,
        sessionUserCount: userContext.sessionUserCount,
        getCreatorName: userContext.getCreatorName,
        loadCustomData,
        setDailyTargetMinutes: userContext.setDailyTargetMinutes,
        setExcludedExercises: userContext.setExcludedExercises,
        setRequiredExercises: userContext.setRequiredExercises,
        handleGroupTap,
        handleDeleteGroup,
        handleDeleteEx,
        handleCreatedGroup,
        handleCreatedEx,
        findPublishedMenu: publishActions.findPublishedMenu,
        handlePublishGroup: publishActions.handlePublishGroup,
        handleUnpublishGroup: publishActions.handleUnpublishGroup,
        handleStartSingleExercise,
        handleStartCustomExercise,
        teacherExercises: teacherContent.teacherExercises,
        teacherExerciseIds: teacherContent.teacherExerciseIds,
        teacherMenuIds: teacherContent.teacherMenuIds,
        teacherExcludedExerciseIds: teacherContent.teacherExcludedExerciseIds,
        teacherRequiredExerciseIds: teacherContent.teacherRequiredExerciseIds,
        teacherHiddenExerciseIds: teacherContent.teacherHiddenExerciseIds,
        isNewTeacherContent: teacherContent.isNewTeacherContent,
        showPublicExerciseBrowser,
        setShowPublicExerciseBrowser,
        findPublishedExercise: publishActions.findPublishedExercise,
        handlePublishExercise: publishActions.handlePublishExercise,
        handleUnpublishExercise: publishActions.handleUnpublishExercise,
        toastMessage,
        clearToast: () => setToastMessage(null),
    };
}
