import React, { useState } from 'react';
import { EditorSection, EditorShell } from '../../../components/editor/EditorShell';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import {
    getTeacherContentDisplayModeLabel,
    TEACHER_EXERCISE_VISIBILITY_OPTIONS,
    type TeacherContentDisplayMode,
    type TeacherMenuVisibility,
} from '../../../lib/teacherExerciseMetadata';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';
import { TeacherEditorEmojiPicker } from './TeacherEditorEmojiPicker';
import { TeacherEditorFooterActions } from './TeacherEditorFooterActions';
import { TeacherEditorStatusSection } from './TeacherEditorStatusSection';
import { TeacherMenuExercisePicker } from './TeacherMenuExercisePicker';
import { COLOR, FONT, FONT_SIZE, inputField } from '../../../lib/styles';
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
        visibility: TeacherMenuVisibility;
        focusTags: string[];
        recommended: boolean;
        recommendedOrder: number | null;
        displayMode: TeacherContentDisplayMode;
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
    const [visibility, setVisibility] = useState<TeacherMenuVisibility>(initial?.visibility ?? 'public');
    const [recommended, setRecommended] = useState(initial?.recommended ?? false);
    const [recommendedOrderInput, setRecommendedOrderInput] = useState(
        initial?.recommendedOrder != null ? String(initial.recommendedOrder) : '1'
    );
    const [displayMode, setDisplayMode] = useState<TeacherContentDisplayMode>(initial?.displayMode ?? 'teacher_section');
    const [statusByClass, setStatusByClass] = useState<Record<string, MenuSettingStatus>>(() => buildDefaultStatusByClass(initialStatuses));

    const allExercises = buildMenuEditorExercises(teacherExercises);
    const canSave = name.trim().length > 0 && exerciseIds.length > 0;
    const metadataEditable = !initial || Boolean(initial.createdBy);
    const title = initial
        ? (metadataEditable ? '先生のメニューを編集' : '標準メニューを調整')
        : '先生のメニューを作成';

    const handleSubmit = () => {
        if (!canSave || submitting) return;
        onSave({
            name: name.trim(),
            emoji,
            description: description.trim(),
            exerciseIds,
            classLevels: deriveVisibleClassLevels(statusByClass),
            visibility,
            focusTags: [],
            recommended,
            recommendedOrder: recommended ? Math.max(1, Number.parseInt(recommendedOrderInput, 10) || 1) : null,
            displayMode,
            statusByClass,
        });
    };

    return (
        <EditorShell
            title={title}
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

            {metadataEditable ? (
                <>
                    <EditorSection label="見せかた">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {TEACHER_EXERCISE_VISIBILITY_OPTIONS.map((option) => {
                                const selected = visibility === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setVisibility(option.id)}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: 12,
                                            border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                            background: selected ? 'rgba(43,186,160,0.08)' : '#FFF',
                                            color: selected ? '#2BBAA0' : COLOR.dark,
                                            fontFamily: FONT.body,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 12, color: '#8395A7' }}>
                            {TEACHER_EXERCISE_VISIBILITY_OPTIONS.find((option) => option.id === visibility)?.description}
                        </div>
                    </EditorSection>

                    <EditorSection label="表示する場所">
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {([
                                {
                                    id: 'teacher_section' as const,
                                    description: '先生メニューにまとめて表示します',
                                },
                                {
                                    id: 'standard_inline' as const,
                                    description: '標準メニューのいちばん下に追加します。おすすめでも先頭には出しません',
                                },
                            ]).map((option) => {
                                const selected = displayMode === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setDisplayMode(option.id)}
                                        style={{
                                            padding: '10px 14px',
                                            borderRadius: 12,
                                            border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                            background: selected ? 'rgba(43,186,160,0.08)' : '#FFF',
                                            color: selected ? '#2BBAA0' : COLOR.dark,
                                            fontFamily: FONT.body,
                                            fontSize: 13,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {getTeacherContentDisplayModeLabel(option.id)}
                                    </button>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 12, color: '#8395A7', lineHeight: 1.6 }}>
                            {displayMode === 'standard_inline'
                                ? 'このメニューは標準メニュー一覧の最後に追加します。'
                                : 'このメニューは「先生メニュー」にまとめて表示します。'}
                        </div>
                    </EditorSection>

                    <EditorSection>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ fontFamily: FONT.body, fontSize: 15, fontWeight: 700, color: COLOR.text, display: 'block', marginBottom: 4 }}>
                                    先生のおすすめ
                                </label>
                                <span style={{ fontFamily: FONT.body, fontSize: 12, color: '#8395A7' }}>
                                    メニュー一覧で先に出しやすくします
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setRecommended((current) => {
                                        const next = !current;
                                        if (next && recommendedOrderInput.trim().length === 0) {
                                            setRecommendedOrderInput('1');
                                        }
                                        return next;
                                    });
                                }}
                                style={{
                                    width: 52,
                                    height: 32,
                                    borderRadius: 16,
                                    background: recommended ? '#2BBAA0' : '#E2E8F0',
                                    border: 'none',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    transition: 'background 0.3s',
                                }}
                            >
                                <div
                                    style={{
                                        width: 28,
                                        height: 28,
                                        background: 'white',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: 2,
                                        left: recommended ? 22 : 2,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        transition: 'left 0.2s ease',
                                    }}
                                />
                            </button>
                        </div>
                        {recommended ? (
                            <div style={{ marginTop: 12 }}>
                                <label style={{ fontFamily: FONT.body, fontSize: 13, fontWeight: 700, color: COLOR.text, display: 'block', marginBottom: 6 }}>
                                    おすすめの順番
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={1}
                                    step={1}
                                    value={recommendedOrderInput}
                                    onChange={(event) => setRecommendedOrderInput(event.target.value)}
                                    placeholder="1"
                                    style={{
                                        ...inputField,
                                        maxWidth: 120,
                                        fontSize: FONT_SIZE.md,
                                        color: COLOR.dark,
                                    }}
                                />
                                <div style={{ marginTop: 6, fontFamily: FONT.body, fontSize: 12, color: '#8395A7' }}>
                                    数字が小さいほど先に表示します
                                </div>
                            </div>
                        ) : null}
                    </EditorSection>
                </>
            ) : null}

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
