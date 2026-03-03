import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CLASS_LEVELS } from '../../../data/exercises';
import type { TeacherExercise } from '../../../lib/teacherContent';

interface TeacherExerciseFormProps {
    initial?: TeacherExercise | null;
    onSave: (data: {
        name: string;
        sec: number;
        emoji: string;
        hasSplit: boolean;
        description: string;
        classLevels: string[];
    }) => void;
    onCancel: () => void;
    submitting: boolean;
}

const EMOJI_OPTIONS = [
    '🌸', '🎀', '🩰', '🦢', '🌟', '✨', '👑', '💎',
    '💖', '🦋', '🐱', '🐰', '🐻', '🌈', '🍎', '🍓',
    '🧘', '🏋️', '💪', '🦵', '🦶', '🙇', '💃', '🏃',
];

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #E0E0E0',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: '#636E72',
    marginBottom: 4,
};

export const TeacherExerciseForm: React.FC<TeacherExerciseFormProps> = ({
    initial,
    onSave,
    onCancel,
    submitting,
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '🌸');
    const [sec, setSec] = useState(initial?.sec ?? 30);
    const [hasSplit, setHasSplit] = useState(initial?.hasSplit ?? false);
    const [description, setDescription] = useState(initial?.description ?? '');
    const [classLevels, setClassLevels] = useState<string[]>(initial?.classLevels ?? []);

    const toggleClassLevel = (level: string) => {
        setClassLevels(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSave({ name: name.trim(), sec, emoji, hasSplit, description: description.trim(), classLevels });
    };

    return (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={labelStyle}>アイコン</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map(e => (
                    <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: emoji === e ? '2px solid #2BBAA0' : '2px solid transparent',
                            background: emoji === e ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                            cursor: 'pointer',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {e}
                    </button>
                ))}
            </div>

            <div style={labelStyle}>なまえ</div>
            <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="新しい種目の名前"
                style={inputStyle}
            />

            <div style={labelStyle}>せつめい</div>
            <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="種目の説明やポイント"
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
            />

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>時間（秒）</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[15, 30, 60, 120].map(s => (
                            <button
                                key={s}
                                onClick={() => setSec(s)}
                                style={{
                                    flex: 1,
                                    padding: '8px 0',
                                    borderRadius: 8,
                                    border: sec === s ? '2px solid #2BBAA0' : '1px solid #E0E0E0',
                                    background: sec === s ? 'rgba(43,186,160,0.08)' : '#FFF',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: sec === s ? '#2BBAA0' : '#8395A7',
                                    cursor: 'pointer',
                                }}
                            >
                                {s}秒
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <div style={labelStyle}>切替あり（左右）</div>
                </div>
                <button
                    onClick={() => setHasSplit(!hasSplit)}
                    style={{
                        width: 48,
                        height: 28,
                        borderRadius: 14,
                        background: hasSplit ? '#2BBAA0' : '#E2E8F0',
                        border: 'none',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background 0.3s',
                    }}
                >
                    <motion.div
                        animate={{ x: hasSplit ? 20 : 2 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{
                            width: 24,
                            height: 24,
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

            <div>
                <div style={labelStyle}>対象クラス（未選択＝全クラス）</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CLASS_LEVELS.map(cl => {
                        const selected = classLevels.includes(cl.id);
                        return (
                            <button
                                key={cl.id}
                                onClick={() => toggleClassLevel(cl.id)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 20,
                                    border: selected ? '2px solid #2BBAA0' : '1px solid #E0E0E0',
                                    background: selected ? '#E8F8F0' : '#FFF',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: selected ? '#2BBAA0' : '#8395A7',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {cl.emoji} {cl.id}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: '1px solid #E0E0E0',
                        background: '#FFF',
                        color: '#8395A7',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    キャンセル
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || submitting}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: 'none',
                        background: name.trim() ? '#2BBAA0' : '#B2BEC3',
                        color: '#FFF',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: name.trim() ? 'pointer' : 'default',
                    }}
                >
                    {submitting ? '保存中...' : initial ? '保存' : '作成'}
                </button>
            </div>
        </div>
    );
};
