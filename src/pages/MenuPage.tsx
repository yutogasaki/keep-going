import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, ChevronDown, Clock, Trash2, Star, Edit2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getExerciseById, calculateTotalSeconds, getExercisesByClass, SESSION_TARGET_SECONDS } from '../data/exercises';
import { getPresetsForClass, getCustomGroups, deleteCustomGroup, type MenuGroup } from '../data/menuGroups';
import { getCustomExercises, saveCustomExercise, deleteCustomExercise, type CustomExercise } from '../lib/db';
import { audio } from '../lib/audio';

type MenuTab = 'group' | 'individual';

export const MenuPage: React.FC = () => {
    const classLevel = useAppStore(s => s.classLevel);
    const startSessionWithExercises = useAppStore(s => s.startSessionWithExercises);
    const [tab, setTab] = useState<MenuTab>('group');
    const [presets, setPresets] = useState<MenuGroup[]>([]);
    const [customGroups, setCustomGroups] = useState<MenuGroup[]>([]);
    const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateEx, setShowCreateEx] = useState(false);
    const [editGroup, setEditGroup] = useState<MenuGroup | null>(null);
    const [editEx, setEditEx] = useState<CustomExercise | null>(null);

    useEffect(() => {
        setPresets(getPresetsForClass(classLevel));
        loadCustomData();
    }, [classLevel]);

    const loadCustomData = async () => {
        setCustomGroups(await getCustomGroups());
        setCustomExercises(await getCustomExercises());
    };

    const handleGroupTap = (group: MenuGroup) => {
        audio.initTTS();
        startSessionWithExercises(group.exerciseIds);
    };

    const handleDeleteGroup = async (id: string) => {
        await deleteCustomGroup(id);
        await loadCustomData();
    };

    const handleDeleteEx = async (id: string) => {
        await deleteCustomExercise(id);
        await loadCustomData();
    };

    const handleCreatedGroup = () => {
        setShowCreateGroup(false);
        setEditGroup(null);
        loadCustomData();
    };

    const handleCreatedEx = () => {
        setShowCreateEx(false);
        setEditEx(null);
        loadCustomData();
    };

    if (showCreateGroup || editGroup) {
        return (
            <CreateGroupView
                classLevel={classLevel}
                initial={editGroup}
                onSave={handleCreatedGroup}
                onCancel={() => { setShowCreateGroup(false); setEditGroup(null); }}
            />
        );
    }

    if (showCreateEx || editEx) {
        return (
            <SingleExerciseEditor
                initial={editEx}
                onSave={handleCreatedEx}
                onCancel={() => { setShowCreateEx(false); setEditEx(null); }}
            />
        );
    }

    const exercises = getExercisesByClass(classLevel);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 20px 100px 20px',
            gap: 16,
            overflowY: 'auto',
        }}>
            <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2D3436',
            }}>
                メニュー
            </h1>

            {/* Tab toggle */}
            <div style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 12,
                padding: 3,
            }}>
                {[
                    { id: 'group' as MenuTab, label: 'セット' },
                    { id: 'individual' as MenuTab, label: 'オリジナル' },
                ].map(t => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 10,
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            background: tab === t.id ? 'white' : 'transparent',
                            color: tab === t.id ? '#2D3436' : '#8395A7',
                            boxShadow: tab === t.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Group tab content */}
            {tab === 'group' && (
                <>
                    <section>
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#8395A7',
                            marginBottom: 10,
                            letterSpacing: 1,
                        }}>
                            セットメニュー
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {presets.map((group, i) => (
                                <GroupCard
                                    key={group.id}
                                    group={group}
                                    index={i}
                                    onTap={() => handleGroupTap(group)}
                                />
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#8395A7',
                            marginBottom: 10,
                            letterSpacing: 1,
                        }}>
                            じぶんのメニュー
                        </h2>
                        {customGroups.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                                {customGroups.map((group, i) => (
                                    <GroupCard
                                        key={group.id}
                                        group={group}
                                        index={i}
                                        onTap={() => handleGroupTap(group)}
                                        onEdit={() => setEditGroup(group)}
                                        onDelete={() => handleDeleteGroup(group.id)}
                                        isCustom
                                    />
                                ))}
                            </div>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowCreateGroup(true)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                borderRadius: 16,
                                border: '2px dashed rgba(43, 186, 160, 0.3)',
                                background: 'rgba(43, 186, 160, 0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#2BBAA0',
                            }}
                        >
                            <Plus size={18} />
                            じぶんでつくる
                        </motion.button>
                    </section>
                </>
            )}

            {/* Individual tab content */}
            {tab === 'individual' && (
                <section>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        marginBottom: 12,
                    }}>
                        FABで開始すると ★ はかならず入ります（約{Math.ceil(SESSION_TARGET_SECONDS / 60)}分）
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {exercises.map((ex, i) => (
                            <motion.div
                                key={ex.id}
                                className="card"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.03 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 16px',
                                }}
                            >
                                <span style={{ fontSize: 24, flexShrink: 0 }}>{ex.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 2,
                                    }}>
                                        <span style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: '#2D3436',
                                        }}>
                                            {ex.name}
                                        </span>
                                        {ex.priority === 'high' && (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                background: 'rgba(255, 183, 77, 0.15)',
                                                color: '#F59E0B',
                                                fontSize: 10,
                                                fontWeight: 700,
                                                fontFamily: "'Outfit', sans-serif",
                                            }}>
                                                <Star size={9} fill="#F59E0B" />
                                                必須
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#8395A7',
                                        display: 'flex',
                                        gap: 8,
                                    }}>
                                        <span>{ex.sec}秒</span>
                                        <span>{ex.type === 'stretch' ? 'ストレッチ' : '体幹'}</span>
                                        {ex.internal !== 'single' && (
                                            <span style={{ color: '#2BBAA0' }}>
                                                {ex.internal === 'P10・F10×3' ? '切替あり' : '左右あり'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Single exercise play */}
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        audio.initTTS();
                                        startSessionWithExercises([ex.id]);
                                    }}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        background: 'rgba(43, 186, 160, 0.1)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Play size={14} color="#2BBAA0" fill="#2BBAA0" />
                                </motion.button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Custom Single Exercises */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                        {customExercises.map((ex, i) => (
                            <motion.div
                                key={ex.id}
                                className="card"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: i * 0.03 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '14px 16px',
                                }}
                            >
                                <span style={{ fontSize: 24, flexShrink: 0 }}>{ex.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        marginBottom: 2,
                                    }}>
                                        <span style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 15,
                                            fontWeight: 700,
                                            color: '#2D3436',
                                        }}>
                                            {ex.name}
                                        </span>
                                    </div>
                                    <div style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        color: '#8395A7',
                                        display: 'flex',
                                        gap: 8,
                                        alignItems: 'center',
                                    }}>
                                        <Clock size={12} />
                                        <span>約{Math.round(ex.sec / 60)}分</span>
                                        {ex.hasSplit && (
                                            <span style={{ color: '#2BBAA0', marginLeft: 4 }}>切替あり</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button
                                        onClick={() => setEditEx(ex)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'rgba(0,0,0,0.04)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Edit2 size={16} color="#8395A7" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteEx(ex.id)}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 10,
                                            border: 'none',
                                            background: 'rgba(231, 76, 60, 0.1)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Trash2 size={16} color="#E74C3C" />
                                    </button>
                                    <div style={{ width: 8 }} />
                                    <button
                                        onClick={() => startSessionWithExercises([ex.id])}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: '50%',
                                            background: '#2BBAA0',
                                            border: 'none',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Play size={14} color="white" fill="white" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setShowCreateEx(true)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                borderRadius: 16,
                                border: '2px dashed rgba(43, 186, 160, 0.3)',
                                background: 'rgba(43, 186, 160, 0.04)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 600,
                                color: '#2BBAA0',
                                marginTop: 8,
                            }}
                        >
                            <Plus size={18} />
                            単品をつくる
                        </motion.button>
                    </div>
                </section>
            )}
        </div>
    );
};

