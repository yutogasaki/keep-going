import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_SESSION_TARGET_SECONDS, EXERCISES, getExercisesByClass, type Exercise } from '../../../data/exercises';
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
import {
    fetchMyPublishedExercises,
    publishExercise,
    unpublishExercise,
    type PublicExercise,
} from '../../../lib/publicExercises';
import { fetchTeacherExercises, fetchTeacherMenus, type TeacherExercise, type TeacherMenu } from '../../../lib/teacherContent';
import { fetchTeacherMenuSettingsForClass } from '../../../lib/teacherMenuSettings';
import { fetchAllTeacherItemOverrides } from '../../../lib/teacherItemOverrides';
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
    const [showPublicExerciseBrowser, setShowPublicExerciseBrowser] = useState(false);
    const [myPublishedMenus, setMyPublishedMenus] = useState<PublicMenu[]>([]);
    const [myPublishedExercises, setMyPublishedExercises] = useState<PublicExercise[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [teacherExcludedExerciseIds, setTeacherExcludedExerciseIds] = useState<Set<string>>(new Set());
    const [, setTeacherExcludedMenuIds] = useState<Set<string>>(new Set());
    const [teacherRequiredExerciseIds, setTeacherRequiredExerciseIds] = useState<Set<string>>(new Set());
    const [teacherHiddenExerciseIds, setTeacherHiddenExerciseIds] = useState<Set<string>>(new Set());
    const [teacherHiddenMenuIds, setTeacherHiddenMenuIds] = useState<Set<string>>(new Set());
    const [overrideMap, setOverrideMap] = useState<Map<string, { name: string | null; description: string | null; emoji: string | null; sec: number | null; hasSplit: boolean | null; exerciseIds: string[] | null }>>(new Map());

    const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
            fetchMyPublishedExercises().then(setMyPublishedExercises).catch(console.warn);
        }

        // Load teacher content, settings, and overrides
        try {
            const [tExercises, tMenus, tSettings, tOverrides] = await Promise.all([
                fetchTeacherExercises(),
                fetchTeacherMenus(),
                fetchTeacherMenuSettingsForClass(classLevel),
                fetchAllTeacherItemOverrides(),
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
            const hiddenEx = new Set(
                tSettings.filter(s => s.itemType === 'exercise' && s.status === 'hidden').map(s => s.itemId),
            );
            const hiddenMenu = new Set(
                tSettings.filter(s => s.itemType === 'menu_group' && s.status === 'hidden').map(s => s.itemId),
            );
            setTeacherExcludedExerciseIds(excludedEx);
            setTeacherExcludedMenuIds(excludedMenu);
            setTeacherRequiredExerciseIds(requiredEx);
            setTeacherHiddenExerciseIds(hiddenEx);
            setTeacherHiddenMenuIds(hiddenMenu);

            // Build override lookup map
            const oMap = new Map<string, { name: string | null; description: string | null; emoji: string | null; sec: number | null; hasSplit: boolean | null; exerciseIds: string[] | null }>();
            for (const ov of tOverrides) {
                oMap.set(`${ov.itemType}:${ov.itemId}`, {
                    name: ov.nameOverride,
                    description: ov.descriptionOverride,
                    emoji: ov.emojiOverride,
                    sec: ov.secOverride,
                    hasSplit: ov.hasSplitOverride,
                    exerciseIds: ov.exerciseIdsOverride,
                });
            }
            setOverrideMap(oMap);
        } catch (err) {
            console.warn('[menu] Failed to load teacher content:', err);
            setToastMessage({ text: '先生の設定を読み込めませんでした', type: 'error' });
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
            setToastMessage({ text: 'メニューを公開しました！', type: 'success' });
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] publish failed:', error);
            setToastMessage({ text: '公開に失敗しました', type: 'error' });
        }
    };

    const handleUnpublishGroup = async (group: MenuGroup) => {
        const publishedMenu = findPublishedMenu(group);
        if (!publishedMenu) {
            return;
        }

        try {
            await unpublishMenu(publishedMenu.id);
            setToastMessage({ text: 'メニューを非公開にしました', type: 'success' });
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] unpublish failed:', error);
            setToastMessage({ text: '非公開に失敗しました', type: 'error' });
        }
    };

    // ─── Exercise publish/unpublish ─────────────────

    const findPublishedExercise = useCallback((exercise: CustomExercise): PublicExercise | undefined => {
        return myPublishedExercises.find(
            (pub) => pub.name === exercise.name
                && pub.emoji === exercise.emoji
                && pub.sec === exercise.sec,
        );
    }, [myPublishedExercises]);

    const handlePublishExercise = async (exercise: CustomExercise) => {
        if (!getAccountId()) return;
        const authorName = currentUsers[0]?.name ?? 'ゲスト';
        try {
            await publishExercise(exercise, authorName);
            setToastMessage({ text: '種目を公開しました！', type: 'success' });
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] exercise publish failed:', error);
            setToastMessage({ text: '公開に失敗しました', type: 'error' });
        }
    };

    const handleUnpublishExercise = async (exercise: CustomExercise) => {
        const pub = findPublishedExercise(exercise);
        if (!pub) return;
        try {
            await unpublishExercise(pub.id);
            setToastMessage({ text: '種目を非公開にしました', type: 'success' });
            void loadCustomData();
        } catch (error) {
            console.warn('[menu] exercise unpublish failed:', error);
            setToastMessage({ text: '非公開に失敗しました', type: 'error' });
        }
    };

    // Effective excluded/required counts: merge user settings with teacher defaults
    // Uses the same priority logic as CustomMenuModal (user > teacher)
    const effectiveCounts = useMemo(() => {
        const userRequiredSet = new Set(requiredExercises);
        const userExcludedSet = new Set(excludedExercises);
        let requiredCount = 0;
        let excludedCount = 0;

        // We iterate over all exercise IDs visible to this class
        // (built-in filtered by class + teacher exercises, both minus hidden)
        const builtInIds = getExercisesByClass(classLevel)
            .filter(e => !teacherHiddenExerciseIds.has(e.id))
            .map(e => e.id);
        const teacherIds = teacherExercises
            .filter(te => !teacherHiddenExerciseIds.has(te.id))
            .map(te => te.id);
        const allVisibleIds = [...builtInIds, ...teacherIds];

        for (const id of allVisibleIds) {
            const isTeacherRequired = teacherRequiredExerciseIds.has(id);
            const isTeacherExcluded = teacherExcludedExerciseIds.has(id);
            const isUserRequired = userRequiredSet.has(id);
            const isUserExcluded = userExcludedSet.has(id);

            const isRequired = isUserRequired || (isTeacherRequired && !isUserExcluded);
            const isExcluded = !isRequired && (isUserExcluded || (isTeacherExcluded && !isUserRequired));

            if (isRequired) requiredCount++;
            if (isExcluded) excludedCount++;
        }

        return { requiredCount, excludedCount };
    }, [
        classLevel,
        teacherExercises,
        teacherHiddenExerciseIds,
        teacherRequiredExerciseIds,
        teacherExcludedExerciseIds,
        requiredExercises,
        excludedExercises,
    ]);

    // Merge built-in exercises with teacher exercises
    // hidden = completely invisible, excluded = visible but not in auto-generation
    const exercises = useMemo(() => {
        const builtIn = getExercisesByClass(classLevel)
            .filter(e => !teacherHiddenExerciseIds.has(e.id))
            .map(e => {
                const ov = overrideMap.get(`exercise:${e.id}`);
                if (ov) {
                    return {
                        ...e,
                        name: ov.name ?? e.name,
                        description: ov.description ?? e.description,
                        emoji: ov.emoji ?? e.emoji,
                        sec: ov.sec ?? e.sec,
                        hasSplit: ov.hasSplit ?? e.hasSplit,
                    };
                }
                return e;
            });

        const teacherAsExercise: Exercise[] = teacherExercises
            .filter(te => !teacherHiddenExerciseIds.has(te.id))
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

        // Add rest exercises (excluded from getExercisesByClass but needed for manual menu building)
        const restExercises = EXERCISES
            .filter(e => e.type === 'rest' && !teacherHiddenExerciseIds.has(e.id));

        return [...builtIn, ...teacherAsExercise, ...restExercises];
    }, [classLevel, teacherExercises, teacherHiddenExerciseIds, overrideMap]);

    // Lookup map for all exercise types (built-in with overrides + teacher + custom)
    const exerciseMap = useMemo(() => {
        const map = new Map<string, { name: string; emoji: string; sec: number }>();
        for (const ex of exercises) {
            map.set(ex.id, { name: ex.name, emoji: ex.emoji, sec: ex.sec });
        }
        for (const ce of customExercises) {
            map.set(ce.id, { name: ce.name, emoji: ce.emoji, sec: ce.sec });
        }
        return map;
    }, [exercises, customExercises]);

    // Merge presets with teacher menus
    // hidden = completely invisible, excluded = visible but not in auto-generation
    const mergedPresets = useMemo(() => {
        const filteredPresets = presets
            .filter(p => !teacherHiddenMenuIds.has(p.id))
            .map(p => {
                const ov = overrideMap.get(`menu_group:${p.id}`);
                if (ov) {
                    return {
                        ...p,
                        name: ov.name ?? p.name,
                        description: ov.description ?? p.description,
                        emoji: ov.emoji ?? p.emoji,
                        exerciseIds: ov.exerciseIds ?? p.exerciseIds,
                    };
                }
                return p;
            });

        const teacherAsGroup: MenuGroup[] = teacherMenus
            .filter(tm => !teacherHiddenMenuIds.has(tm.id))
            .map(tm => ({
                id: tm.id,
                name: tm.name,
                emoji: tm.emoji,
                description: tm.description,
                exerciseIds: tm.exerciseIds,
                isPreset: true,
            }));

        return [...filteredPresets, ...teacherAsGroup];
    }, [presets, teacherMenus, teacherHiddenMenuIds, overrideMap]);

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
        exerciseMap,
        autoMenuMinutes,
        canPublish,
        effectiveRequiredCount: effectiveCounts.requiredCount,
        effectiveExcludedCount: effectiveCounts.excludedCount,
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
        teacherExercises,
        teacherExerciseIds,
        teacherMenuIds,
        teacherExcludedExerciseIds,
        teacherRequiredExerciseIds,
        teacherHiddenExerciseIds,
        isNewTeacherContent,
        showPublicExerciseBrowser,
        setShowPublicExerciseBrowser,
        findPublishedExercise,
        handlePublishExercise,
        handleUnpublishExercise,
        toastMessage,
        clearToast: () => setToastMessage(null),
    };
}
