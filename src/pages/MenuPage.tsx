import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, ChevronDown, Clock, Trash2, Star, Edit2, X, Settings2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ExerciseIcon } from '../components/ExerciseIcon';
import { getExerciseById, calculateTotalSeconds, getExercisesByClass, DEFAULT_SESSION_TARGET_SECONDS, EXERCISES } from '../data/exercises';
import { getPresetsForClass, getCustomGroups, deleteCustomGroup, type MenuGroup } from '../data/menuGroups';
import { getCustomExercises, saveCustomExercise, deleteCustomExercise, type CustomExercise } from '../lib/db';
import { audio } from '../lib/audio';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';

type MenuTab = 'group' | 'individual';

export const MenuPage: React.FC = () => {
    const users = useAppStore(s => s.users);
    const sessionUserIds = useAppStore(s => s.sessionUserIds);
    // Use sessionUserIds instead of activeUserIds so the menu matches the home screen swipe state
    const currentUsers = users.filter(u => sessionUserIds.includes(u.id));
    const classLevel = currentUsers.length > 0
        ? currentUsers.reduce((min, u) => {
            const weights: Record<'プレ' | '初級' | '中級' | '上級', number> = { 'プレ': 0, '初級': 1, '中級': 2, '上級': 3 };
            return weights[u.classLevel] < weights[min] ? u.classLevel : min;
        }, currentUsers[0].classLevel)
        : '初級';
    const startSessionWithExercises = useAppStore(s => s.startSessionWithExercises);
    const [tab, setTab] = useState<MenuTab>('group');
    const [presets, setPresets] = useState<MenuGroup[]>([]);
    const [customGroups, setCustomGroups] = useState<MenuGroup[]>([]);
    const [customExercises, setCustomExercises] = useState<CustomExercise[]>([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showCreateEx, setShowCreateEx] = useState(false);
    const [editGroup, setEditGroup] = useState<MenuGroup | null>(null);
    const [editEx, setEditEx] = useState<CustomExercise | null>(null);
    const [showCustomMenu, setShowCustomMenu] = useState(false);

    const updateUserSettings = useAppStore(s => s.updateUserSettings);

    // Advanced settings state (derived from current user or aggregated)
    const isTogetherMode = sessionUserIds.length > 1;

    const dailyTargetMinutes = currentUsers.reduce((sum, u) => sum + (u.dailyTargetMinutes ?? 10), 0);
    const excludedExercises = Array.from(new Set(currentUsers.flatMap((u) => u.excludedExercises || ['C01', 'C02'])));
    const requiredExercises = Array.from(new Set(currentUsers.flatMap((u) => u.requiredExercises || ['S01', 'S02', 'S07'])));

    const setDailyTargetMinutes = (mins: number) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { dailyTargetMinutes: mins });
        }
    };
    const setExcludedExercises = (ids: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { excludedExercises: ids });
        }
    };
    const setRequiredExercises = (ids: string[]) => {
        if (!isTogetherMode && currentUsers[0]) {
            updateUserSettings(currentUsers[0].id, { requiredExercises: ids });
        }
    };

    useEffect(() => {
        setPresets(getPresetsForClass(classLevel));
        loadCustomData();
    }, [classLevel, sessionUserIds]); // reload if context changes

    const loadCustomData = async () => {
        const currentUserId = sessionUserIds[0];

        const allGroups = await getCustomGroups();
        const allEx = await getCustomExercises();

        // Filter based on context
        setCustomGroups(allGroups.filter(g => {
            if (isTogetherMode) return true; // Show all in Together Mode
            return !g.creatorId || g.creatorId === currentUserId; // Show only shared or own
        }));

        setCustomExercises(allEx.filter(e => {
            if (isTogetherMode) return true;
            return !e.creatorId || e.creatorId === currentUserId;
        }));
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
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                onSave={handleCreatedGroup}
                onCancel={() => { setShowCreateGroup(false); setEditGroup(null); }}
            />
        );
    }

    if (showCreateEx || editEx) {
        return (
            <SingleExerciseEditor
                initial={editEx}
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                onSave={handleCreatedEx}
                onCancel={() => { setShowCreateEx(false); setEditEx(null); }}
            />
        );
    }

    const getCreatorName = (creatorId?: string) => {
        if (!creatorId) return null;
        const user = users.find(u => u.id === creatorId);
        return user ? user.name : null;
    };

    const exercises = getExercisesByClass(classLevel);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 100,
        }}>
            <PageHeader
                title="メニュー"
                rightElement={<CurrentContextBadge />}
            />

            {/* Tab toggle */}
            <div style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 12,
                padding: 3,
                margin: '0 20px 16px',
            }}>
                {[
                    { id: 'group' as MenuTab, label: 'くみあわせ' },
                    { id: 'individual' as MenuTab, label: 'ひとつ' },
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 20px' }}>
                    {/* Custom Menu Settings Card */}
                    <div>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCustomMenu(true)}
                            className="card"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '16px 20px',
                                border: 'none',
                                background: 'white',
                                cursor: 'pointer',
                                textAlign: 'left',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            }}
                        >
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(255, 228, 225, 0.5)',
                            }}>
                                <Settings2 size={24} color="#E17055" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    marginBottom: 4,
                                }}>おまかせの設定</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    lineHeight: 1.4,
                                }}>{dailyTargetMinutes}分 / ★ 必須: {requiredExercises.length}個 / 🔴 除外: {excludedExercises.length}個</div>
                            </div>
                        </motion.button>

                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            marginTop: 12,
                            textAlign: 'center',
                        }}>
                            ★ 必須にした種目は、ホーム画面のおまかせメニューに必ず入ります<br />（おまかせで約{Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60)}分）
                        </p>
                    </div>

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
                                        creatorName={sessionUserIds.length > 1 ? getCreatorName(group.creatorId) : undefined}
                                        onTap={() => handleGroupTap(group)}
                                        onEdit={() => setEditGroup(group)}
                                        onDelete={() => handleDeleteGroup(group.id)}
                                        isCustom
                                    />
                                ))}
                            </div>
                        )}
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateGroup(true)}
                            className="card"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '16px 20px',
                                border: 'none',
                                background: 'white',
                                cursor: 'pointer',
                                textAlign: 'left',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                marginTop: customGroups.length === 0 ? 0 : 4,
                            }}
                        >
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(178, 223, 219, 0.5)',
                            }}>
                                <Plus size={24} color="#00796B" strokeWidth={2.5} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    marginBottom: 4,
                                }}>新しくつくる</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    lineHeight: 1.4,
                                }}>自分だけのくみあわせを作成</div>
                            </div>
                        </motion.button>
                    </section>
                </div>
            )}

            {/* Individual tab content */}
            {tab === 'individual' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
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
                                <ExerciseIcon id={ex.id} emoji={ex.emoji} size={24} color="#2D3436" />
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
                                        {requiredExercises.includes(ex.id) && (
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
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#8395A7',
                            marginBottom: 10,
                            letterSpacing: 1,
                        }}>
                            じぶん種目
                        </h2>
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
                                <ExerciseIcon id={ex.id} emoji={ex.emoji} size={24} color="#2D3436" />
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
                                        {sessionUserIds.length > 1 && ex.creatorId && (
                                            <span style={{
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: '#2BBAA0',
                                                background: 'rgba(43, 186, 160, 0.1)',
                                                padding: '2px 6px',
                                                borderRadius: 8,
                                                marginLeft: 8,
                                                display: 'inline-block',
                                                verticalAlign: 'middle',
                                            }}>
                                                👤 {getCreatorName(ex.creatorId)}
                                            </span>
                                        )}
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
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowCreateEx(true)}
                            className="card"
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 16,
                                padding: '16px 20px',
                                border: 'none',
                                background: 'white',
                                cursor: 'pointer',
                                textAlign: 'left',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                                marginTop: 4,
                            }}
                        >
                            <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(178, 223, 219, 0.5)',
                            }}>
                                <Plus size={24} color="#00796B" strokeWidth={2.5} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    marginBottom: 4,
                                }}>新しくつくる</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    lineHeight: 1.4,
                                }}>オリジナル種目を追加</div>
                            </div>
                        </motion.button>
                    </div>
                </div>
            )}

            {/* Custom Menu Modal */}
            {showCustomMenu && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgb(248, 249, 250)',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '24px 24px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'white',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                    }}>
                        <div>
                            <h2 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#2D3436',
                                margin: 0,
                                marginBottom: 4,
                            }}>
                                おまかせの設定
                            </h2>
                            <p style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                                margin: 0,
                            }}>
                                毎日のルーティン内容を調整します
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCustomMenu(false)}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#F1F2F6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease',
                            }}
                        >
                            <X size={20} color="#2D3436" />
                        </button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', position: 'relative' }}>
                        {isTogetherMode && (
                            <div style={{
                                background: '#FFF3E0',
                                border: '1px solid #FFE0B2',
                                borderRadius: 12,
                                padding: '12px 16px',
                                marginBottom: 20,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 12
                            }}>
                                <span style={{ fontSize: 20 }}>👩‍👧‍👦</span>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    color: '#E65100',
                                    lineHeight: 1.5,
                                }}>
                                    「みんなで！」モード中は全員のおまかせ設定が合算されます。<br />
                                    <strong>個人の設定を変更するには、ホーム画面で設定したい人を選んでから開いてね。</strong>
                                </div>
                            </div>
                        )}

                        {/* Duration */}
                        <div className="card" style={{ marginBottom: 24, padding: '24px 20px', opacity: isTogetherMode ? 0.6 : 1, pointerEvents: isTogetherMode ? 'none' : 'auto' }}>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436',
                                marginBottom: 16,
                            }}>
                                1日の目標じかん
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {[5, 10, 15, 20, 30].map(mins => (
                                    <button
                                        key={mins}
                                        onClick={() => setDailyTargetMinutes(mins)}
                                        style={{
                                            flex: 1,
                                            minWidth: '28%',
                                            padding: '14px 0',
                                            borderRadius: 14,
                                            border: dailyTargetMinutes === mins ? '2px solid #2BBAA0' : '2px solid transparent',
                                            background: dailyTargetMinutes === mins ? 'rgba(43, 186, 160, 0.08)' : '#F8F9FA',
                                            color: dailyTargetMinutes === mins ? '#2BBAA0' : '#8395A7',
                                            fontFamily: "'Outfit', sans-serif",
                                            fontSize: 16,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: dailyTargetMinutes !== mins ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                                        }}
                                    >
                                        {mins}分
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercises */}
                        <div className="card" style={{ overflow: 'hidden', opacity: isTogetherMode ? 0.6 : 1, pointerEvents: isTogetherMode ? 'none' : 'auto' }}>
                            <div style={{
                                padding: '20px 20px 12px',
                                borderBottom: '1px solid rgba(0,0,0,0.06)',
                            }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    marginBottom: 4,
                                }}>
                                    種目のカスタマイズ
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                }}>
                                    ★ 必須 / ⚪ おまかせ / 🔴 除外
                                </div>
                            </div>

                            <div>
                                {[...EXERCISES, ...customExercises].map(exercise => {
                                    const isRequired = requiredExercises.includes(exercise.id);
                                    const isExcluded = excludedExercises.includes(exercise.id);

                                    // Next state cycler logic
                                    const handleCycle = () => {
                                        if (isRequired) {
                                            // Required -> Normal
                                            setRequiredExercises(requiredExercises.filter(id => id !== exercise.id));
                                        } else if (!isExcluded) {
                                            // Normal -> Excluded
                                            setExcludedExercises([...excludedExercises, exercise.id]);
                                        } else {
                                            // Excluded -> Required
                                            setExcludedExercises(excludedExercises.filter(id => id !== exercise.id));
                                            setRequiredExercises([...requiredExercises, exercise.id]);
                                        }
                                    };

                                    return (
                                        <div key={exercise.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 20px',
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color="#2D3436" />
                                                <div>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6
                                                    }}>
                                                        <div style={{
                                                            fontFamily: "'Noto Sans JP', sans-serif",
                                                            fontSize: 14,
                                                            fontWeight: 600,
                                                            color: isExcluded ? '#B2BEC3' : '#2D3436',
                                                        }}>
                                                            {exercise.name}
                                                        </div>
                                                        {'creatorId' in exercise && (
                                                            <span style={{
                                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                                fontSize: 9,
                                                                fontWeight: 700,
                                                                color: '#2BBAA0',
                                                                background: 'rgba(43, 186, 160, 0.1)',
                                                                padding: '1px 4px',
                                                                borderRadius: 6,
                                                                display: 'inline-block',
                                                                verticalAlign: 'middle',
                                                            }}>
                                                                じぶん種目
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{
                                                        fontFamily: "'Outfit', sans-serif",
                                                        fontSize: 11,
                                                        color: '#8395A7',
                                                    }}>
                                                        {exercise.sec}s • {'phase' in exercise ? exercise.phase : 'main'}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleCycle}
                                                style={{
                                                    minWidth: 70,
                                                    padding: '8px 12px',
                                                    borderRadius: 999,
                                                    border: 'none',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    background: isRequired ? '#E8F8F0' : isExcluded ? '#FFE4E1' : '#F8F9FA',
                                                    color: isRequired ? '#2BBAA0' : isExcluded ? '#E17055' : '#8395A7',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {isRequired ? '★ 必須' : isExcluded ? '🔴 除外' : '⚪ おまかせ'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// ─── Group Card ──────────────────────────────────────
const GroupCard: React.FC<{
    group: MenuGroup;
    index: number;
    creatorName?: string | null;
    onTap: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isCustom?: boolean;
}> = ({ group, index, creatorName, onTap, onEdit, onDelete, isCustom }) => {
    const [expanded, setExpanded] = useState(false);
    const totalSec = calculateTotalSeconds(group.exerciseIds);
    const minutes = Math.ceil(totalSec / 60);
    const firstEx = getExerciseById(group.exerciseIds[0]);

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
                    flexShrink: 0,
                }}>
                    <ExerciseIcon id={firstEx?.id || 'S01'} emoji={group.emoji} size={24} color="#2BBAA0" />
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
                        {creatorName && (
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 10,
                                fontWeight: 600,
                                color: '#2BBAA0',
                                background: 'rgba(43, 186, 160, 0.1)',
                                padding: '2px 6px',
                                borderRadius: 8,
                                marginLeft: 8,
                                display: 'inline-block',
                                verticalAlign: 'middle',
                            }}>
                                👤 {creatorName}
                            </span>
                        )}
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
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Edit2 size={12} />
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
    currentUserId?: string;
    onSave: () => void;
    onCancel: () => void;
}> = ({ classLevel, initial, currentUserId, onSave, onCancel }) => {
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
            creatorId: currentUserId,
        };
        await saveCustomGroup(group);
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

// --- Single Exercise Editor ---
interface SingleExerciseEditorProps {
    initial?: CustomExercise | null;
    currentUserId?: string;
    onSave: () => void;
    onCancel: () => void;
}

const SingleExerciseEditor: React.FC<SingleExerciseEditorProps> = ({ initial, currentUserId, onSave, onCancel }) => {
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
