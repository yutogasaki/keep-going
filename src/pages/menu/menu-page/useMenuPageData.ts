import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISES, type Exercise } from '../../../data/exercises';
import { getMenuGroupItems, getPresetsForClass, type MenuGroup } from '../../../data/menuGroups';
import { audio } from '../../../lib/audio';
import { deleteCustomGroup, getCustomGroups, saveCustomGroup } from '../../../lib/customGroups';
import { subscribeCustomContentUpdated } from '../../../lib/customContentEvents';
import { buildCustomExerciseDeletePlan, buildCustomGroupDeletePlan } from '../../../lib/customContentDeletePlan';
import { deleteCustomExercise, getCustomExercises, type CustomExercise } from '../../../lib/db';
import {
    menuGroupReferencesExercise,
    pruneUnavailableExercisesFromMenuGroup,
    removeExerciseFromMenuGroup,
} from '../../../lib/menuExerciseCleanup';
import { findPublishedMenuMatch } from '../../../lib/publicContentMatches';
import { unpublishExercise } from '../../../lib/publicExercises';
import { fetchMyPublishedMenus, unpublishMenu } from '../../../lib/publicMenus';
import { resolveMenuGroupToSessionPlannedItems, type SessionPlannedItem } from '../../../lib/sessionPlan';
import { getAccountId } from '../../../lib/sync';
import { fetchTeacherExercises } from '../../../lib/teacherContent';
import type { UserProfileStore } from '../../../store/useAppStore';
import { useMenuExercises } from './useMenuExercises';
import { useMenuPublishActions } from './useMenuPublishActions';
import { useMenuUsers } from './useMenuUsers';
import { useTeacherContent } from './useTeacherContent';
import { filterVisibleCustomExercises, filterVisibleCustomGroups } from './customMenuLoadUtils';
import type { MenuToastMessage } from './shared';
import type { MenuTab } from './types';

interface UseMenuPageDataParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    startSessionWithExercises: (
        ids: string[],
        options?: {
            sourceMenuId?: string | null;
            sourceMenuSource?: 'preset' | 'teacher' | 'custom' | 'public' | null;
            sourceMenuName?: string | null;
        },
    ) => void;
    startSessionWithPlan: (
        items: SessionPlannedItem[],
        options?: {
            sourceMenuId?: string | null;
            sourceMenuSource?: 'preset' | 'teacher' | 'custom' | 'public' | null;
            sourceMenuName?: string | null;
        },
    ) => void;
    startHybridSession: (requiredIds: string[]) => void;
    updateUserSettings: (
        id: string,
        updates: Partial<Pick<UserProfileStore, 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>>,
    ) => void;
}

