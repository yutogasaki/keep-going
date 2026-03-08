import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { CLASS_LEVELS } from '../../../data/exercises';
import {
    EXERCISE_PLACEMENTS,
    getExercisePlacementLabel,
    type ExercisePlacement,
} from '../../../data/exercisePlacement';
import {
    EditorSection,
    EditorShell,
    editorLabelStyle,
    getEditorActionButtonStyle,
    getEditorSubmitButtonStyle,
} from '../../../components/editor/EditorShell';
import type { TeacherExercise } from '../../../lib/teacherContent';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';
import { COLOR, FONT, FONT_SIZE, inputField } from '../../../lib/styles';

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
        statusByClass: Record<string, MenuSettingStatus>;
    }) => void;
    onCancel: () => void;
    onPlay?: () => void;
    onDelete?: () => void;
    placementLocked?: boolean;
    submitting: boolean;
}

const STATUS_OPTIONS: { status: MenuSettingStatus; bg: string; color: string; label: string }[] = [
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
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '🌸');
    const [sec, setSec] = useState(initial?.sec ?? 30);
    const [placement, setPlacement] = useState<ExercisePlacement>(initial?.placement ?? 'stretch');
    const [hasSplit, setHasSplit] = useState(initial?.hasSplit ?? false);
    const [description, setDescription] = useState(initial?.description ?? '');

    // Per-class status (default: optional for all)
    const [statusByClass, setStatusByClass] = useState<Record<string, MenuSettingStatus>>(() => {
        if (initialStatuses) return { ...initialStatuses };
        const defaults: Record<string, MenuSettingStatus> = {};
        for (const cl of CLASS_LEVELS) defaults[cl.id] = 'optional';
        return defaults;
    });

    const handleStatusChange = (classLevel: string, newStatus: MenuSettingStatus) => {
        setStatusByClass(prev => ({ ...prev, [classLevel]: newStatus }));
    };

    const handleSubmit = () => {
        if (!name.trim() || submitting) return;
        // Derive classLevels from statusByClass (non-hidden classes)
        const classLevels = Object.entries(statusByClass)
            .filter(([, s]) => s !== 'hidden')
            .map(([cl]) => cl);
        onSave({ name: name.trim(), sec, emoji, placement, hasSplit, description: description.trim(), classLevels, statusByClass });
    };

    return (
        <EditorShell
            title={initial ? '先生の種目を編集' : '先生の種目を作成'}
            onBack={onCancel}
        >
            <EditorSection label="アイコン">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EMOJI_OPTIONS.map(e => (
                        <motion.button
                            key={e}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEmoji(e)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                border: emoji === e ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: emoji === e ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                                cursor: 'pointer',
                                fontSize: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            {e}
                        </motion.button>
                    ))}
                </div>
            </EditorSection>

            <EditorSection label="なまえ">
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
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
                    onChange={e => setDescription(e.target.value)}
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
                <div style={{ display: 'flex', gap: 10 }}>
                    {[15, 30, 60, 120].map(s => (
                        <motion.button
                            key={s}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSec(s)}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                borderRadius: 12,
                                border: sec === s ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: sec === s ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                color: sec === s ? '#2BBAA0' : '#8395A7',
                                transition: 'all 0.2s',
                            }}
                        >
                            {s}秒
                        </motion.button>
                    ))}
                </div>
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
                {placementLocked && (
                    <div style={{
                        marginTop: 8,
                        fontFamily: FONT.body,
                        fontSize: 12,
                        color: COLOR.muted,
                        lineHeight: 1.5,
                    }}>
                        標準種目の配置は固定です。新しい先生の種目では自由に選べます。
                    </div>
                )}
            </EditorSection>

            <EditorSection>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <label style={{ ...editorLabelStyle, fontSize: 15, marginBottom: 4 }}>切替あり</label>
                        <span style={{
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: '#8395A7',
                        }}>
                            半分の時間で「反対」「切り替え」の合図が鳴ります
                        </span>
                    </div>
                    <button
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

            <EditorSection label="クラスごとの設定">
                <div style={{
                    display: 'flex',
                    gap: 4,
                    marginBottom: 10,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 10,
                    color: '#8395A7',
                }}>
                    <span style={{ color: '#2BBAA0' }}>★ 必須</span>
                    <span>⚪ おまかせ</span>
                    <span style={{ color: '#E17055' }}>✕ 除外</span>
                    <span style={{ color: '#8B5CF6' }}>👁 非表示</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {CLASS_LEVELS.map(cl => {
                        const currentStatus = statusByClass[cl.id] || 'optional';
                        return (
                            <div
                                key={cl.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '6px 0',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                }}
                            >
                                <span style={{ fontSize: 14, flexShrink: 0 }}>{cl.emoji}</span>
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: '#636E72',
                                    width: 36,
                                    flexShrink: 0,
                                }}>
                                    {cl.id}
                                </span>
                                <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                                    {STATUS_OPTIONS.map(opt => {
                                        const isActive = currentStatus === opt.status;
                                        return (
                                            <button
                                                key={opt.status}
                                                onClick={() => handleStatusChange(cl.id, opt.status)}
                                                style={{
                                                    flex: 1,
                                                    padding: '5px 2px',
                                                    borderRadius: 8,
                                                    border: isActive ? `2px solid ${opt.color}` : '2px solid transparent',
                                                    background: isActive ? opt.bg : '#F8F9FA',
                                                    color: isActive ? opt.color : '#B2BEC3',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </EditorSection>

            <div style={{ flex: 1 }} />

            {initial && (
                <div style={{ display: 'flex', gap: 8 }}>
                    {onPlay && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onPlay}
                            style={getEditorActionButtonStyle('soft')}
                        >
                            <Play size={14} />
                            ためす
                        </motion.button>
                    )}
                    {onDelete && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onDelete}
                            style={getEditorActionButtonStyle('danger', false)}
                        >
                            <Trash2 size={14} />
                            削除
                        </motion.button>
                    )}
                </div>
            )}

            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!name.trim() || submitting}
                style={getEditorSubmitButtonStyle(Boolean(name.trim()) && !submitting)}
            >
                {submitting ? '保存中...' : initial ? '保存' : '作成'}
            </motion.button>
        </EditorShell>
    );
};