// ─── Group Card ──────────────────────────────────────
const GroupCard: React.FC<{
    group: MenuGroup;
    index: number;
    onTap: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isCustom?: boolean;
}> = ({ group, index, onTap, onEdit, onDelete, isCustom }) => {
    const [expanded, setExpanded] = useState(false);
    const totalSec = calculateTotalSeconds(group.exerciseIds);
    const minutes = Math.ceil(totalSec / 60);

    return (
        <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ padding: 0, overflow: 'hidden' }}
        >
            {/* Main row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 16px',
                    cursor: 'pointer',
                }}
                onClick={onTap}
            >
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    flexShrink: 0,
                }}>
                    {group.emoji}
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 2,
                    }}>
                        {group.name}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                    }}>
                        <Clock size={12} />
                        <span>約{minutes}分</span>
                        <span>·</span>
                        <span>{group.exerciseIds.length}種目</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {/* Expand button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            border: 'none',
                            background: 'rgba(0,0,0,0.04)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <ChevronDown
                            size={16}
                            color="#B2BEC3"
                            style={{
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 0.2s ease',
                            }}
                        />
                    </button>
                    {/* Play button */}
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#2BBAA0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Play size={14} color="white" fill="white" />
                    </div>
                </div>
            </div>

            {/* Expanded exercise list */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ padding: '10px 16px 12px' }}>
                            {group.description && (
                                <p style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    marginBottom: 8,
                                }}>
                                    {group.description}
                                </p>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {group.exerciseIds.map((id, i) => {
                                    const ex = getExerciseById(id);
                                    if (!ex) return null;
                                    return (
                                        <span key={`${id}-${i}`} style={{
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            background: 'rgba(0,0,0,0.04)',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#2D3436',
                                        }}>
                                            {ex.emoji} {ex.name}
                                        </span>
                                    );
                                })}
                            </div>
                            {isCustom && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: 'white',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#8395A7',
                                        }}
                                    >
                                        へんしゅう
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(225, 112, 85, 0.08)',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#E17055',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        さくじょ
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// ─── Create / Edit Group View ───────────────────────
import { saveCustomGroup } from '../data/menuGroups';

