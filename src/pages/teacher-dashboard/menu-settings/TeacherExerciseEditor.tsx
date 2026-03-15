import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DurationSecondsPicker } from '../../../components/DurationSecondsPicker';
import { EditorSection, EditorShell, editorLabelStyle } from '../../../components/editor/EditorShell';
import {
    EXERCISE_PLACEMENTS,
    getExercisePlacementLabel,
    type ExercisePlacement,
} from '../../../data/exercisePlacement';
import type { TeacherExercise } from '../../../lib/teacherContent';
import {
    getTeacherContentDisplayModeLabel,
    TEACHER_EXERCISE_VISIBILITY_OPTIONS,
    type TeacherContentDisplayMode,
    type TeacherExerciseVisibility,
} from '../../../lib/teacherExerciseMetadata';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';
import { COLOR, FONT, FONT_SIZE, inputField } from '../../../lib/styles';
import { TeacherEditorEmojiPicker } from './TeacherEditorEmojiPicker';
import { TeacherEditorFooterActions } from './TeacherEditorFooterActions';
import { TeacherEditorStatusSection } from './TeacherEditorStatusSection';
import {
    buildDefaultStatusByClass,
    deriveVisibleClassLevels,
    type TeacherEditorStatusOption,
} from './teacherEditorHelpers';

interface TeacherExerciseEditorProps {
    initial?: TeacherExercise | null;
    initialStatuses?: Record<string, MenuSettingStatus>;
    onSave: (data: {
        name: string;
        sec: number;
        emoji: string;
        placement: ExercisePlacement;
        hasSplit: boolean;
        description: string;
        classLevels: string[];
        visibility: TeacherExerciseVisibility;
        focusTags: string[];
        recommended: boolean;
        recommendedOrder: number | null;
        displayMode: TeacherContentDisplayMode;
        statusByClass: Record<string, MenuSettingStatus>;
    }) => void;
    onCancel: () => void;
    onPlay?: () => void;
    onDelete?: () => void;
    placementLocked?: boolean;
    submitting: boolean;
    error?: string | null;
}

const STATUS_OPTIONS: TeacherEditorStatusOption[] = [
    { status: 'required', bg: '#E8F8F0', color: '#2BBAA0', label: '必須' },
    { status: 'optional', bg: '#F8F9FA', color: '#8395A7', label: 'おまかせ' },
    { status: 'excluded', bg: '#FFE4E1', color: '#E17055', label: '除外' },
    { status: 'hidden', bg: '#F0E6FF', color: '#8B5CF6', label: '非表示' },
];

const EMOJI_OPTIONS = [
    '🌸', '🎀', '🩰', '🦢', '🌟', '✨', '👑', '💎',
    '💖', '🦋', '🐱', '🐰', '🐻', '🌈', '🍎', '🍓',
    '🧘', '🏋️', '💪', '🦵', '🦶', '🙇', '💃', '🏃',
];

