import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SESSION_TARGET_SECONDS, getExercisesByClass, type Exercise } from '../../../data/exercises';
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
import { fetchTeacherExercises, fetchTeacherMenus, type TeacherExercise, type TeacherMenu } from '../../../lib/teacherContent';
import { fetchTeacherMenuSettingsForClass } from '../../../lib/teacherMenuSettings';
import type { UserProfileStore } from '../../../store/useAppStore';
import { getCreatorNameById, getMinClassLevel } from '../menuPageUtils';
import type { MenuTab } from './types';

const NEW_BADGE_DAYS = 14;

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
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [teacherExcludedExerciseIds, setTeacherExcludedExerciseIds] = useState<Set<string>>(new Set());
    const [teacherExcludedMenuIds, setTeacherExcludedMenuIds] = useState<Set<string>>(new Set());
    const [teacherRequiredExerciseIds, setTeacherRequiredExerciseIds] = useState<Set<string>>(new Set());

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

        // Load teacher content and settings
        try {
            const [tExercises, tMenus, tSettings] = await Promise.all([
                fetchTeacherExercises(),
                fetchTeacherMenus(),
                fetchTeacherMenuSettingsForClass(classLevel),
            ]);

            // Filter teacher content by class level
            const filteredExercises = tExercises.filter(
                te => te.classLevels.length === 0 || te.classLevels.includes(classLevel),
            );
            const filteredMenus = tMenus.filter(
                tm => tm.classLevels.length === 0 || tm.classLevels.includes(classLevel),
            );

            setTeacherExercises(filteredExercises);
            setTeacherMenus(filteredMenus);

            // Parse teacher settings
            const excludedEx = new Set(
                tSettings.filter(s => s.itemType === 'exercise' && s.status === 'excluded').map(s => s.itemId),
            );
            const excludedMenu = new Set(
                tSettings.filter(s => s.itemType === 'menu_group' && s.status === 'excluded').map(s => s.itemId),
            );
            const requiredEx = new Set(
                tSettings.filter(s => s.itemType === 'exercise' && s.status === 'required').map(s => s.itemId),
            );
            setTeacherExcludedExerciseIds(excludedEx);
            setTeacherExcludedMenuIds(excludedMenu);
            setTeacherRequiredExerciseIds(requiredEx);
        } catch (err) {
            console.warn('[menu] Failed to load teacher content:', err);
        }
    }, [isTogetherMode, sessionUserIds, users, classLevel]);

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

    // Merge built-in exercises with teacher exercises, filter out teacher-excluded
    const exercises = useMemo(() => {
        const builtIn = getExercisesByClass(classLevel)
            .filter(e => !teacherExcludedExerciseIds.has(e.id));

        const teacherAsExercise: Exercise[] = teacherExercises
            .filter(te => !teacherExcludedExerciseIds.has(te.id))
            .map(te => ({
                id: te.id,
                name: te.name,
                sec: te.sec,
                emoji: te.emoji,
                hasSplit: te.hasSplit,
                description: te.description,
                type: 'stretch' as const,
                internal: te.hasSplit ? 'R30→L30' : 'single',
                classes: ['プレ' as const, '初級' as const, '中級' as const, '上級' as const],
                priority: 'medium' as const,
                phase: 'main' as const,
            }));

        return [...builtIn, ...teacherAsExercise];
    }, [classLevel, teacherExercises, teacherExcludedExerciseIds]);

    // Merge presets with teacher menus, filter out teacher-excluded
    const mergedPresets = useMemo(() => {
        const filteredPresets = presets.filter(p => !teacherExcludedMenuIds.has(p.id));

        const teacherAsGroup: MenuGroup[] = teacherMenus
            .filter(tm => !teacherExcludedMenuIds.has(tm.id))
            .map(tm => ({
                id: tm.id,
                name: tm.name,
                emoji: tm.emoji,
                description: tm.description,
                exerciseIds: tm.exerciseIds,
                isPreset: true,
            }));

        return [...filteredPresets, ...teacherAsGroup];
    }, [presets, teacherMenus, teacherExcludedMenuIds]);

    // Track teacher content IDs for badges
    const teacherExerciseIds = useMemo(
        () => new Set(teacherExercises.map(te => te.id)),
        [teacherExercises],
    );
    const teacherMenuIds = useMemo(
        () => new Set(teacherMenus.map(tm => tm.id)),
        [teacherMenus],
    );

    const isNewTeacherContent = useCallback((id: string): boolean => {
        const te = teacherExercises.find(e => e.id === id);
        if (te) {
            const daysDiff = (Date.now() - new Date(te.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= NEW_BADGE_DAYS;
        }
        const tm = teacherMenus.find(m => m.id === id);
        if (tm) {
            const daysDiff = (Date.now() - new Date(tm.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= NEW_BADGE_DAYS;
        }
        return false;
    }, [teacherExercises, teacherMenus]);

    const autoMenuMinutes = Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60);
    const canPublish = !!getAccountId();

    return {
        tab,
        setTab,
        classLevel,
        presets: mergedPresets,
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
        teacherExerciseIds,
        teacherMenuIds,
        teacherExcludedExerciseIds,
        teacherRequiredExerciseIds,
        isNewTeacherContent,
    };
}
