import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Clock, Trash2, Star, Edit2, Settings2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ExerciseIcon } from '../components/ExerciseIcon';
import { getExercisesByClass, DEFAULT_SESSION_TARGET_SECONDS } from '../data/exercises';
import { getPresetsForClass, getCustomGroups, deleteCustomGroup, type MenuGroup } from '../data/menuGroups';
import { getCustomExercises, deleteCustomExercise, type CustomExercise } from '../lib/db';
import { publishMenu, unpublishMenu, fetchMyPublishedMenus, type PublicMenu } from '../lib/publicMenus';
import { getAccountId } from '../lib/sync';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { audio } from '../lib/audio';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { GroupCard } from './menu/GroupCard';
import { CustomMenuModal } from './menu/CustomMenuModal';
import { CreateGroupView } from './menu/CreateGroupView';
import { SingleExerciseEditor } from './menu/SingleExerciseEditor';

type MenuTab = 'group' | 'individual';

export const MenuPage: React.FC = () => {
    const users = useAppStore(s => s.users);
    const sessionUserIds = useAppStore(s => s.sessionUserIds);
    // Use sessionUserIds instead of activeUserIds so the menu matches the home screen swipe state
    const currentUsers = users.filter(u => sessionUserIds.includes(u.id));
    const classLevel = currentUsers.length > 0
        ? currentUsers.reduce((min, u) => {
            const weights: Record<string, number> = { 'プレ': 0, '初級': 1, '中級': 2, '上級': 3, 'その他': 1 };
            return (weights[u.classLevel] ?? 1) < (weights[min] ?? 1) ? u.classLevel : min;
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
    const [showPublicBrowser, setShowPublicBrowser] = useState(false);
    const [myPublishedMenus, setMyPublishedMenus] = useState<PublicMenu[]>([]);

    const updateUserSettings = useAppStore(s => s.updateUserSettings);

    // Advanced settings state (derived from current user or aggregated)
    const isTogetherMode = sessionUserIds.length > 1;

    const dailyTargetMinutes = isTogetherMode
        ? Math.max(...currentUsers.map(u => u.dailyTargetMinutes ?? 10))
        : (currentUsers[0]?.dailyTargetMinutes ?? 10);
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

        // Load published menus for download count display
        if (getAccountId()) {
            fetchMyPublishedMenus().then(setMyPublishedMenus).catch(console.warn);
        }
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

    const handlePublishGroup = async (group: MenuGroup) => {
        if (!getAccountId()) return;
        const authorName = currentUsers[0]?.name ?? 'ゲスト';
        try {
            await publishMenu(group, authorName);
            alert('メニューを公開しました！');
            loadCustomData();
        } catch (err) {
            console.warn('[menu] publish failed:', err);
            alert('公開に失敗しました');
        }
    };

    const handleUnpublishGroup = async (group: MenuGroup) => {
        // Find the published version matching this local menu
        const published = findPublishedMenu(group);
        if (!published) return;
        try {
            await unpublishMenu(published.id);
            alert('メニューを非公開にしました');
            loadCustomData();
        } catch (err) {
            console.warn('[menu] unpublish failed:', err);
            alert('非公開に失敗しました');
        }
    };

    const findPublishedMenu = (group: MenuGroup): PublicMenu | undefined => {
        return myPublishedMenus.find(pm =>
            pm.name === group.name && pm.exerciseIds.join(',') === group.exerciseIds.join(',')
        );
    };

    if (showCreateGroup || editGroup) {
        const publishedId = editGroup ? findPublishedMenu(editGroup)?.id : undefined;
        return (
            <CreateGroupView
                classLevel={classLevel}
                initial={editGroup}
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                authorName={currentUsers[0]?.name ?? 'ゲスト'}
                publishedMenuId={publishedId}
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
                            {isTogetherMode
                                ? '個人モードに切りかえると設定を変更できます'
                                : <>★ 必須にした種目は、ホーム画面のおまかせメニューに必ず入ります<br />（おまかせで約{Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60)}分）</>
                            }
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
                                {customGroups.map((group, i) => {
                                    const published = findPublishedMenu(group);
                                    return (
                                        <GroupCard
                                            key={group.id}
                                            group={group}
                                            index={i}
                                            creatorName={sessionUserIds.length > 1 ? getCreatorName(group.creatorId) : undefined}
                                            onTap={() => handleGroupTap(group)}
                                            onEdit={() => setEditGroup(group)}
                                            onDelete={() => handleDeleteGroup(group.id)}
                                            onPublish={getAccountId() ? () => handlePublishGroup(group) : undefined}
                                            onUnpublish={() => handleUnpublishGroup(group)}
                                            isCustom
                                            isPublished={!!published}
                                            downloadCount={published?.downloadCount}
                                        />
                                    );
                                })}
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

                    {/* みんなのメニュー section */}
                    <section>
                        <h2 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#8395A7',
                            marginBottom: 10,
                            letterSpacing: 1,
                        }}>
                            みんなのメニュー
                        </h2>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowPublicBrowser(true)}
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
                                background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 8px rgba(190, 227, 248, 0.5)',
                            }}>
                                <span style={{ fontSize: 22 }}>🌍</span>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    marginBottom: 4,
                                }}>みんなのメニューを見る</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    lineHeight: 1.4,
                                }}>他の人が作ったメニューをもらおう</div>
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

            <CustomMenuModal
                show={showCustomMenu}
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredExercises={requiredExercises}
                excludedExercises={excludedExercises}
                customExercises={customExercises}
                onClose={() => setShowCustomMenu(false)}
                onSetDailyTargetMinutes={setDailyTargetMinutes}
                onSetExcludedExercises={setExcludedExercises}
                onSetRequiredExercises={setRequiredExercises}
            />

            <PublicMenuBrowser
                open={showPublicBrowser}
                onClose={() => setShowPublicBrowser(false)}
                onImported={loadCustomData}
            />
        </div>
    );
};
