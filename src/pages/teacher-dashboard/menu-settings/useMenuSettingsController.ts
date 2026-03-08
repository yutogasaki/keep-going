import { useCallback, useEffect, useState } from 'react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import {
    createTeacherExercise,
    createTeacherMenu,
    deleteTeacherExercise,
    deleteTeacherMenu,
    fetchTeacherExercises,
    fetchTeacherMenus,
    type TeacherExercise,
    type TeacherMenu,
    updateTeacherExercise,
    updateTeacherMenu,
} from '../../../lib/teacherContent';
import {
    fetchAllTeacherItemOverrides,
    type TeacherItemOverride,
    upsertTeacherItemOverride,
} from '../../../lib/teacherItemOverrides';
import {
    fetchAllTeacherMenuSettings,
    type MenuSettingItemType,
    type MenuSettingStatus,
    type TeacherMenuSetting,
    upsertTeacherMenuSetting,
} from '../../../lib/teacherMenuSettings';
import { dispatchTeacherContentUpdated } from '../../../lib/teacherContentEvents';

interface UseMenuSettingsControllerParams {
    teacherEmail: string;
}

interface DeleteTarget {
    id: string;
    type: 'exercise' | 'menu';
    name: string;
}

interface ExerciseEditorValues {
    name: string;
    sec: number;
    emoji: string;
    placement: TeacherExercise['placement'];
    hasSplit: boolean;
    description: string;
    classLevels: string[];
    statusByClass?: Record<string, MenuSettingStatus>;
}

interface MenuEditorValues {
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    classLevels: string[];
    statusByClass?: Record<string, MenuSettingStatus>;
}

async function saveStatuses(
    itemId: string,
    itemType: MenuSettingItemType,
    statusByClass: Record<string, MenuSettingStatus> | undefined,
    teacherEmail: string,
): Promise<void> {
    if (!statusByClass) return;

    await Promise.all(
        Object.entries(statusByClass).map(([classLevel, status]) =>
            upsertTeacherMenuSetting(itemId, itemType, classLevel, status, teacherEmail)
        )
    );
}

