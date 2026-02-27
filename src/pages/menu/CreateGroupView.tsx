import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Globe, Plus } from 'lucide-react';
import { calculateTotalSeconds, getExerciseById, getExercisesByClass, type ClassLevel } from '../../data/exercises';
import { saveCustomGroup, type MenuGroup } from '../../data/menuGroups';
import { publishMenu } from '../../lib/publicMenus';
import { getAccountId } from '../../lib/sync';

const EMOJI_OPTIONS = ['🌸', '💪', '🦵', '🩰', '⭐', '🌈', '🔥', '💃', '🧘', '🎯', '✨', '🌙'];

export const CreateGroupView: React.FC<{
    classLevel: string;
    initial: MenuGroup | null;
    currentUserId?: string;
    authorName?: string;
    onSave: () => void;
    onCancel: () => void;
}> = ({ classLevel, initial, currentUserId, authorName, onSave, onCancel }) => {
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

    const addExercise = (id: string) => {
        setSelectedIds(prev => [...prev, id]);
    };

    const handleSave = async () => {
        if (!name.trim() || selectedIds.length === 0) return;
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

        // Publish if toggle is on (new menus only)
        if (isPublic && !isEditing && isLoggedIn && authorName) {
            try {
                await publishMenu(group, authorName);
            } catch (err) {
                console.warn('[CreateGroupView] publish failed:', err);
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
            padding: '64px 20px 100px 20px',
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
                    {initial ? 'へんしゅう' : 'じぶんでつくる'}
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
                    placeholder="じぶんのメニュー"
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

            {/* Description input */}
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#2D3436',
                    display: 'block',
                    marginBottom: 12,
                }}>
                    せつめい
                    <span style={{ fontWeight: 400, color: '#B2BEC3', marginLeft: 6, fontSize: 11 }}>じゆう</span>
                </label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="メニューの説明やコメント"
                    rows={3}
                    style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 16,
                        border: '1px solid rgba(0,0,0,0.05)',
                        background: '#F8F9FA',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#2D3436',
                        outline: 'none',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s',
                        resize: 'none',
                        lineHeight: 1.6,
                    }}
                />
            </div>

            {/* Selected exercises */}
            <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}>
                    <label style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        えらんだ種目（{selectedIds.length}）
                    </label>
                    <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#2BBAA0',
                        background: 'rgba(43, 186, 160, 0.1)',
                        padding: '4px 10px',
                        borderRadius: 10,
                    }}>
                        約{minutes}分
                    </span>
                </div>

                {selectedIds.length === 0 ? (
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
                        {selectedIds.map((id, i) => {
                            const ex = getExerciseById(id);
                            if (!ex) return null;
                            return (
                                <motion.button
                                    key={`${id}-${i}`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setSelectedIds(prev => prev.filter((_, idx) => idx !== i));
                                    }}
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
                                        boxShadow: '0 2px 4px rgba(43, 186, 160, 0.05)'
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
                                        marginLeft: 4
                                    }}>×</span>
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Exercise picker */}
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
                    {availableExercises.map(ex => {
                        const count = selectedIds.filter(id => id === ex.id).length;
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
                                <span style={{ fontSize: 24, flexShrink: 0 }}>{ex.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        display: 'block',
                                        marginBottom: 4,
                                    }}>
                                        {ex.name}
                                    </span>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        color: '#8395A7',
                                    }}>
                                        {ex.sec}秒 {ex.internal !== 'single' ? `(${ex.internal})` : ''}
                                    </span>
                                </div>
                                {count > 0 && (
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: 10,
                                        background: '#2BBAA0',
                                        color: 'white',
                                        fontSize: 12,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                        boxShadow: '0 2px 8px rgba(43, 186, 160, 0.4)'
                                    }}>
                                        ×{count}
                                    </span>
                                )}
                                {count === 0 && (
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

            {/* Publish toggle (only for new menus when logged in) */}
            {isLoggedIn && !isEditing && (
                <div className="card" style={{
                    padding: '16px 20px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Globe size={18} color={isPublic ? '#0984E3' : '#B2BEC3'} />
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>
                                みんなに公開する
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                            }}>
                                他の人がこのメニューをもらえるようになります
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPublic(!isPublic)}
                        style={{
                            width: 48,
                            height: 28,
                            borderRadius: 14,
                            border: 'none',
                            background: isPublic ? '#0984E3' : '#DFE6E9',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'background 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        <div style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: 3,
                            left: isPublic ? 23 : 3,
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                        }} />
                    </button>
                </div>
            )}

            {/* Save button */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!name.trim() || selectedIds.length === 0}
                style={{
                    position: 'sticky',
                    bottom: 16,
                    padding: '16px 0',
                    borderRadius: 16,
                    border: 'none',
                    background: name.trim() && selectedIds.length > 0 ? 'linear-gradient(135deg, #2BBAA0, #1A937D)' : '#DFE6E9',
                    color: name.trim() && selectedIds.length > 0 ? 'white' : '#B2BEC3',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: name.trim() && selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: name.trim() && selectedIds.length > 0
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