const EMOJI_OPTIONS = ['🌸', '💪', '🦵', '🩰', '⭐', '🌈', '🔥', '💃', '🧘', '🎯', '✨', '🌙'];

const CreateGroupView: React.FC<{
    classLevel: string;
    initial: MenuGroup | null;
    onSave: () => void;
    onCancel: () => void;
}> = ({ classLevel, initial, onSave, onCancel }) => {
    const [name, setName] = useState(initial?.name || '');
    const [emoji, setEmoji] = useState(initial?.emoji || '🌸');
    const [selectedIds, setSelectedIds] = useState<string[]>(initial?.exerciseIds || []);

    const availableExercises = getExercisesByClass(classLevel as any);
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
            description: '',
            exerciseIds: selectedIds,
            isPreset: false,
        };
        await saveCustomGroup(group);
        onSave();
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 20px 100px 20px',
            gap: 16,
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
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8395A7',
                    display: 'block',
                    marginBottom: 8,
                }}>
                    アイコン
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {EMOJI_OPTIONS.map(e => (
                        <button
                            key={e}
                            onClick={() => setEmoji(e)}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                border: emoji === e ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: emoji === e ? 'rgba(43,186,160,0.08)' : 'rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                fontSize: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>

            {/* Name input */}
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8395A7',
                    display: 'block',
                    marginBottom: 8,
                }}>
                    なまえ
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="マイメニュー"
                    style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        border: '1px solid rgba(0,0,0,0.1)',
                        background: 'rgba(0,0,0,0.02)',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        color: '#2D3436',
                        outline: 'none',
                    }}
                />
            </div>

            {/* Selected exercises */}
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                }}>
                    <label style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#8395A7',
                    }}>
                        えらんだ種目（{selectedIds.length}）
                    </label>
                    <span style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#2BBAA0',
                    }}>
                        約{minutes}分
                    </span>
                </div>

                {selectedIds.length === 0 ? (
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        color: '#B2BEC3',
                        textAlign: 'center',
                        padding: 16,
                    }}>
                        下のリストから種目をタップしてね
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                                        padding: '6px 12px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: 'rgba(43, 186, 160, 0.1)',
                                        cursor: 'pointer',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 13,
                                        color: '#2D3436',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    {ex.emoji} {ex.name}
                                    <span style={{ color: '#B2BEC3', fontSize: 11, marginLeft: 2 }}>×</span>
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
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8395A7',
                    display: 'block',
                    marginBottom: 8,
                }}>
                    種目をタップして追加（くりかえしOK）
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {availableExercises.map(ex => {
                        const count = selectedIds.filter(id => id === ex.id).length;
                        return (
                            <motion.button
                                key={ex.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => addExercise(ex.id)}
                                className="card card-sm"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 14px',
                                    cursor: 'pointer',
                                    border: count > 0 ? '1px solid rgba(43,186,160,0.3)' : '1px solid transparent',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{ex.emoji}</span>
                                <div style={{ flex: 1 }}>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: '#2D3436',
                                    }}>
                                        {ex.name}
                                    </span>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#8395A7',
                                        marginLeft: 8,
                                    }}>
                                        {ex.sec}秒 {ex.internal !== 'single' ? `(${ex.internal})` : ''}
                                    </span>
                                </div>
                                {count > 0 && (
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: 8,
                                        background: '#2BBAA0',
                                        color: 'white',
                                        fontSize: 11,
                                        fontWeight: 700,
                                        fontFamily: "'Outfit', sans-serif",
                                    }}>
                                        ×{count}
                                    </span>
                                )}
                                <Plus size={16} color="#B2BEC3" />
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Save button */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!name.trim() || selectedIds.length === 0}
                style={{
                    position: 'sticky',
                    bottom: 16,
                    padding: '14px 0',
                    borderRadius: 9999,
                    border: 'none',
                    background: name.trim() && selectedIds.length > 0 ? '#2BBAA0' : '#B2BEC3',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: name.trim() && selectedIds.length > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: name.trim() && selectedIds.length > 0
                        ? '0 4px 16px rgba(43, 186, 160, 0.35)'
                        : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                {initial ? 'ほぞん' : 'つくる！'}
            </motion.button>
        </div>
    );
};

