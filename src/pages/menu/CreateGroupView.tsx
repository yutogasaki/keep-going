import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { calculateTotalSeconds, getExercisesByClass, type ClassLevel } from '../../data/exercises';
import { saveCustomGroup, type MenuGroup } from '../../data/menuGroups';
import { publishMenu, unpublishMenu } from '../../lib/publicMenus';
import { getAccountId } from '../../lib/sync';
import { CreateGroupHeader } from './create-group/CreateGroupHeader';
import { EmojiSelectorCard } from './create-group/EmojiSelectorCard';
import { ExercisePickerList } from './create-group/ExercisePickerList';
import { MenuMetaCards } from './create-group/MenuMetaCards';
import { PublishToggleCard } from './create-group/PublishToggleCard';
import { SelectedExercisesCard } from './create-group/SelectedExercisesCard';

const EMOJI_OPTIONS = ['🌸', '💪', '🦵', '🩰', '⭐', '🌈', '🔥', '💃', '🧘', '🎯', '✨', '🌙'];

interface CreateGroupViewProps {
    classLevel: string;
    initial: MenuGroup | null;
    currentUserId?: string;
    authorName?: string;
    publishedMenuId?: string;
    onSave: () => void;
    onCancel: () => void;
}

export const CreateGroupView: React.FC<CreateGroupViewProps> = ({
    classLevel,
    initial,
    currentUserId,
    authorName,
    publishedMenuId,
    onSave,
    onCancel,
}) => {
    const [name, setName] = useState(initial?.name || '');
    const [emoji, setEmoji] = useState(initial?.emoji || '🌸');
    const [description, setDescription] = useState(initial?.description || '');
    const [selectedIds, setSelectedIds] = useState<string[]>(initial?.exerciseIds || []);
    const [isPublic, setIsPublic] = useState(false);

    const isLoggedIn = !!getAccountId();
    const isEditing = !!initial;
    const availableExercises = getExercisesByClass(classLevel as ClassLevel);
    const totalSec = calculateTotalSeconds(selectedIds);
    const minutes = Math.ceil(totalSec / 60);
    const canSave = name.trim().length > 0 && selectedIds.length > 0;

    const addExercise = (exerciseId: string) => {
        setSelectedIds((previous) => [...previous, exerciseId]);
    };

    const handleSave = async () => {
        if (!canSave) {
            return;
        }

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
            const shouldRepublish = confirm('公開版も更新しますか？');
            if (shouldRepublish) {
                try {
                    await unpublishMenu(publishedMenuId);
                    await publishMenu(group, authorName);
                } catch (error) {
                    console.warn('[CreateGroupView] re-publish failed:', error);
                }
            }
        }

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
                onRemoveAtIndex={(index) => {
                    setSelectedIds((previous) => previous.filter((_, targetIndex) => targetIndex !== index));
                }}
            />

            <ExercisePickerList
                availableExercises={availableExercises}
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
                    background: canSave ? 'linear-gradient(135deg, #2BBAA0, #1A937D)' : '#DFE6E9',
                    color: canSave ? 'white' : '#B2BEC3',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: canSave ? 'pointer' : 'not-allowed',
                    boxShadow: canSave ? '0 8px 20px rgba(43, 186, 160, 0.3)' : 'none',
                    transition: 'all 0.3s ease',
                    marginTop: 16,
                }}
            >
                {isEditing ? 'ほぞん' : 'つくる！'}
            </motion.button>
        </div>,
        document.body,
    );
};
