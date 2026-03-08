import { useCallback, useState } from 'react';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { DeleteTarget } from './menuSettingsControllerTypes';

export function useMenuSettingsEditorState() {
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [showExerciseForm, setShowExerciseForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState<TeacherExercise | null>(null);
    const [editingBuiltInExerciseId, setEditingBuiltInExerciseId] = useState<string | null>(null);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState<TeacherMenu | null>(null);
    const [editingBuiltInMenuId, setEditingBuiltInMenuId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

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
        setEditingExercise((current) => {
            if (current) {
                setDeleteTarget({ id: current.id, type: 'exercise', name: current.name });
            }
            return current;
        });
    }, []);

    const handleDeleteMenuFromEditor = useCallback(() => {
        setEditingMenu((current) => {
            if (current) {
                setDeleteTarget({ id: current.id, type: 'menu', name: current.name });
            }
            return current;
        });
    }, []);

    return {
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
    };
}
