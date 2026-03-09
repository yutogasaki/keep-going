import { useCallback, useState } from 'react';
import { EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import {
    createTeacherExercise,
    createTeacherMenu,
    deleteTeacherExercise,
    deleteTeacherMenu,
    updateTeacherExercise,
    updateTeacherMenu,
} from '../../../lib/teacherContent';
import { dispatchTeacherContentUpdated } from '../../../lib/teacherContentEvents';
import { upsertTeacherItemOverride } from '../../../lib/teacherItemOverrides';
import {
    upsertTeacherMenuSetting,
    type MenuSettingItemType,
    type MenuSettingStatus,
} from '../../../lib/teacherMenuSettings';
import {
    buildBuiltInExerciseInitial,
    buildBuiltInMenuInitial,
    getMenuSettingStatusByClass,
    hasStatusByClassChanges,
    getTeacherItemOverride,
    saveStatuses,
} from './menuSettingsControllerHelpers';
import type {
    ExerciseEditorValues,
    MenuEditorValues,
    UseMenuSettingsControllerParams,
} from './menuSettingsControllerTypes';
import { useMenuSettingsData } from './useMenuSettingsData';
import { useMenuSettingsEditorState } from './useMenuSettingsEditorState';

export function useMenuSettingsController({ teacherEmail }: UseMenuSettingsControllerParams) {
    const {
        error,
        loadAll,
        loading,
        overrides,
        setError,
        setSettings,
        settings,
        teacherExercises,
        teacherMenus,
    } = useMenuSettingsData();
    const {
        clearDeleteTarget,
        closeExerciseForm,
        closeMenuForm,
        deleteTarget,
        editingBuiltInExerciseId,
        editingBuiltInMenuId,
        editingExercise,
        editingMenu,
        expandedItemId,
        handleDeleteExerciseFromEditor,
        handleDeleteMenuFromEditor,
        openBuiltInExerciseEditor,
        openBuiltInMenuEditor,
        openNewExerciseForm,
        openNewMenuForm,
        openTeacherExerciseEditor,
        openTeacherMenuEditor,
        promptDeleteExercise,
        promptDeleteMenu,
        resetTransientUi,
        setDeleteTarget,
        showExerciseForm,
        showMenuForm,
        toggleExpandedItem,
    } = useMenuSettingsEditorState();
    const [submitting, setSubmitting] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const getStatusByClass = useCallback((itemId: string, itemType: MenuSettingItemType) => {
        return getMenuSettingStatusByClass(settings, itemId, itemType);
    }, [settings]);

    const getOverride = useCallback((itemId: string, itemType: 'exercise' | 'menu_group') => {
        return getTeacherItemOverride(overrides, itemId, itemType);
    }, [overrides]);

    const handleStatusChange = useCallback(async (
        itemId: string,
        itemType: MenuSettingItemType,
        classLevel: string,
        newStatus: MenuSettingStatus,
    ) => {
        setError(null);

        setSettings((prev) => {
            const filtered = prev.filter(
                (setting) => !(
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
    }, [loadAll, setError, setSettings, teacherEmail]);

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

                const currentStatusByClass = getStatusByClass(itemId, 'exercise');
                if (itemId && hasStatusByClassChanges(data.statusByClass, currentStatusByClass)) {
                    await saveStatuses(itemId, 'exercise', data.statusByClass, teacherEmail);
                }
            }

            closeExerciseForm();
            await loadAll();
            dispatchTeacherContentUpdated();
        } catch (err) {
            console.warn('[MenuSettings] save exercise failed:', err);
            setError(err instanceof Error ? `種目の保存に失敗しました: ${err.message}` : '種目の保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    }, [closeExerciseForm, editingBuiltInExerciseId, editingExercise, loadAll, setError, teacherEmail]);

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

                const currentStatusByClass = getStatusByClass(itemId, 'menu_group');
                if (itemId && hasStatusByClassChanges(data.statusByClass, currentStatusByClass)) {
                    await saveStatuses(itemId, 'menu_group', data.statusByClass, teacherEmail);
                }
            }

            closeMenuForm();
            await loadAll();
            dispatchTeacherContentUpdated();
        } catch (err) {
            console.warn('[MenuSettings] save menu failed:', err);
            setError(err instanceof Error ? `メニューの保存に失敗しました: ${err.message}` : 'メニューの保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    }, [closeMenuForm, editingBuiltInMenuId, editingMenu, loadAll, setError, teacherEmail]);

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
    }, [closeExerciseForm, closeMenuForm, deleteTarget, editingExercise, editingMenu, loadAll, setDeleteTarget]);

    const exerciseEditorInitial = editingExercise
        ?? (editingBuiltInExerciseId ? buildBuiltInExerciseInitial(editingBuiltInExerciseId, overrides) : null);
    const exerciseEditorStatuses = editingExercise
        ? getStatusByClass(editingExercise.id, 'exercise')
        : editingBuiltInExerciseId
            ? getStatusByClass(editingBuiltInExerciseId, 'exercise')
            : undefined;
    const exerciseEditorItemId = editingExercise?.id ?? editingBuiltInExerciseId;

    const menuEditorInitial = editingMenu
        ?? (editingBuiltInMenuId ? buildBuiltInMenuInitial(editingBuiltInMenuId, overrides) : null);
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
