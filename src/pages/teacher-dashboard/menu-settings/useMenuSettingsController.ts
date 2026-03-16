import { useCallback, useMemo, useState } from 'react';
import { EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import { deleteCustomGroup, saveCustomGroup } from '../../../lib/customGroups';
import {
    menuGroupReferencesExercise,
    removeExerciseFromMenuGroup,
    removeExerciseFromTeacherMenu,
    teacherMenuReferencesExercise,
} from '../../../lib/menuExerciseCleanup';
import { findPublishedMenuMatch } from '../../../lib/publicContentMatches';
import { fetchMyPublishedMenus, unpublishMenu } from '../../../lib/publicMenus';
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
    getUpdatedVisibleClassLevels,
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

function getUnknownErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }

    if (typeof error === 'string' && error.trim()) {
        return error.trim();
    }

    if (error && typeof error === 'object') {
        const candidate = error as {
            message?: unknown;
            details?: unknown;
            hint?: unknown;
            code?: unknown;
        };

        const parts = [
            typeof candidate.message === 'string' ? candidate.message.trim() : '',
            typeof candidate.details === 'string' ? candidate.details.trim() : '',
            typeof candidate.hint === 'string' ? candidate.hint.trim() : '',
            typeof candidate.code === 'string' ? `code: ${candidate.code}` : '',
        ].filter((part) => part.length > 0);

        if (parts.length > 0) {
            return parts.join(' / ');
        }
    }

    return fallback;
}

