import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { saveCustomExercise, type CustomExercise } from '../../lib/db';

interface SingleExerciseEditorProps {
    initial?: CustomExercise | null;
    currentUserId?: string;
    onSave: () => void;
    onCancel: () => void;
}

export const SingleExerciseEditor: React.FC<SingleExerciseEditorProps> = ({ initial, currentUserId, onSave, onCancel }) => {
    const [name, setName] = useState(initial?.name || '');
    const [emoji, setEmoji] = useState(initial?.emoji || '🌸');
    const [sec, setSec] = useState<number>(initial?.sec || 30);
    const [hasSplit, setHasSplit] = useState<boolean>(initial?.hasSplit || false);

    const EMOJI_OPTIONS = [
        '🌸', '🎀', '🩰', '🦢', '🌟', '✨', '👑', '💎',
        '💖', '🦋', '🐱', '🐰', '🐻', '🌈', '🍎', '🍓',
        '🧘', '🏋️', '💪', '🦵', '🦶', '🙇', '💃', '🏃'
    ];

    const handleSave = async () => {
        if (!name.trim()) return;
        const ex: CustomExercise = {
            id: initial?.id || `custom-ex-${Date.now()}`,
            name: name.trim(),
            emoji,
            sec: sec as number,
            hasSplit,
            creatorId: currentUserId,
        };
        await saveCustomExercise(ex);
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
            padding: '64px 20px 100px 20px', // Avoid overlap with CurrentContextBadge
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
                    {initial ? 'じぶん種目をへんしゅう' : 'じぶん種目をつくる'}
                </h1>
                <div style={{ width: 48 }} />
            </div>

            {/* Emoji selector */}
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                }}>
                    アイコン
                </label>
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

            {/* Name input */}
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                }}>
                    なまえ
                </label>
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

            {/* Time Settings */}
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                }}>
                    時間（秒）
                </label>
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
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <label style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            display: 'block',
                            marginBottom: 4,
                        }}>
                            切替あり
                        </label>
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

            <div style={{ flex: 1 }} />

            {/* Save button */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!name.trim()}
                style={{
                    position: 'sticky',
                    bottom: 16,
                    padding: '16px 0',
                    borderRadius: 16,
                    border: 'none',
                    background: name.trim() ? 'linear-gradient(135deg, #2BBAA0, #1A937D)' : '#DFE6E9',
                    color: name.trim() ? 'white' : '#B2BEC3',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: name.trim()
                        ? '0 8px 20px rgba(43, 186, 160, 0.3)'
                        : 'none',
                    transition: 'all 0.3s ease',
                    marginTop: 16,
                }}
            >
                {initial ? 'ほぞん' : 'つくる！'}
            </motion.button>
        </div>,
        document.body
    );
};
