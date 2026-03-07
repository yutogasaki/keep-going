import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Trash2 } from 'lucide-react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import {
    EditorSection,
    EditorShell,
    editorLabelStyle,
    getEditorActionButtonStyle,
    getEditorSubmitButtonStyle,
} from '../../../components/editor/EditorShell';
import type { TeacherMenu, TeacherExercise } from '../../../lib/teacherContent';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';

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
}

const MENU_STATUS_OPTIONS: { status: MenuSettingStatus; bg: string; color: string; label: string }[] = [
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
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '📋');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [exerciseIds, setExerciseIds] = useState<string[]>(initial?.exerciseIds ?? []);

    // Per-class status (menus: optional = 表示, hidden = 非表示)
    const [statusByClass, setStatusByClass] = useState<Record<string, MenuSettingStatus>>(() => {
        if (initialStatuses) return { ...initialStatuses };
        const defaults: Record<string, MenuSettingStatus> = {};
        for (const cl of CLASS_LEVELS) defaults[cl.id] = 'optional';
        return defaults;
    });

    const handleStatusChange = (classLevel: string, newStatus: MenuSettingStatus) => {
        setStatusByClass(prev => ({ ...prev, [classLevel]: newStatus }));
    };

    // Tap to add (duplicates OK)
    const addExercise = (id: string) => {
        setExerciseIds(prev => [...prev, id]);
    };

    // Remove by index (so duplicate items can be individually removed)
    const removeAtIndex = (index: number) => {
        setExerciseIds(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!name.trim() || exerciseIds.length === 0 || submitting) return;
        // Derive classLevels from statusByClass (non-hidden classes)
        const classLevels = Object.entries(statusByClass)
            .filter(([, s]) => s !== 'hidden')
            .map(([cl]) => cl);
        onSave({ name: name.trim(), emoji, description: description.trim(), exerciseIds, classLevels, statusByClass });
    };

    // All available exercises: built-in + teacher-created
    const allExercises = [
        ...EXERCISES.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, sec: e.sec, isTeacher: false })),
        ...teacherExercises.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, sec: e.sec, isTeacher: true })),
    ];

    // Lookup helper for selected exercises
    const lookupExercise = (id: string) => allExercises.find(e => e.id === id);

    const canSave = name.trim().length > 0 && exerciseIds.length > 0;

    return (
        <EditorShell
            title={initial ? '先生のメニューを編集' : '先生のメニューを作成'}
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

            <EditorSection label="メニュー名">
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
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
                    onChange={e => setDescription(e.target.value)}
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
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}>
                    <label style={{ ...editorLabelStyle, marginBottom: 0 }}>
                        えらんだ種目（{exerciseIds.length}）
                    </label>
                </div>

                {exerciseIds.length === 0 ? (
                    <div style={{
                        background: '#F8F9FA',
                        borderRadius: 16,
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        border: '2px dashed rgba(0,0,0,0.05)',
                    }}>
                        <div style={{ fontSize: 24, opacity: 0.5 }}>👇</div>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            textAlign: 'center',
                            margin: 0,
                            fontWeight: 600,
                        }}>
                            下のリストから種目をタップしてね
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {exerciseIds.map((id, index) => {
                            const ex = lookupExercise(id);
                            if (!ex) return null;
                            return (
                                <motion.button
                                    key={`${id}-${index}`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => removeAtIndex(index)}
                                    style={{
                                        padding: '8px 14px',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: 'rgba(43, 186, 160, 0.1)',
                                        cursor: 'pointer',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#00796B',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        boxShadow: '0 2px 4px rgba(43, 186, 160, 0.05)',
                                    }}
                                >
                                    {ex.emoji} {ex.name}
                                    <span style={{
                                        background: 'rgba(0,0,0,0.05)',
                                        borderRadius: '50%',
                                        width: 16,
                                        height: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#00796B',
                                        fontSize: 10,
                                        marginLeft: 4,
                                    }}>
                                        ×
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </EditorSection>

            <div>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                    marginLeft: 4,
                }}>
                    種目をタップして追加（くりかえしOK）
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {allExercises.map(ex => {
                        const count = exerciseIds.filter(id => id === ex.id).length;
                        return (
                            <motion.button
                                key={ex.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addExercise(ex.id)}
                                className="card"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '16px 20px',
                                    cursor: 'pointer',
                                    border: count > 0 ? '2px solid #2BBAA0' : '2px solid transparent',
                                    background: count > 0 ? 'rgba(43,186,160,0.04)' : 'white',
                                    textAlign: 'left',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <ExerciseIcon id={ex.id} emoji={ex.emoji} size={24} color="#2D3436" />
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 4,
                                    }}>
                                        <span style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: '#2D3436',
                                        }}>
                                            {ex.name}
                                        </span>
                                        {ex.isTeacher && (
                                            <span style={{
                                                fontSize: 9,
                                                fontWeight: 700,
                                                color: '#0984E3',
                                                background: 'rgba(9,132,227,0.1)',
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                            }}>
                                                先生
                                            </span>
                                        )}
                                    </div>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        color: '#8395A7',
                                    }}>
                                        {ex.sec}秒
                                    </span>
                                </div>
                                {count > 0 ? (
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 10,
                                        background: '#2BBAA0',
                                        color: 'white',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        boxShadow: '0 2px 8px rgba(43, 186, 160, 0.4)',
                                    }}>
                                        ×{count}
                                    </span>
                                ) : (
                                    <div style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: '#F8F9FA',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Plus size={18} color="#B2BEC3" />
                                    </div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <EditorSection label="クラスごとの設定">
                <div style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 10,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 10,
                    color: '#8395A7',
                }}>
                    <span>⚪ 表示</span>
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
                                    {MENU_STATUS_OPTIONS.map(opt => {
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
                disabled={!canSave || submitting}
                style={getEditorSubmitButtonStyle(canSave && !submitting)}
            >
                {submitting ? '保存中...' : initial ? '保存' : '作成'}
            </motion.button>
        </EditorShell>
    );
};
