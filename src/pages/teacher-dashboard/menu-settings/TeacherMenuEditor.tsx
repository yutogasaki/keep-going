import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import type { TeacherMenu, TeacherExercise } from '../../../lib/teacherContent';

interface TeacherMenuEditorProps {
    initial?: TeacherMenu | null;
    teacherExercises: TeacherExercise[];
    onSave: (data: {
        name: string;
        emoji: string;
        description: string;
        exerciseIds: string[];
        classLevels: string[];
    }) => void;
    onCancel: () => void;
    submitting: boolean;
}

const EMOJI_OPTIONS = [
    '🌸', '🎀', '🩰', '🦢', '🌟', '✨', '💪', '🦵',
    '🏋️', '💃', '⭐', '🌈', '🍎', '📋', '🔥', '🧘',
];

export const TeacherMenuEditor: React.FC<TeacherMenuEditorProps> = ({
    initial,
    teacherExercises,
    onSave,
    onCancel,
    submitting,
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '📋');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [exerciseIds, setExerciseIds] = useState<string[]>(initial?.exerciseIds ?? []);
    const [classLevels, setClassLevels] = useState<string[]>(initial?.classLevels ?? []);

    const toggleClassLevel = (level: string) => {
        setClassLevels(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
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
        onSave({ name: name.trim(), emoji, description: description.trim(), exerciseIds, classLevels });
    };

    // All available exercises: built-in + teacher-created
    const allExercises = [
        ...EXERCISES.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, sec: e.sec, isTeacher: false })),
        ...teacherExercises.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, sec: e.sec, isTeacher: true })),
    ];

    // Lookup helper for selected exercises
    const lookupExercise = (id: string) => allExercises.find(e => e.id === id);

    const canSave = name.trim().length > 0 && exerciseIds.length > 0;

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
                    {initial ? '先生のメニューをへんしゅう' : '先生のメニューをつくる'}
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
                <label style={labelStyle}>メニュー名</label>
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
            </div>

            {/* Description */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>せつめい</label>
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
            </div>

            {/* Selected exercises (chips) */}
            <div className="card" style={cardStyle}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>
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
            </div>

            {/* Exercise picker list (tap to add, duplicates OK) */}
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

            {/* Class Levels */}
            <div className="card" style={cardStyle}>
                <label style={labelStyle}>
                    対象クラス
                    <span style={{ fontWeight: 400, color: '#B2BEC3', marginLeft: 6, fontSize: 11 }}>未選択＝全クラス</span>
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CLASS_LEVELS.map(cl => {
                        const selected = classLevels.includes(cl.id);
                        return (
                            <motion.button
                                key={cl.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleClassLevel(cl.id)}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: 20,
                                    border: selected ? '2px solid #2BBAA0' : '2px solid transparent',
                                    background: selected ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: selected ? '#2BBAA0' : '#8395A7',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {cl.emoji} {cl.id}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            <div style={{ flex: 1 }} />

            {/* Save button */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!canSave || submitting}
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
                    cursor: canSave && !submitting ? 'pointer' : 'not-allowed',
                    boxShadow: canSave
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