export function useMenuPageData({
    users,
    sessionUserIds,
    startSessionWithExercises,
    startSessionWithPlan,
    startHybridSession,
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
    const customDataLoadVersionRef = useRef(0);

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
    const { myPublishedExercises, myPublishedMenus, refreshPublishedData } = publishActions;

    const presets = useMemo(() => getPresetsForClass(userContext.classLevel), [userContext.classLevel]);

    const exerciseData = useMenuExercises({
        classLevel: userContext.classLevel,
        presets,
        customExercises,
        teacherExercises: teacherContent.teacherExercises,
        teacherMenus: teacherContent.teacherMenus,
        teacherSettings: teacherContent.teacherSettings,
        teacherHiddenExerciseIds: teacherContent.teacherHiddenExerciseIds,
        teacherHiddenMenuIds: teacherContent.teacherHiddenMenuIds,
        overrideMap: teacherContent.overrideMap,
        requiredExercises: userContext.requiredExercises,
        excludedExercises: userContext.excludedExercises,
    });
    const teacherExercises = teacherContent.teacherExercises;

    const sessionExerciseLookup = useMemo<
        Map<string, Exercise | CustomExercise | (typeof teacherExercises)[number]>
    >(() => {
        const lookup = new Map<string, Exercise | CustomExercise | (typeof teacherExercises)[number]>();
        for (const exercise of exerciseData.exercises) {
            lookup.set(exercise.id, exercise);
        }
        for (const exercise of customExercises) {
            lookup.set(exercise.id, exercise);
        }
        for (const exercise of teacherExercises) {
            lookup.set(exercise.id, exercise);
        }
        return lookup;
    }, [customExercises, exerciseData.exercises, teacherExercises]);

    const loadCustomData = useCallback(async () => {
        const loadVersion = customDataLoadVersionRef.current + 1;
        customDataLoadVersionRef.current = loadVersion;
        const [allGroups, allExercises] = await Promise.all([getCustomGroups(), getCustomExercises()]);

        if (customDataLoadVersionRef.current !== loadVersion) {
            return;
        }

        setCustomGroups(filterVisibleCustomGroups(allGroups, userContext.currentUserId, userContext.isTogetherMode));
        setCustomExercises(
            filterVisibleCustomExercises(allExercises, userContext.currentUserId, userContext.isTogetherMode),
        );

        const [allTeacherExercises, publishedMenus] = await Promise.all([
            fetchTeacherExercises(),
            getAccountId() ? fetchMyPublishedMenus() : Promise.resolve([]),
        ]);

        if (customDataLoadVersionRef.current !== loadVersion) {
            return;
        }

        const availableExerciseIds = new Set([
            ...EXERCISES.map((exercise) => exercise.id),
            ...allExercises.map((exercise) => exercise.id),
            ...allTeacherExercises.map((exercise) => exercise.id),
        ]);

        const sanitizedGroups: MenuGroup[] = [];
        for (const group of allGroups) {
            const nextGroup = pruneUnavailableExercisesFromMenuGroup(group, availableExerciseIds);
            if (nextGroup !== group) {
                const publishedMenu = findPublishedMenuMatch(group, publishedMenus);
                if (publishedMenu) {
                    await unpublishMenu(publishedMenu.id);
                }
            }

            if (nextGroup === null) {
                await deleteCustomGroup(group.id);
                continue;
            }

            if (nextGroup !== group) {
                await saveCustomGroup(nextGroup);
            }

            sanitizedGroups.push(nextGroup);
        }

        if (customDataLoadVersionRef.current !== loadVersion) {
            return;
        }

        setCustomGroups(
            filterVisibleCustomGroups(sanitizedGroups, userContext.currentUserId, userContext.isTogetherMode),
        );

        setCustomExercises(
            filterVisibleCustomExercises(allExercises, userContext.currentUserId, userContext.isTogetherMode),
        );

        await refreshPublishedData();
    }, [refreshPublishedData, userContext.currentUserId, userContext.isTogetherMode]);

    useEffect(() => {
        void loadCustomData();
    }, [loadCustomData]);

    useEffect(() => {
        return subscribeCustomContentUpdated(() => {
            void loadCustomData();
        });
    }, [loadCustomData]);

    const handleGroupTap = useCallback(
        (group: MenuGroup) => {
            audio.initTTS();
            const menuItems = getMenuGroupItems(group);
            const hasInlineItems = menuItems.some((item) => item.kind === 'inline_only');
            const sessionOptions = {
                sourceMenuId: group.id,
                sourceMenuSource: teacherContent.teacherMenuIds.has(group.id)
                    ? 'teacher'
                    : group.isPreset
                      ? 'preset'
                      : 'custom',
                sourceMenuName: group.name,
            } as const;

            if (hasInlineItems) {
                const plannedItems = resolveMenuGroupToSessionPlannedItems(group, sessionExerciseLookup);
                startSessionWithPlan(plannedItems, sessionOptions);
                return;
            }

            startSessionWithExercises(group.exerciseIds, sessionOptions);
        },
        [sessionExerciseLookup, startSessionWithExercises, startSessionWithPlan, teacherContent.teacherMenuIds],
    );

    const handleDeleteGroup = useCallback(
        async (groupId: string) => {
            const targetGroup = customGroups.find((group) => group.id === groupId) ?? null;
            const deletePlan = buildCustomGroupDeletePlan(targetGroup, myPublishedMenus);

            try {
                if (deletePlan.publishedMenuId) {
                    await unpublishMenu(deletePlan.publishedMenuId);
                }

                await deleteCustomGroup(groupId);
                await loadCustomData();
                showToast({
                    text: deletePlan.isPublished
                        ? '公開メニューを非公開にしてから削除しました'
                        : 'メニューを削除しました',
                    type: 'success',
                });
            } catch (error) {
                console.warn('[menu] group delete failed:', error);
                await loadCustomData();
                showToast({
                    text: deletePlan.isPublished
                        ? '公開メニューを非公開にできなかったため削除を中止しました'
                        : 'メニューの削除に失敗しました',
                    type: 'error',
                });
            }
        },
        [customGroups, loadCustomData, myPublishedMenus, showToast],
    );

    const handleDeleteEx = useCallback(
        async (exerciseId: string) => {
            const targetExercise = customExercises.find((exercise) => exercise.id === exerciseId) ?? null;
            const deletePlan = buildCustomExerciseDeletePlan(
                targetExercise,
                customGroups,
                myPublishedMenus,
                myPublishedExercises,
            );
            const impactedGroups = customGroups.filter((group) => menuGroupReferencesExercise(group, exerciseId));
            let updatedMenuCount = 0;
            let deletedMenuCount = 0;

            try {
                for (const publishedMenuId of deletePlan.publishedMenuIds) {
                    await unpublishMenu(publishedMenuId);
                }

                if (deletePlan.publishedExerciseId) {
                    await unpublishExercise(deletePlan.publishedExerciseId);
                }

                for (const group of impactedGroups) {
                    const nextGroup = removeExerciseFromMenuGroup(group, exerciseId);
                    if (nextGroup === null) {
                        await deleteCustomGroup(group.id);
                        deletedMenuCount += 1;
                        continue;
                    }

                    if (nextGroup !== group) {
                        await saveCustomGroup(nextGroup);
                        updatedMenuCount += 1;
                    }
                }

                await deleteCustomExercise(exerciseId);
                await loadCustomData();
            } catch (error) {
                console.warn('[menu] exercise delete failed:', error);
                await loadCustomData();
                showToast({
                    text:
                        deletePlan.isPublished || deletePlan.publishedMenuIds.length > 0
                            ? '公開中の種目やメニューを非公開にできなかったため削除を中止しました'
                            : 'じぶん種目の削除に失敗しました',
                    type: 'error',
                });
                return;
            }

            const summaryParts = [
                deletePlan.isPublished ? '公開中の種目を非公開にしました' : '',
                deletePlan.publishedMenuIds.length > 0
                    ? `${deletePlan.publishedMenuIds.length}つの公開メニューを非公開にしました`
                    : '',
                updatedMenuCount > 0 ? `${updatedMenuCount}つのメニューから外しました` : '',
                deletedMenuCount > 0 ? `${deletedMenuCount}つの空メニューを削除しました` : '',
            ].filter((part) => part.length > 0);

            if (summaryParts.length === 0) {
                showToast({ text: 'じぶん種目を削除しました', type: 'success' });
                return;
            }

            showToast({
                text: `じぶん種目を削除し、${summaryParts.join('・')}`,
                type: 'success',
            });
        },
        [customExercises, customGroups, loadCustomData, myPublishedExercises, myPublishedMenus, showToast],
    );

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

    const handleStartSingleExercise = useCallback(
        (exerciseId: string) => {
            audio.initTTS();
            startSessionWithExercises([exerciseId]);
        },
        [startSessionWithExercises],
    );

    const handleStartCustomExercise = useCallback(
        (exerciseId: string) => {
            startSessionWithExercises([exerciseId]);
        },
        [startSessionWithExercises],
    );

    const handleStartHybridSession = useCallback(
        (requiredIds: string[]) => {
            audio.initTTS();
            startHybridSession(requiredIds);
        },
        [startHybridSession],
    );

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
        effectiveRequiredExerciseIds: exerciseData.effectiveRequiredExerciseIds,
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
        myPublishedMenus,
        myPublishedExercises,
        findPublishedMenu: publishActions.findPublishedMenu,
        handlePublishGroup: publishActions.handlePublishGroup,
        handleUnpublishGroup: publishActions.handleUnpublishGroup,
        handleStartSingleExercise,
        handleStartCustomExercise,
        handleStartHybridSession,
        teacherExercises: teacherContent.teacherExercises,
        teacherMenus: teacherContent.teacherMenus,
        teacherSettings: teacherContent.teacherSettings,
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