export function useMenuSettingsController({ teacherEmail }: UseMenuSettingsControllerParams) {
    const {
        customGroups,
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

    const getStatusByClass = useCallback(
        (itemId: string, itemType: MenuSettingItemType) => {
            return getMenuSettingStatusByClass(settings, itemId, itemType);
        },
        [settings],
    );

    const getOverride = useCallback(
        (itemId: string, itemType: 'exercise' | 'menu_group') => {
            return getTeacherItemOverride(overrides, itemId, itemType);
        },
        [overrides],
    );

    const handleStatusChange = useCallback(
        async (itemId: string, itemType: MenuSettingItemType, classLevel: string, newStatus: MenuSettingStatus) => {
            setError(null);
            const currentStatusByClass = getStatusByClass(itemId, itemType);

            setSettings((prev) => {
                const filtered = prev.filter(
                    (setting) =>
                        !(
                            setting.itemId === itemId &&
                            setting.itemType === itemType &&
                            setting.classLevel === classLevel
                        ),
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
                const teacherExercise =
                    itemType === 'exercise' ? teacherExercises.find((exercise) => exercise.id === itemId) : null;
                if (teacherExercise) {
                    const nextClassLevels = getUpdatedVisibleClassLevels(
                        teacherExercise.classLevels,
                        currentStatusByClass,
                        classLevel,
                        newStatus,
                    );

                    if (nextClassLevels) {
                        await updateTeacherExercise(teacherExercise.id, {
                            name: teacherExercise.name,
                            sec: teacherExercise.sec,
                            emoji: teacherExercise.emoji,
                            placement: teacherExercise.placement,
                            hasSplit: teacherExercise.hasSplit,
                            description: teacherExercise.description,
                            classLevels: nextClassLevels,
                            visibility: teacherExercise.visibility,
                            focusTags: teacherExercise.focusTags,
                            recommended: teacherExercise.recommended,
                            recommendedOrder: teacherExercise.recommendedOrder,
                            displayMode: teacherExercise.displayMode,
                        });
                    }
                }

                const teacherMenu = itemType === 'menu_group' ? teacherMenus.find((menu) => menu.id === itemId) : null;
                if (teacherMenu) {
                    const nextClassLevels = getUpdatedVisibleClassLevels(
                        teacherMenu.classLevels,
                        currentStatusByClass,
                        classLevel,
                        newStatus,
                    );

                    if (nextClassLevels) {
                        await updateTeacherMenu(teacherMenu.id, {
                            name: teacherMenu.name,
                            emoji: teacherMenu.emoji,
                            description: teacherMenu.description,
                            exerciseIds: teacherMenu.exerciseIds,
                            classLevels: nextClassLevels,
                            visibility: teacherMenu.visibility,
                            focusTags: teacherMenu.focusTags,
                            recommended: teacherMenu.recommended,
                            recommendedOrder: teacherMenu.recommendedOrder,
                            displayMode: teacherMenu.displayMode,
                        });
                    }
                }

                await upsertTeacherMenuSetting(itemId, itemType, classLevel, newStatus, teacherEmail);
                dispatchTeacherContentUpdated();
            } catch (err) {
                console.warn('[MenuSettings] status change failed:', err);
                setError(
                    `保存に失敗しました: ${getUnknownErrorMessage(err, 'deploy.sql を実行してテーブルを作成してください。')}`,
                );
                void loadAll();
            }
        },
        [getStatusByClass, loadAll, setError, setSettings, teacherEmail, teacherExercises, teacherMenus],
    );

    const handleSaveExercise = useCallback(
        async (data: ExerciseEditorValues) => {
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
                                    data.description !== (builtInExercise.description ?? '') ? data.description : null,
                                emojiOverride: data.emoji !== builtInExercise.emoji ? data.emoji : null,
                                secOverride: data.sec !== builtInExercise.sec ? data.sec : null,
                                hasSplitOverride:
                                    data.hasSplit !== (builtInExercise.hasSplit ?? false) ? data.hasSplit : null,
                                displayModeOverride: data.displayMode !== 'standard_inline' ? data.displayMode : null,
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
                setError(`種目の保存に失敗しました: ${getUnknownErrorMessage(err, '原因不明のエラー')}`);
            } finally {
                setSubmitting(false);
            }
        },
        [
            closeExerciseForm,
            editingBuiltInExerciseId,
            editingExercise,
            getStatusByClass,
            loadAll,
            setError,
            teacherEmail,
        ],
    );

    const handleSaveMenu = useCallback(
        async (data: MenuEditorValues) => {
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
                                    data.description !== (builtInMenu.description ?? '') ? data.description : null,
                                emojiOverride: data.emoji !== builtInMenu.emoji ? data.emoji : null,
                                exerciseIdsOverride:
                                    JSON.stringify(data.exerciseIds) !== JSON.stringify(builtInMenu.exerciseIds)
                                        ? data.exerciseIds
                                        : null,
                                displayModeOverride: data.displayMode !== 'teacher_section' ? data.displayMode : null,
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
                setError(`メニューの保存に失敗しました: ${getUnknownErrorMessage(err, '原因不明のエラー')}`);
            } finally {
                setSubmitting(false);
            }
        },
        [closeMenuForm, editingBuiltInMenuId, editingMenu, getStatusByClass, loadAll, setError, teacherEmail],
    );

    const handleConfirmDelete = useCallback(async () => {
        if (!deleteTarget) return;

        setDeleteLoading(true);
        try {
            if (deleteTarget.type === 'exercise') {
                const myPublishedMenus = await fetchMyPublishedMenus();
                const impactedTeacherMenus = teacherMenus.filter((menu) =>
                    teacherMenuReferencesExercise(menu, deleteTarget.id),
                );
                for (const menu of impactedTeacherMenus) {
                    const nextMenu = removeExerciseFromTeacherMenu(menu, deleteTarget.id);
                    if (nextMenu === null) {
                        await deleteTeacherMenu(menu.id);
                        continue;
                    }

                    await updateTeacherMenu(menu.id, {
                        name: nextMenu.name,
                        emoji: nextMenu.emoji,
                        description: nextMenu.description,
                        exerciseIds: nextMenu.exerciseIds,
                        classLevels: nextMenu.classLevels,
                        visibility: nextMenu.visibility,
                        focusTags: nextMenu.focusTags,
                        recommended: nextMenu.recommended,
                        recommendedOrder: nextMenu.recommendedOrder,
                        displayMode: nextMenu.displayMode,
                    });
                }

                const impactedCustomGroups = customGroups.filter((group) =>
                    menuGroupReferencesExercise(group, deleteTarget.id),
                );
                for (const group of impactedCustomGroups) {
                    const nextGroup = removeExerciseFromMenuGroup(group, deleteTarget.id);
                    const publishedMenu = findPublishedMenuMatch(group, myPublishedMenus);
                    if (publishedMenu) {
                        await unpublishMenu(publishedMenu.id);
                    }
                    if (nextGroup === null) {
                        await deleteCustomGroup(group.id);
                        continue;
                    }

                    if (nextGroup !== group) {
                        await saveCustomGroup(nextGroup);
                    }
                }

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
    }, [
        closeExerciseForm,
        closeMenuForm,
        customGroups,
        deleteTarget,
        editingExercise,
        editingMenu,
        loadAll,
        setDeleteTarget,
        teacherMenus,
    ]);

    const deleteImpact = useMemo(() => {
        if (!deleteTarget || deleteTarget.type !== 'exercise') {
            return null;
        }

        const updatedTeacherMenuNames: string[] = [];
        const removedTeacherMenuNames: string[] = [];
        for (const menu of teacherMenus) {
            if (!teacherMenuReferencesExercise(menu, deleteTarget.id)) {
                continue;
            }

            const nextMenu = removeExerciseFromTeacherMenu(menu, deleteTarget.id);
            if (nextMenu === null) {
                removedTeacherMenuNames.push(menu.name);
            } else {
                updatedTeacherMenuNames.push(menu.name);
            }
        }

        const updatedCustomMenuNames: string[] = [];
        const removedCustomMenuNames: string[] = [];
        for (const group of customGroups) {
            if (!menuGroupReferencesExercise(group, deleteTarget.id)) {
                continue;
            }

            const nextGroup = removeExerciseFromMenuGroup(group, deleteTarget.id);
            if (nextGroup === null) {
                removedCustomMenuNames.push(group.name);
            } else {
                updatedCustomMenuNames.push(group.name);
            }
        }

        return {
            updatedTeacherMenuNames,
            removedTeacherMenuNames,
            updatedCustomMenuNames,
            removedCustomMenuNames,
        };
    }, [customGroups, deleteTarget, teacherMenus]);

    const exerciseEditorInitial =
        editingExercise ??
        (editingBuiltInExerciseId ? buildBuiltInExerciseInitial(editingBuiltInExerciseId, overrides) : null);
    const exerciseEditorStatuses = editingExercise
        ? getStatusByClass(editingExercise.id, 'exercise')
        : editingBuiltInExerciseId
          ? getStatusByClass(editingBuiltInExerciseId, 'exercise')
          : undefined;
    const exerciseEditorItemId = editingExercise?.id ?? editingBuiltInExerciseId;

    const menuEditorInitial =
        editingMenu ?? (editingBuiltInMenuId ? buildBuiltInMenuInitial(editingBuiltInMenuId, overrides) : null);
    const menuEditorStatuses = editingMenu
        ? getStatusByClass(editingMenu.id, 'menu_group')
        : editingBuiltInMenuId
          ? getStatusByClass(editingBuiltInMenuId, 'menu_group')
          : undefined;
    const menuEditorItemId = editingMenu?.id ?? editingBuiltInMenuId;

    return {
        deleteLoading,
        deleteImpact,
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
