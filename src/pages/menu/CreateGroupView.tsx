import React, { useMemo, useState } from 'react';
import { EXERCISES, getExercisesByClass, type ClassLevel } from '../../data/exercises';
import {
    getMenuGroupItems,
    type MenuGroup,
    type MenuGroupItem,
} from '../../data/menuGroups';
import { saveCustomExercise, type CustomExercise } from '../../lib/db';
import { saveCustomGroup } from '../../lib/customGroups';
import {
    linkPublishedMenuToSource,
    publishMenu,
} from '../../lib/publicMenus';
import { getAccountId } from '../../lib/sync';
import type { TeacherExercise } from '../../lib/teacherContent';
import { EditorShell } from '../../components/editor/EditorShell';
import { SingleExerciseEditor } from './SingleExerciseEditor';
import { CreateGroupSaveSection } from './create-group/CreateGroupSaveSection';
import { EmojiSelectorCard } from './create-group/EmojiSelectorCard';
import { ExercisePickerList, type ExercisePickerSection, type PickerExercise, type PickerOrigin } from './create-group/ExercisePickerList';
import { MenuItemsCard } from './create-group/MenuItemsCard';
import { MenuMetaCards } from './create-group/MenuMetaCards';
import { PublishToggleCard } from './create-group/PublishToggleCard';
import {
    DEFAULT_INLINE_EMOJI,
    DEFAULT_INLINE_INTERNAL,
    DEFAULT_INLINE_PLACEMENT,
    DEFAULT_QUICK_ADD_DRAFT,
    EMOJI_OPTIONS,
    getMenuPublishErrorMessage,
    type QuickAddDraft,
    toPickerExercise,
} from './create-group/createGroupViewShared';
import { moveMenuItems } from './create-group/menuItemOrder';

interface CreateGroupViewProps {
    classLevel: string;
    initial: MenuGroup | null;
    currentUserId?: string;
    authorName?: string;
    publishedMenuId?: string;
    customExercises?: CustomExercise[];
    teacherExercises?: TeacherExercise[];
    onSave: () => void;
    onCancel: () => void;
}

