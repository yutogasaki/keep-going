import React, { useState } from 'react';
import { EditorSection, EditorShell } from '../../../components/editor/EditorShell';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';
import { TeacherEditorEmojiPicker } from './TeacherEditorEmojiPicker';
import { TeacherEditorFooterActions } from './TeacherEditorFooterActions';
import { TeacherEditorStatusSection } from './TeacherEditorStatusSection';
import { TeacherMenuExercisePicker } from './TeacherMenuExercisePicker';
import { FONT, FONT_SIZE } from '../../../lib/styles';
import {
    buildDefaultStatusByClass,
    buildMenuEditorExercises,
    deriveVisibleClassLevels,
    type TeacherEditorStatusOption,
} from './teacherEditorHelpers';

interface TeacherMenuEditorProps {
    initial?: TeacherMenu | null;
    initialStatuses?: Record<string, MenuSettingStatus>;
    teacherExercises: TeacherExercise[];
    onSave: (data: {
        name: string;
        emoji: string;
        description: string;
        exerciseIds: string[];
        classLevels: string[];
        statusByClass: Record<string, MenuSettingStatus>;
    }) => void;
    onCancel: () => void;
    onPlay?: () => void;
    onDelete?: () => void;
    submitting: boolean;
    error?: string | null;
}

const MENU_STATUS_OPTIONS: TeacherEditorStatusOption[] = [
    { status: 'optional', bg: '#F8F9FA', color: '#8395A7', label: '表示' },
    { status: 'hidden', bg: '#F0E6FF', color: '#8B5CF6', label: '非表示' },
];

const EMOJI_OPTIONS = [
    '🌸', '🎀', '🩰', '🦢', '🌟', '✨', '💪', '🦵',
    '🏋️', '💃', '⭐', '🌈', '🍎', '📋', '🔥', '🧘',
];

export const TeacherMenuEditor: React.FC<TeacherMenuEditorProps> = ({
    initial,
    initialStatuses,
    teacherExercises,
    onSave,
    onCancel,
    onPlay,
    onDelete,
    submitting,
    error,
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '📋');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [exerciseIds, setExerciseIds] = useState<string[]>(initial?.exerciseIds ?? []);
    const [statusByClass, setStatusByClass] = useState<Record<string, MenuSettingStatus>>(() => buildDefaultStatusByClass(initialStatuses));

    const allExercises = buildMenuEditorExercises(teacherExercises);
    const canSave = name.trim().length > 0 && exerciseIds.length > 0;

    const handleSubmit = () => {
        if (!canSave || submitting) return;
        onSave({
            name: name.trim(),
            emoji,
            description: description.trim(),
            exerciseIds,
            classLevels: deriveVisibleClassLevels(statusByClass),
            statusByClass,
        });
    };

    return (
        <EditorShell
            title={initial ? '先生のメニューを編集' : '先生のメニューを作成'}
            onBack={onCancel}
        >
            <EditorSection label="アイコン">
                <TeacherEditorEmojiPicker
                    options={EMOJI_OPTIONS}
                    selectedEmoji={emoji}
                    onSelect={setEmoji}
                />
            </EditorSection>

            <EditorSection label="メニュー名">
                <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="例: バレエ前ウォームアップ"
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.05)',
                        background: '#F8F9FA',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 16,
                        color: '#2D3436',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                    }}
                />
            </EditorSection>

            <EditorSection label="せつめい">
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="メニューの説明やコメント"
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.05)',
                        background: '#F8F9FA',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#2D3436',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                        resize: 'vertical',
                    }}
                />
            </EditorSection>

            <EditorSection>
                <TeacherMenuExercisePicker
                    exerciseIds={exerciseIds}
                    exercises={allExercises}
                    onAddExercise={(id) => setExerciseIds((previous) => [...previous, id])}
                    onRemoveAtIndex={(index) => setExerciseIds((previous) => previous.filter((_, itemIndex) => itemIndex !== index))}
                />
            </EditorSection>

            <EditorSection label="クラスごとの設定">
                <TeacherEditorStatusSection
                    legend={(
                        <>
                            <span>⚪ 表示</span>
                            <span style={{ color: '#8B5CF6' }}>👁 非表示</span>
                        </>
                    )}
                    options={MENU_STATUS_OPTIONS}
                    statusByClass={statusByClass}
                    onStatusChange={(classLevel, status) => setStatusByClass((previous) => ({
                        ...previous,
                        [classLevel]: status,
                    }))}
                />
            </EditorSection>

            {error ? (
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'rgba(225, 112, 85, 0.1)',
                        border: '1px solid rgba(225, 112, 85, 0.25)',
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: '#E17055',
                        lineHeight: 1.5,
                    }}
                >
                    {error}
                </div>
            ) : null}

            <div style={{ flex: 1 }} />

            <TeacherEditorFooterActions
                canSave={canSave}
                isEditing={Boolean(initial)}
                onDelete={onDelete}
                onPlay={onPlay}
                onSubmit={handleSubmit}
                submitting={submitting}
            />
        </EditorShell>
    );
};