export const TeacherExerciseEditor: React.FC<TeacherExerciseEditorProps> = ({
    initial,
    initialStatuses,
    onSave,
    onCancel,
    onPlay,
    onDelete,
    placementLocked,
    submitting,
    error,
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '🌸');
    const [sec, setSec] = useState(initial?.sec ?? 30);
    const [placement, setPlacement] = useState<ExercisePlacement>(initial?.placement ?? 'stretch');
    const [hasSplit, setHasSplit] = useState(initial?.hasSplit ?? false);
    const [description, setDescription] = useState(initial?.description ?? '');
    const [visibility, setVisibility] = useState<TeacherExerciseVisibility>(initial?.visibility ?? 'public');
    const [recommended, setRecommended] = useState(initial?.recommended ?? false);
    const [recommendedOrderInput, setRecommendedOrderInput] = useState(
        initial?.recommendedOrder != null ? String(initial.recommendedOrder) : '1'
    );
    const [displayMode, setDisplayMode] = useState<TeacherContentDisplayMode>(initial?.displayMode ?? 'teacher_section');
    const [statusByClass, setStatusByClass] = useState<Record<string, MenuSettingStatus>>(() => buildDefaultStatusByClass(initialStatuses));

    const canSave = name.trim().length > 0;
    const title = initial
        ? (placementLocked ? '標準種目を調整' : '先生の種目を編集')
        : '先生の種目を作成';

    const handleSubmit = () => {
        if (!canSave || submitting) return;
        onSave({
            name: name.trim(),
            sec,
            emoji,
            placement,
            hasSplit,
            description: description.trim(),
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

            <EditorSection label="なまえ">
                <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="新しい種目の名前"
                    style={{
                        ...inputField,
                        fontSize: FONT_SIZE.lg,
                        color: COLOR.dark,
                        transition: 'all 0.2s',
                    }}
                />
            </EditorSection>

            <EditorSection label="せつめい">
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="種目の説明やポイント"
                    rows={3}
                    style={{
                        ...inputField,
                        fontSize: FONT_SIZE.md,
                        color: COLOR.dark,
                        transition: 'all 0.2s',
                        resize: 'vertical',
                    }}
                />
            </EditorSection>

            <EditorSection label="時間（秒）">
                <DurationSecondsPicker
                    value={sec}
                    onChange={setSec}
                />
            </EditorSection>

            <EditorSection label="どこに入れる？">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EXERCISE_PLACEMENTS.map((option) => {
                        const isActive = placement === option;
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    if (!placementLocked) {
                                        setPlacement(option);
                                    }
                                }}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    border: isActive ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                    background: isActive ? 'rgba(43,186,160,0.08)' : '#FFF',
                                    color: isActive ? '#2BBAA0' : COLOR.dark,
                                    fontFamily: FONT.body,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: placementLocked ? 'default' : 'pointer',
                                    opacity: placementLocked && !isActive ? 0.55 : 1,
                                }}
                            >
                                {getExercisePlacementLabel(option)}
                            </button>
                        );
                    })}
                </div>
                {placementLocked ? (
                    <div
                        style={{
                            marginTop: 8,
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: COLOR.muted,
                            lineHeight: 1.5,
                        }}
                    >
                        標準種目の配置は固定です。新しい先生の種目では自由に選べます。
                    </div>
                ) : null}
            </EditorSection>

            <EditorSection>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <label style={{ ...editorLabelStyle, fontSize: 15, marginBottom: 4 }}>切替あり</label>
                        <span
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 12,
                                color: '#8395A7',
                            }}
                        >
                            半分の時間で「反対」「切り替え」の合図が鳴ります
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setHasSplit(!hasSplit)}
                        style={{
                            width: 52,
                            height: 32,
                            borderRadius: 16,
                            background: hasSplit ? '#2BBAA0' : '#E2E8F0',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.3s',
                            boxShadow: hasSplit ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        }}
                    >
                        <motion.div
                            animate={{ x: hasSplit ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                width: 28,
                                height: 28,
                                background: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: 2,
                                left: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        />
                    </button>
                </div>
            </EditorSection>

            {!placementLocked ? (
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
                        <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 12, color: COLOR.muted }}>
                            {TEACHER_EXERCISE_VISIBILITY_OPTIONS.find((option) => option.id === visibility)?.description}
                        </div>
                    </EditorSection>

                    <EditorSection>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <label style={{ ...editorLabelStyle, fontSize: 15, marginBottom: 4 }}>先生のおすすめ</label>
                                <span
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: 12,
                                        color: '#8395A7',
                                    }}
                                >
                                    メニュー画面の先頭に出しやすくします
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
                                <motion.div
                                    animate={{ x: recommended ? 22 : 2 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        background: 'white',
                                        borderRadius: '50%',
                                        position: 'absolute',
                                        top: 2,
                                        left: 0,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    }}
                                />
                            </button>
                        </div>
                        {recommended ? (
                            <div style={{ marginTop: 12 }}>
                                <label style={{ ...editorLabelStyle, fontSize: 13, marginBottom: 6 }}>
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
                                <div style={{ marginTop: 6, fontFamily: FONT.body, fontSize: 12, color: COLOR.muted }}>
                                    数字が小さいほど先に表示します
                                </div>
                            </div>
                        ) : null}
                    </EditorSection>
                </>
            ) : null}

            <EditorSection label="表示する場所">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {([
                        {
                            id: 'teacher_section' as const,
                            description: '先生種目にまとめて表示します',
                        },
                        {
                            id: 'standard_inline' as const,
                            description: `「${getExercisePlacementLabel(placement)}」のいちばん下に入れます。おすすめでも先頭には出しません`,
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
                <div style={{ marginTop: 8, fontFamily: FONT.body, fontSize: 12, color: COLOR.muted, lineHeight: 1.6 }}>
                    {displayMode === 'standard_inline'
                        ? `この種目は「${getExercisePlacementLabel(placement)}」カテゴリの最後に追加します。`
                        : 'この種目は「先生種目」にまとめて表示します。'}
                </div>
            </EditorSection>

            <EditorSection label="クラスごとの設定">
                <TeacherEditorStatusSection
                    legend={(
                        <>
                            <span style={{ color: '#2BBAA0' }}>★ 必須</span>
                            <span>⚪ おまかせ</span>
                            <span style={{ color: '#E17055' }}>✕ 除外</span>
                            <span style={{ color: '#8B5CF6' }}>👁 非表示</span>
                        </>
                    )}
                    options={STATUS_OPTIONS}
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