export const CreateGroupView: React.FC<CreateGroupViewProps> = ({
    classLevel,
    initial,
    currentUserId,
    authorName,
    publishedMenuId,
    customExercises,
    teacherExercises,
    onSave,
    onCancel,
}) => {
    const [name, setName] = useState(initial?.name || '');
    const [emoji, setEmoji] = useState(initial?.emoji || '🌸');
    const [description, setDescription] = useState(initial?.description || '');
    const [items, setItems] = useState<MenuGroupItem[]>(() => initial ? getMenuGroupItems(initial) : []);
    const [isPublic, setIsPublic] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showRepublishConfirm, setShowRepublishConfirm] = useState(false);
    const [pendingGroup, setPendingGroup] = useState<MenuGroup | null>(null);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [editingInlineItemId, setEditingInlineItemId] = useState<string | null>(null);
    const [editingPendingExerciseId, setEditingPendingExerciseId] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [quickAddDraft, setQuickAddDraft] = useState<QuickAddDraft>(DEFAULT_QUICK_ADD_DRAFT);
    const [pendingCustomExercises, setPendingCustomExercises] = useState<CustomExercise[]>([]);

    const isLoggedIn = !!getAccountId();
    const isEditing = !!initial;
    const builtInExercises = useMemo(
        () => getExercisesByClass(classLevel as ClassLevel),
        [classLevel],
    );
    const restExercises = useMemo(
        () => EXERCISES.filter((exercise) => exercise.placement === 'rest'),
        [],
    );

    // Convert built-in to PickerExercise format
    const builtInPicker: PickerExercise[] = useMemo(
        () => builtInExercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            sec: ex.sec,
            emoji: ex.emoji,
            splitLabel: ex.internal !== 'single' ? ex.internal : undefined,
            placement: ex.placement,
        })),
        [builtInExercises],
    );
    const restPicker: PickerExercise[] = useMemo(
        () => restExercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sec: exercise.sec,
            emoji: exercise.emoji,
        })),
        [restExercises],
    );

    // Convert custom & teacher exercises
    const customPicker = useMemo(
        () => [...(customExercises ?? []), ...pendingCustomExercises].map(toPickerExercise),
        [customExercises, pendingCustomExercises],
    );
    const teacherPicker = useMemo(
        () => (teacherExercises ?? []).map(toPickerExercise),
        [teacherExercises],
    );

    // All exercises flat list for lookups (time calc, selected card)
    const allExercises = useMemo(
        () => [...builtInPicker, ...restPicker, ...customPicker, ...teacherPicker],
        [builtInPicker, customPicker, restPicker, teacherPicker],
    );

    // Sections for picker
    const sections: ExercisePickerSection[] = useMemo(() => {
        const result: ExercisePickerSection[] = [
            { label: '種目をタップして追加（くりかえしOK）', exercises: builtInPicker, origin: 'builtin' as PickerOrigin },
        ];
        if (teacherPicker.length > 0) {
            result.push({ label: '先生の種目', exercises: teacherPicker, origin: 'teacher' as PickerOrigin });
        }
        if (customPicker.length > 0) {
            result.push({ label: 'じぶんの種目', exercises: customPicker, origin: 'custom' as PickerOrigin });
        }
        return result;
    }, [builtInPicker, teacherPicker, customPicker]);

    // Total time calculation using all exercises
    const totalSec = useMemo(
        () => items.reduce((sum, item) => {
            if (item.kind === 'inline_only') {
                return sum + item.sec;
            }

            const exercise = allExercises.find((candidate) => candidate.id === item.exerciseId);
            return sum + (exercise?.sec ?? 0);
        }, 0),
        [allExercises, items],
    );
    const minutes = Math.ceil(totalSec / 60);
    const canSave = name.trim().length > 0 && items.length > 0 && !saving;
    const selectedExerciseIds = useMemo(
        () => items.map((item) =>
            item.kind === 'exercise_ref' ? item.exerciseId : item.id,
        ),
        [items],
    );

    const addExercise = (exerciseId: string) => {
        setItems((previous) => [
            ...previous,
            { id: `ref-${crypto.randomUUID()}`, kind: 'exercise_ref', exerciseId },
        ]);
    };

    const createPendingCustomExercise = (draft: { name: string; sec: number }): CustomExercise => ({
        id: `custom-ex-${crypto.randomUUID()}`,
        name: draft.name.trim(),
        sec: draft.sec,
        emoji: DEFAULT_INLINE_EMOJI,
        placement: DEFAULT_INLINE_PLACEMENT,
        creatorId: currentUserId,
    });

    const addPendingCustomExercise = (exercise: CustomExercise) => {
        setPendingCustomExercises((previous) => {
            const existingIndex = previous.findIndex((candidate) => candidate.id === exercise.id);
            if (existingIndex === -1) {
                return [...previous, exercise];
            }

            return previous.map((candidate) => candidate.id === exercise.id ? exercise : candidate);
        });
    };

    const removeUnusedPendingCustomExercise = (exerciseId: string, nextItems: MenuGroupItem[]) => {
        const stillReferenced = nextItems.some((item) => item.kind === 'exercise_ref' && item.exerciseId === exerciseId);
        if (!stillReferenced) {
            setPendingCustomExercises((previous) => previous.filter((exercise) => exercise.id !== exerciseId));
        }
    };

    const updateInlineItem = (itemId: string, updates: { name?: string; sec?: number }) => {
        setItems((previous) => previous.map((item) => {
            if (item.id !== itemId || item.kind !== 'inline_only') {
                return item;
            }

            return {
                ...item,
                ...(updates.name !== undefined ? { name: updates.name } : {}),
                ...(updates.sec !== undefined && Number.isFinite(updates.sec) && updates.sec > 0
                    ? { sec: updates.sec }
                    : {}),
            };
        }));
    };

    const addQuickItem = (options?: { openEditor?: boolean }) => {
        const trimmedName = quickAddDraft.name.trim();
        if (!trimmedName || !Number.isFinite(quickAddDraft.sec) || quickAddDraft.sec <= 0) {
            return;
        }

        if (quickAddDraft.saveAsCustom) {
            const pendingExercise = createPendingCustomExercise({ name: trimmedName, sec: quickAddDraft.sec });
            addPendingCustomExercise(pendingExercise);
            setItems((previous) => [
                ...previous,
                {
                    id: pendingExercise.id,
                    kind: 'exercise_ref',
                    exerciseId: pendingExercise.id,
                },
            ]);
            if (options?.openEditor) {
                setEditingPendingExerciseId(pendingExercise.id);
            }
        } else {
            const inlineItem: MenuGroupItem = {
                id: `inline-menu-${crypto.randomUUID()}`,
                kind: 'inline_only',
                name: trimmedName,
                sec: quickAddDraft.sec,
                emoji: DEFAULT_INLINE_EMOJI,
                placement: DEFAULT_INLINE_PLACEMENT,
                internal: DEFAULT_INLINE_INTERNAL,
            };
            setItems((previous) => [...previous, inlineItem]);
        }

        setQuickAddDraft((previous) => ({
            ...previous,
            name: '',
        }));
    };

    const promoteInlineItem = (itemId: string, options?: { openEditor?: boolean }) => {
        const target = items.find((item) => item.id === itemId);
        if (!target || target.kind !== 'inline_only') {
            return;
        }

        const pendingExercise = createPendingCustomExercise({
            name: target.name,
            sec: target.sec,
        });
        addPendingCustomExercise(pendingExercise);
        setItems((previous) => previous.map((item) => {
            if (item.id !== itemId) {
                return item;
            }

            return {
                id: pendingExercise.id,
                kind: 'exercise_ref',
                exerciseId: pendingExercise.id,
            };
        }));
        setEditingInlineItemId(null);
        if (options?.openEditor) {
            setEditingPendingExerciseId(pendingExercise.id);
        }
    };

    const removeItemAtIndex = (index: number) => {
        setItems((previous) => {
            const removed = previous[index];
            const nextItems = previous.filter((_, targetIndex) => targetIndex !== index);
            if (removed?.kind === 'exercise_ref') {
                removeUnusedPendingCustomExercise(removed.exerciseId, nextItems);
            }
            if (removed?.id === editingInlineItemId) {
                setEditingInlineItemId(null);
            }
            return nextItems;
        });
    };

    const moveItem = (fromIndex: number, toIndex: number) => {
        setItems((previous) => moveMenuItems(previous, fromIndex, toIndex));
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);
        setSaveError(null);

        try {
            await Promise.all(pendingCustomExercises.map((exercise) => saveCustomExercise(exercise)));

            const group: MenuGroup = {
                id: initial?.id || `custom-${Date.now()}`,
                name: name.trim(),
                emoji,
                description: description.trim(),
                exerciseIds: items.map((item) =>
                    item.kind === 'exercise_ref' ? item.exerciseId : item.id,
                ),
                items,
                isPreset: false,
                creatorId: currentUserId,
            };

            await saveCustomGroup(group);

            if (isPublic && !isEditing && isLoggedIn && authorName) {
                try {
                    await publishMenu(group, authorName);
                } catch (error) {
                    console.warn('[CreateGroupView] publish failed:', error);
                    // Keep the local save and let the user retry publishing from the menu list.
                }
            }

            if (isEditing && publishedMenuId && isLoggedIn && authorName) {
                try {
                    await linkPublishedMenuToSource(publishedMenuId, group.id);
                } catch (error) {
                    console.warn('[CreateGroupView] link published menu failed:', error);
                }
                // Show confirmation modal instead of native confirm()
                setPendingGroup(group);
                setShowRepublishConfirm(true);
                setSaving(false);
                return;
            }

            onSave();
        } catch (error) {
            console.warn('[CreateGroupView] save failed:', error);
            setSaveError('ほぞんに失敗しました。もう一度ためしてみてね。');
        } finally {
            setSaving(false);
        }
    };

    const handleRepublishConfirm = async () => {
        if (!pendingGroup || !authorName) {
            return;
        }

        setSaving(true);
        setSaveError(null);
        try {
            await publishMenu(pendingGroup, authorName, { existingPublicMenuId: publishedMenuId });
            setShowRepublishConfirm(false);
            setPendingGroup(null);
            onSave();
        } catch (error) {
            console.warn('[CreateGroupView] re-publish failed:', error);
            setSaveError(getMenuPublishErrorMessage(error));
        } finally {
            setSaving(false);
        }
    };

    const handleRepublishCancel = () => {
        setShowRepublishConfirm(false);
        setPendingGroup(null);
        setSaveError(null);
        onSave();
    };

    const editingPendingExercise = editingPendingExerciseId
        ? pendingCustomExercises.find((exercise) => exercise.id === editingPendingExerciseId) ?? null
        : null;

    if (editingPendingExercise) {
        return (
            <SingleExerciseEditor
                initial={editingPendingExercise}
                currentUserId={currentUserId}
                authorName={authorName}
                submitLabel="メニューにもどる"
                onSaveExercise={(exercise) => {
                    addPendingCustomExercise(exercise);
                    setEditingPendingExerciseId(null);
                }}
                onSave={() => {
                    setEditingPendingExerciseId(null);
                }}
                onCancel={() => {
                    setEditingPendingExerciseId(null);
                }}
            />
        );
    }

    return (
        <EditorShell
            title={isEditing ? 'へんしゅう' : 'じぶんでつくる'}
            onBack={onCancel}
        >
            <EmojiSelectorCard
                options={EMOJI_OPTIONS}
                selectedEmoji={emoji}
                onSelect={setEmoji}
            />

            <MenuMetaCards
                name={name}
                description={description}
                onNameChange={setName}
                onDescriptionChange={setDescription}
            />

            <MenuItemsCard
                items={items}
                minutes={minutes}
                allExercises={allExercises}
                editableExerciseIds={pendingCustomExercises.map((exercise) => exercise.id)}
                editingInlineItemId={editingInlineItemId}
                quickAddDraft={quickAddDraft}
                showQuickAdd={showQuickAdd}
                onQuickAddDraftChange={(updates) => {
                    setQuickAddDraft((previous) => ({ ...previous, ...updates }));
                }}
                onShowQuickAdd={setShowQuickAdd}
                onAddQuickItem={addQuickItem}
                onMoveItem={moveItem}
                onReorderItems={setItems}
                onRemoveAtIndex={removeItemAtIndex}
                onOpenInlineEditor={setEditingInlineItemId}
                onUpdateInlineItem={updateInlineItem}
                onPromoteInlineItem={promoteInlineItem}
                onEditExercise={setEditingPendingExerciseId}
            />

            <ExercisePickerList
                sections={sections}
                selectedIds={selectedExerciseIds}
                onAddExercise={addExercise}
                restExercises={restPicker}
            />

            {isLoggedIn && !isEditing && (
                <PublishToggleCard
                    isPublic={isPublic}
                    onToggle={() => setIsPublic((previous) => !previous)}
                    subtitle="他の人がこのメニューをもらえるようになります"
                />
            )}

            <CreateGroupSaveSection
                saveError={saveError}
                canSave={canSave}
                saving={saving}
                isEditing={isEditing}
                showRepublishConfirm={showRepublishConfirm}
                onSave={handleSave}
                onRepublishCancel={handleRepublishCancel}
                onRepublishConfirm={handleRepublishConfirm}
            />
        </EditorShell>
    );
};