export function useMenuSettingsController({ teacherEmail }: UseMenuSettingsControllerParams) {
    const [settings, setSettings] = useState<TeacherMenuSetting[]>([]);
    const [overrides, setOverrides] = useState<TeacherItemOverride[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [showExerciseForm, setShowExerciseForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState<TeacherExercise | null>(null);
    const [editingBuiltInExerciseId, setEditingBuiltInExerciseId] = useState<string | null>(null);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState<TeacherMenu | null>(null);
    const [editingBuiltInMenuId, setEditingBuiltInMenuId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [nextSettings, nextTeacherExercises, nextTeacherMenus, nextOverrides] = await Promise.all([
                fetchAllTeacherMenuSettings(true),
                fetchTeacherExercises(true),
                fetchTeacherMenus(true),
                fetchAllTeacherItemOverrides(true),
            ]);
            setSettings(nextSettings);
            setTeacherExercises(nextTeacherExercises);
            setTeacherMenus(nextTeacherMenus);
            setOverrides(nextOverrides);
            setError(null);
        } catch (err) {
            console.warn('[MenuSettings] load failed:', err);
            setError('データの読み込みに失敗しました。Supabase で deploy.sql を実行してテーブルを作成してください。');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAll();
    }, [loadAll]);

    const getStatus = useCallback((itemId: string, itemType: MenuSettingItemType, classLevel: string): MenuSettingStatus => {
        const found = settings.find(
            (setting) =>
                setting.itemId === itemId
                && setting.itemType === itemType
                && setting.classLevel === classLevel
        );
        return found?.status ?? 'optional';
    }, [settings]);

    const getStatusByClass = useCallback((itemId: string, itemType: MenuSettingItemType) => {
        const statusByClass: Record<string, MenuSettingStatus> = {};
        for (const classLevel of CLASS_LEVELS) {
            statusByClass[classLevel.id] = getStatus(itemId, itemType, classLevel.id);
        }
        return statusByClass;
    }, [getStatus]);

    const getOverride = useCallback((itemId: string, itemType: TeacherItemOverride['itemType']) => {
        return overrides.find((override) => override.itemId === itemId && override.itemType === itemType);
    }, [overrides]);

    const closeExerciseForm = useCallback(() => {
        setShowExerciseForm(false);
        setEditingExercise(null);
        setEditingBuiltInExerciseId(null);
    }, []);

    const closeMenuForm = useCallback(() => {
        setShowMenuForm(false);
        setEditingMenu(null);
        setEditingBuiltInMenuId(null);
    }, []);

    const resetTransientUi = useCallback(() => {
        setExpandedItemId(null);
        closeExerciseForm();
        closeMenuForm();
    }, [closeExerciseForm, closeMenuForm]);

    const openNewExerciseForm = useCallback(() => {
        setEditingExercise(null);
        setEditingBuiltInExerciseId(null);
        setShowExerciseForm(true);
    }, []);

    const openTeacherExerciseEditor = useCallback((exercise: TeacherExercise) => {
        setEditingExercise(exercise);
        setEditingBuiltInExerciseId(null);
        setShowExerciseForm(true);
    }, []);

    const openBuiltInExerciseEditor = useCallback((exerciseId: string) => {
        setEditingBuiltInExerciseId(exerciseId);
        setEditingExercise(null);
        setShowExerciseForm(true);
    }, []);

    const openNewMenuForm = useCallback(() => {
        setEditingMenu(null);
        setEditingBuiltInMenuId(null);
        setShowMenuForm(true);
    }, []);

    const openTeacherMenuEditor = useCallback((menu: TeacherMenu) => {
        setEditingMenu(menu);
        setEditingBuiltInMenuId(null);
        setShowMenuForm(true);
    }, []);

    const openBuiltInMenuEditor = useCallback((menuId: string) => {
        setEditingBuiltInMenuId(menuId);
        setEditingMenu(null);
        setShowMenuForm(true);
    }, []);

    const toggleExpandedItem = useCallback((itemId: string) => {
        setExpandedItemId((prev) => (prev === itemId ? null : itemId));
    }, []);

    const clearDeleteTarget = useCallback(() => {
        setDeleteTarget(null);
    }, []);

    const promptDeleteExercise = useCallback((exercise: Pick<TeacherExercise, 'id' | 'name'>) => {
        setDeleteTarget({ id: exercise.id, type: 'exercise', name: exercise.name });
    }, []);

    const promptDeleteMenu = useCallback((menu: Pick<TeacherMenu, 'id' | 'name'>) => {
        setDeleteTarget({ id: menu.id, type: 'menu', name: menu.name });
    }, []);

    const handleDeleteExerciseFromEditor = useCallback(() => {
        if (!editingExercise) return;
        setDeleteTarget({ id: editingExercise.id, type: 'exercise', name: editingExercise.name });
    }, [editingExercise]);

    const handleDeleteMenuFromEditor = useCallback(() => {
        if (!editingMenu) return;
        setDeleteTarget({ id: editingMenu.id, type: 'menu', name: editingMenu.name });
    }, [editingMenu]);

    const handleStatusChange = useCallback(async (
        itemId: string,
        itemType: MenuSettingItemType,
        classLevel: string,
        newStatus: MenuSettingStatus,
    ) => {
        setError(null);

        setSettings((prev) => {
            const filtered = prev.filter(
                (setting) =>
                    !(
                        setting.itemId === itemId
                        && setting.itemType === itemType
                        && setting.classLevel === classLevel
                    )
            );

            if (newStatus !== 'optional') {
                filtered.push({
                    id: `temp-${Date.now()}`,
                    itemId,
                    itemType,
                    classLevel,
                    status: newStatus,
                    createdBy: teacherEmail,
                });
            }

            return filtered;
        });

        try {
            await upsertTeacherMenuSetting(itemId, itemType, classLevel, newStatus, teacherEmail);
            dispatchTeacherContentUpdated();
        } catch (err) {
            console.warn('[MenuSettings] status change failed:', err);
            setError('保存に失敗しました。deploy.sql を実行してテーブルを作成してください。');
            void loadAll();
        }
    }, [loadAll, teacherEmail]);

    const handleSaveExercise = useCallback(async (data: ExerciseEditorValues) => {
        setSubmitting(true);
        setError(null);

        try {
            if (editingBuiltInExerciseId) {
                const builtInExercise = EXERCISES.find((exercise) => exercise.id === editingBuiltInExerciseId);
                if (builtInExercise) {
                    await upsertTeacherItemOverride(
                        editingBuiltInExerciseId,
                        'exercise',
                        {
                            nameOverride: data.name !== builtInExercise.name ? data.name : null,
                            descriptionOverride:
                                data.description !== (builtInExercise.description ?? '')
                                    ? data.description
                                    : null,
                            emojiOverride: data.emoji !== builtInExercise.emoji ? data.emoji : null,
                            secOverride: data.sec !== builtInExercise.sec ? data.sec : null,
                            hasSplitOverride:
                                data.hasSplit !== (builtInExercise.hasSplit ?? false)
                                    ? data.hasSplit
                                    : null,
                        },
                        teacherEmail,
                    );
                }

                await saveStatuses(editingBuiltInExerciseId, 'exercise', data.statusByClass, teacherEmail);
            } else {
                let itemId = editingExercise?.id ?? '';
                if (editingExercise) {
                    await updateTeacherExercise(editingExercise.id, data);
                } else {
                    itemId = (await createTeacherExercise({ ...data, createdBy: teacherEmail })) ?? '';
                }

                if (itemId) {
                    await saveStatuses(itemId, 'exercise', data.statusByClass, teacherEmail);
                }
            }

            closeExerciseForm();
            await loadAll();
            dispatchTeacherContentUpdated();
        } catch (err) {
            console.warn('[MenuSettings] save exercise failed:', err);
            setError('種目の保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    }, [closeExerciseForm, editingBuiltInExerciseId, editingExercise, loadAll, teacherEmail]);

    const handleSaveMenu = useCallback(async (data: MenuEditorValues) => {
        setSubmitting(true);
        setError(null);

        try {
            if (editingBuiltInMenuId) {
                const builtInMenu = PRESET_GROUPS.find((group) => group.id === editingBuiltInMenuId);
                if (builtInMenu) {
                    await upsertTeacherItemOverride(
                        editingBuiltInMenuId,
                        'menu_group',
                        {
                            nameOverride: data.name !== builtInMenu.name ? data.name : null,
                            descriptionOverride:
                                data.description !== (builtInMenu.description ?? '')
                                    ? data.description
                                    : null,
                            emojiOverride: data.emoji !== builtInMenu.emoji ? data.emoji : null,
                            exerciseIdsOverride:
                                JSON.stringify(data.exerciseIds) !== JSON.stringify(builtInMenu.exerciseIds)
                                    ? data.exerciseIds
                                    : null,
                        },
                        teacherEmail,
                    );
                }

                await saveStatuses(editingBuiltInMenuId, 'menu_group', data.statusByClass, teacherEmail);
            } else {
                let itemId = editingMenu?.id ?? '';
                if (editingMenu) {
                    await updateTeacherMenu(editingMenu.id, data);
                } else {
                    itemId = (await createTeacherMenu({ ...data, createdBy: teacherEmail })) ?? '';
                }

                if (itemId) {
                    await saveStatuses(itemId, 'menu_group', data.statusByClass, teacherEmail);
                }
            }

            closeMenuForm();
            await loadAll();
            dispatchTeacherContentUpdated();
        } catch (err) {
            console.warn('[MenuSettings] save menu failed:', err);
            setError('メニューの保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    }, [closeMenuForm, editingBuiltInMenuId, editingMenu, loadAll, teacherEmail]);

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        setDeleteLoading(true);
        try {
            if (deleteTarget.type === 'exercise') {
                await deleteTeacherExercise(deleteTarget.id);
                if (editingExercise?.id === deleteTarget.id) closeExerciseForm();
            } else {
                await deleteTeacherMenu(deleteTarget.id);
                if (editingMenu?.id === deleteTarget.id) closeMenuForm();
            }

            await loadAll();
            dispatchTeacherContentUpdated();
        } catch (err) {
            console.warn('[MenuSettings] delete failed:', err);
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    }, [closeExerciseForm, closeMenuForm, deleteTarget, editingExercise, editingMenu, loadAll]);

    const buildBuiltInExerciseInitial = useCallback((exerciseId: string): TeacherExercise | null => {
        const exercise = EXERCISES.find((item) => item.id === exerciseId);
        if (!exercise) return null;

        const override = getOverride(exerciseId, 'exercise');
        return {
            id: exercise.id,
            name: override?.nameOverride ?? exercise.name,
            sec: override?.secOverride ?? exercise.sec,
            emoji: override?.emojiOverride ?? exercise.emoji,
            placement: exercise.placement,
            hasSplit: override?.hasSplitOverride ?? (exercise.hasSplit ?? false),
            description: override?.descriptionOverride ?? (exercise.description ?? ''),
            classLevels: exercise.classes as string[],
            createdBy: '',
            createdAt: '',
        };
    }, [getOverride]);

    const buildBuiltInMenuInitial = useCallback((menuId: string): TeacherMenu | null => {
        const group = PRESET_GROUPS.find((item) => item.id === menuId);
        if (!group) return null;

        const override = getOverride(menuId, 'menu_group');
        return {
            id: group.id,
            name: override?.nameOverride ?? group.name,
            emoji: override?.emojiOverride ?? group.emoji,
            description: override?.descriptionOverride ?? (group.description ?? ''),
            exerciseIds: override?.exerciseIdsOverride ?? group.exerciseIds,
            classLevels: [],
            createdBy: '',
            createdAt: '',
        };
    }, [getOverride]);

    const exerciseEditorInitial = editingExercise
        ?? (editingBuiltInExerciseId ? buildBuiltInExerciseInitial(editingBuiltInExerciseId) : null);
    const exerciseEditorStatuses = editingExercise
        ? getStatusByClass(editingExercise.id, 'exercise')
        : editingBuiltInExerciseId
            ? getStatusByClass(editingBuiltInExerciseId, 'exercise')
            : undefined;
    const exerciseEditorItemId = editingExercise?.id ?? editingBuiltInExerciseId;

    const menuEditorInitial = editingMenu
        ?? (editingBuiltInMenuId ? buildBuiltInMenuInitial(editingBuiltInMenuId) : null);
    const menuEditorStatuses = editingMenu
        ? getStatusByClass(editingMenu.id, 'menu_group')
        : editingBuiltInMenuId
            ? getStatusByClass(editingBuiltInMenuId, 'menu_group')
            : undefined;
    const menuEditorItemId = editingMenu?.id ?? editingBuiltInMenuId;

    return {
        deleteLoading,
        deleteTarget,
        error,
        expandedItemId,
        exerciseEditorInitial,
        exerciseEditorItemId,
        exerciseEditorStatuses,
        getOverride,
        getStatusByClass,
        handleConfirmDelete,
        handleDeleteExerciseFromEditor,
        handleDeleteMenuFromEditor,
        handleSaveExercise,
        handleSaveMenu,
        handleStatusChange,
        loading,
        menuEditorInitial,
        menuEditorItemId,
        menuEditorStatuses,
        openBuiltInExerciseEditor,
        openBuiltInMenuEditor,
        openNewExerciseForm,
        openNewMenuForm,
        openTeacherExerciseEditor,
        openTeacherMenuEditor,
        promptDeleteExercise,
        promptDeleteMenu,
        resetTransientUi,
        clearDeleteTarget,
        closeExerciseForm,
        closeMenuForm,
        showExerciseForm,
        showMenuForm,
        submitting,
        teacherExercises,
        teacherMenus,
        toggleExpandedItem,
        canDeleteExercise: editingExercise !== null,
        canDeleteMenu: editingMenu !== null,
        isBuiltInExerciseEditor: editingBuiltInExerciseId !== null,
    };
}