// --- Single Exercise Editor ---
interface SingleExerciseEditorProps {
    initial?: CustomExercise | null;
    onSave: () => void;
    onCancel: () => void;
}

const SingleExerciseEditor: React.FC<SingleExerciseEditorProps> = ({ initial, onSave, onCancel }) => {
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
        };
        await saveCustomExercise(ex);
        onSave();
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px 20px 100px 20px',
            gap: 16,
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
                    {initial ? 'オリジナルをへんしゅう' : 'オリジナルをつくる'}
                </h1>
                <div style={{ width: 48 }} />
            </div>

            {/* Emoji selector */}
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8395A7',
                    display: 'block',
                    marginBottom: 8,
                }}>
                    アイコン
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {EMOJI_OPTIONS.map(e => (
                        <button
                            key={e}
                            onClick={() => setEmoji(e)}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                border: emoji === e ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: emoji === e ? 'rgba(43,186,160,0.08)' : 'rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                fontSize: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>

            {/* Name input */}
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8395A7',
                    display: 'block',
                    marginBottom: 8,
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
                        border: 'none',
                        background: 'rgba(0,0,0,0.03)',
                        padding: '12px 16px',
                        borderRadius: 12,
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 16,
                        outline: 'none',
                    }}
                />
            </div>

            {/* Time Settings */}
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <label style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8395A7',
                    display: 'block',
                    marginBottom: 8,
                }}>
                    時間（秒）
                </label>
                <div style={{ display: 'flex', gap: 10 }}>
                    {[15, 30, 60, 120].map(s => (
                        <button
                            key={s}
                            onClick={() => setSec(s)}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                borderRadius: 12,
                                border: sec === s ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: sec === s ? 'rgba(43,186,160,0.08)' : 'rgba(0,0,0,0.03)',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                color: sec === s ? '#2BBAA0' : '#8395A7',
                            }}
                        >
                            {s}秒
                        </button>
                    ))}
                </div>
            </div>

            {/* Split Toggle */}
            <div className="card card-sm" style={{ padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <label style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#2D3436',
                            display: 'block',
                            marginBottom: 4,
                        }}>
                            切替あり
                        </label>
                        <span style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
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
                    padding: '14px 0',
                    borderRadius: 9999,
                    border: 'none',
                    background: name.trim() ? '#2BBAA0' : '#B2BEC3',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: name.trim()
                        ? '0 4px 16px rgba(43, 186, 160, 0.35)'
                        : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                {initial ? 'ほぞん' : 'つくる！'}
            </motion.button>
        </div>
    );
};
