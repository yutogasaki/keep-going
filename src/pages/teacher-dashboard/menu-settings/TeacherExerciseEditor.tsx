import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { CLASS_LEVELS } from '../../../data/exercises';
import type { TeacherExercise } from '../../../lib/teacherContent';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';

interface TeacherExerciseEditorProps {
    initial?: TeacherExercise | null;
    initialStatuses?: Record<string, MenuSettingStatus>;
    onSave: (data: {
        name: string;
        sec: number;
        emoji: string;
        hasSplit: boolean;
        description: string;
        classLevels: string[];
        statusByClass: Record<string, MenuSettingStatus>;
    }) => void;
    onCancel: () => void;
    onPlay?: () => void;
    onDelete?: () => void;
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
    submitting,
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '🌸');
    const [sec, setSec] = useState(initial?.sec ?? 30);
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
        onSave({ name: name.trim(), sec, emoji, hasSplit, description: description.trim(), classLevels, statusByClass });
    };

    const cardStyle: React.CSSProperties = { padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' };
    const labelStyle: React.CSSProperties = {
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        color: '#2D3436',
        display: 'block',
        marginBottom: 12,
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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                    onClick={onCancel}
                    style={{
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#8395A7',
                    }}
                >
                    ← もどる
                </button>
                <h1 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    {initial ? '先生の種目をへんしゅう' : '先生の種目をつくる'}
                </h1>
                <div style={{ width: 48 }} />
            </div>

            {/* Emoji selector */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>アイコン</label>
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
            </div>

            {/* Name */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>なまえ</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="新しい種目の名前"
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
            </div>

            {/* Description */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>せつめい</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="種目の説明やポイント"
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
            </div>

            {/* Time */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>時間（秒）</label>
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
            </div>

            {/* Split Toggle */}
            <div className="card" style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <label style={{ ...labelStyle, fontSize: 15, marginBottom: 4 }}>切替あり</label>
                        <span style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
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
            </div>

            {/* Per-class status */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>クラスごとの設定</label>
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
            </div>

            <div style={{ flex: 1 }} />

            {/* Play & Delete buttons (edit mode only) */}
            {initial && (
                <div style={{ display: 'flex', gap: 8 }}>
                    {onPlay && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onPlay}
                            style={{
                                flex: 1,
                                padding: '14px 0',
                                borderRadius: 16,
                                border: 'none',
                                background: 'rgba(43,186,160,0.1)',
                                color: '#2BBAA0',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <Play size={14} />
                            ためす
                        </motion.button>
                    )}
                    {onDelete && (
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={onDelete}
                            style={{
                                padding: '14px 20px',
                                borderRadius: 16,
                                border: 'none',
                                background: 'rgba(225,112,85,0.08)',
                                color: '#E17055',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <Trash2 size={14} />
                            削除
                        </motion.button>
                    )}
                </div>
            )}

            {/* Save button */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!name.trim() || submitting}
                style={{
                    position: 'sticky',
                    bottom: 0,
                    padding: '16px 0',
                    borderRadius: 16,
                    border: 'none',
                    background: name.trim() ? 'linear-gradient(135deg, #2BBAA0, #1A937D)' : '#DFE6E9',
                    color: name.trim() ? 'white' : '#B2BEC3',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: name.trim() && !submitting ? 'pointer' : 'not-allowed',
                    boxShadow: name.trim()
                        ? '0 8px 20px rgba(43, 186, 160, 0.3)'
                        : 'none',
                    transition: 'all 0.3s ease',
                    marginTop: 16,
                }}
            >
                {submitting ? '保存中...' : initial ? 'ほぞん' : 'つくる！'}
            </motion.button>
        </div>,
        document.body
    );
};
