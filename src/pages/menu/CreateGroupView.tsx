import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { getExercisesByClass, type ClassLevel } from '../../data/exercises';
import { saveCustomGroup, type MenuGroup } from '../../data/menuGroups';
import type { CustomExercise } from '../../lib/db';
import { publishMenu, unpublishMenu } from '../../lib/publicMenus';
import { getAccountId } from '../../lib/sync';
import type { TeacherExercise } from '../../lib/teacherContent';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { COLOR, FONT } from '../../lib/styles';
import { CreateGroupHeader } from './create-group/CreateGroupHeader';
import { EmojiSelectorCard } from './create-group/EmojiSelectorCard';
import { ExercisePickerList, type ExercisePickerSection, type PickerExercise } from './create-group/ExercisePickerList';
import { MenuMetaCards } from './create-group/MenuMetaCards';
import { PublishToggleCard } from './create-group/PublishToggleCard';
import { SelectedExercisesCard } from './create-group/SelectedExercisesCard';

const EMOJI_OPTIONS = ['🌸', '💪', '🦵', '🩰', '⭐', '🌈', '🔥', '💃', '🧘', '🎯', '✨', '🌙'];

function toPickerExercise(ex: CustomExercise | TeacherExercise): PickerExercise {
    return {
        id: ex.id,
        name: ex.name,
        sec: ex.sec,
        emoji: ex.emoji,
        splitLabel: ex.hasSplit ? 'みぎ→ひだり' : undefined,
    };
}

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
    const [selectedIds, setSelectedIds] = useState<string[]>(initial?.exerciseIds || []);
    const [isPublic, setIsPublic] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showRepublishConfirm, setShowRepublishConfirm] = useState(false);
    const [pendingGroup, setPendingGroup] = useState<MenuGroup | null>(null);

    const isLoggedIn = !!getAccountId();
    const isEditing = !!initial;

    // Built-in exercises
    const builtInExercises = useMemo(
        () => getExercisesByClass(classLevel as ClassLevel),
        [classLevel],
    );

    // Convert built-in to PickerExercise format
    const builtInPicker: PickerExercise[] = useMemo(
        () => builtInExercises.map((ex) => ({
            id: ex.id,
            name: ex.name,
            sec: ex.sec,
            emoji: ex.emoji,
            splitLabel: ex.internal !== 'single' ? ex.internal : undefined,
        })),
        [builtInExercises],
    );

    // Convert custom & teacher exercises
    const customPicker = useMemo(
        () => (customExercises ?? []).map(toPickerExercise),
        [customExercises],
    );
    const teacherPicker = useMemo(
        () => (teacherExercises ?? []).map(toPickerExercise),
        [teacherExercises],
    );

    // All exercises flat list for lookups (time calc, selected card)
    const allExercises = useMemo(
        () => [...builtInPicker, ...customPicker, ...teacherPicker],
        [builtInPicker, customPicker, teacherPicker],
    );

    // Sections for picker
    const sections: ExercisePickerSection[] = useMemo(() => {
        const result: ExercisePickerSection[] = [
            { label: '種目をタップして追加（くりかえしOK）', exercises: builtInPicker },
        ];
        if (teacherPicker.length > 0) {
            result.push({ label: '先生の種目', exercises: teacherPicker });
        }
        if (customPicker.length > 0) {
            result.push({ label: 'じぶんの種目', exercises: customPicker });
        }
        return result;
    }, [builtInPicker, teacherPicker, customPicker]);

    // Total time calculation using all exercises
    const totalSec = useMemo(
        () => selectedIds.reduce((sum, id) => {
            const ex = allExercises.find((e) => e.id === id);
            return sum + (ex?.sec ?? 0);
        }, 0),
        [selectedIds, allExercises],
    );
    const minutes = Math.ceil(totalSec / 60);
    const canSave = name.trim().length > 0 && selectedIds.length > 0 && !saving;

    const addExercise = (exerciseId: string) => {
        setSelectedIds((previous) => [...previous, exerciseId]);
    };

    const handleSave = async () => {
        if (!canSave) return;
        setSaving(true);

        try {
            const group: MenuGroup = {
                id: initial?.id || `custom-${Date.now()}`,
                name: name.trim(),
                emoji,
                description: description.trim(),
                exerciseIds: selectedIds,
                isPreset: false,
                creatorId: currentUserId,
            };

            await saveCustomGroup(group);

            if (isPublic && !isEditing && isLoggedIn && authorName) {
                try {
                    await publishMenu(group, authorName);
                } catch (error) {
                    console.warn('[CreateGroupView] publish failed:', error);
                }
            }

            if (isEditing && publishedMenuId && isLoggedIn && authorName) {
                // Show confirmation modal instead of native confirm()
                setPendingGroup(group);
                setShowRepublishConfirm(true);
                setSaving(false);
                return;
            }

            onSave();
        } catch (error) {
            console.warn('[CreateGroupView] save failed:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleRepublishConfirm = async () => {
        if (pendingGroup && publishedMenuId && authorName) {
            try {
                await unpublishMenu(publishedMenuId);
                await publishMenu(pendingGroup, authorName);
            } catch (error) {
                console.warn('[CreateGroupView] re-publish failed:', error);
            }
        }
        setShowRepublishConfirm(false);
        setPendingGroup(null);
        onSave();
    };

    const handleRepublishCancel = () => {
        setShowRepublishConfirm(false);
        setPendingGroup(null);
        onSave();
    };

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
            zIndex: 100,
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '64px 20px 32px 20px',
            gap: 20,
            overflowY: 'auto',
        }}>
            <CreateGroupHeader isEditing={isEditing} onCancel={onCancel} />

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

            <SelectedExercisesCard
                selectedIds={selectedIds}
                minutes={minutes}
                allExercises={allExercises}
                onRemoveAtIndex={(index) => {
                    setSelectedIds((previous) => previous.filter((_, targetIndex) => targetIndex !== index));
                }}
            />

            <ExercisePickerList
                sections={sections}
                selectedIds={selectedIds}
                onAddExercise={addExercise}
            />

            {isLoggedIn && !isEditing && (
                <PublishToggleCard
                    isPublic={isPublic}
                    onToggle={() => setIsPublic((previous) => !previous)}
                />
            )}

            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!canSave}
                style={{
                    position: 'sticky',
                    bottom: 0,
                    padding: '16px 0',
                    borderRadius: 16,
                    border: 'none',
                    background: canSave ? 'linear-gradient(135deg, #2BBAA0, #1A937D)' : COLOR.disabled,
                    color: canSave ? COLOR.white : COLOR.light,
                    fontFamily: FONT.body,
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: canSave ? 'pointer' : 'not-allowed',
                    boxShadow: canSave ? '0 8px 20px rgba(43, 186, 160, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                    marginTop: 16,
                }}
            >
                {saving ? 'ほぞん中...' : isEditing ? 'ほぞん' : 'つくる！'}
            </motion.button>

            <ConfirmDeleteModal
                open={showRepublishConfirm}
                title="公開版も更新する？"
                message="保存しました。公開版のメニューも一緒に更新しますか？"
                onCancel={handleRepublishCancel}
                onConfirm={handleRepublishConfirm}
                confirmLabel="更新する"
                confirmColor="#2BBAA0"
            />
        </div>,
        document.body,
    );
};
