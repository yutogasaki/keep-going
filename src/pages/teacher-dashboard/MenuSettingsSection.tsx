import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { EXERCISES, CLASS_LEVELS } from '../../data/exercises';
import { PRESET_GROUPS } from '../../data/menuGroups';
import {
    fetchAllTeacherMenuSettings,
    upsertTeacherMenuSetting,
    type MenuSettingStatus,
    type TeacherMenuSetting,
} from '../../lib/teacherMenuSettings';
import {
    fetchTeacherExercises,
    fetchTeacherMenus,
    createTeacherExercise,
    updateTeacherExercise,
    deleteTeacherExercise,
    createTeacherMenu,
    updateTeacherMenu,
    deleteTeacherMenu,
    type TeacherExercise,
    type TeacherMenu,
} from '../../lib/teacherContent';
import {
    fetchAllTeacherItemOverrides,
    upsertTeacherItemOverride,
    type TeacherItemOverride,
} from '../../lib/teacherItemOverrides';
import { MenuSettingsItemCard } from './menu-settings/MenuSettingsItemCard';
import { TeacherExerciseEditor } from './menu-settings/TeacherExerciseEditor';
import { TeacherMenuEditor } from './menu-settings/TeacherMenuEditor';

type SubTab = 'exercises' | 'groups';

interface MenuSettingsSectionProps {
    teacherEmail: string;
    loading: boolean;
}

export const MenuSettingsSection: React.FC<MenuSettingsSectionProps> = ({
    teacherEmail,
    loading: parentLoading,
}) => {
    const [subTab, setSubTab] = useState<SubTab>('exercises');
    const [settings, setSettings] = useState<TeacherMenuSetting[]>([]);
    const [overrides, setOverrides] = useState<TeacherItemOverride[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    // Form states
    const [showExerciseForm, setShowExerciseForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState<TeacherExercise | null>(null);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState<TeacherMenu | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [s, te, tm, ov] = await Promise.all([
                fetchAllTeacherMenuSettings(true),
                fetchTeacherExercises(true),
                fetchTeacherMenus(true),
                fetchAllTeacherItemOverrides(true),
            ]);
            setSettings(s);
            setTeacherExercises(te);
            setTeacherMenus(tm);
            setOverrides(ov);
            setError(null);
        } catch (err) {
            console.warn('[MenuSettings] load failed:', err);
            setError('データの読み込みに失敗しました。Supabase で deploy.sql を実行してテーブルを作成してください。');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // ─── Status helpers ───

    const getStatus = (itemId: string, itemType: string, classLevel: string): MenuSettingStatus => {
        const found = settings.find(
            s => s.itemId === itemId && s.itemType === itemType && s.classLevel === classLevel
        );
        return found?.status ?? 'optional';
    };

    const getStatusByClass = (itemId: string, itemType: string): Record<string, MenuSettingStatus> => {
        const result: Record<string, MenuSettingStatus> = {};
        for (const cl of CLASS_LEVELS) {
            result[cl.id] = getStatus(itemId, itemType, cl.id);
        }
        return result;
    };

    const getOverride = (itemId: string, itemType: string): TeacherItemOverride | undefined => {
        return overrides.find(o => o.itemId === itemId && o.itemType === itemType);
    };

    // ─── Status change (direct, not cycling) ───

    const handleStatusChange = async (
        itemId: string,
        itemType: 'exercise' | 'menu_group',
        classLevel: string,
        newStatus: MenuSettingStatus,
    ) => {
        setError(null);

        // Optimistic update
        setSettings(prev => {
            const filtered = prev.filter(
                s => !(s.itemId === itemId && s.itemType === itemType && s.classLevel === classLevel)
            );
            if (newStatus !== 'optional') {
                filtered.push({
                    id: `temp-${Date.now()}`,
                    itemId,
                    itemType,
                    classLevel,
                    status: newStatus,
                    createdBy: teacherEmail,
                });
            }
            return filtered;
        });

        try {
            await upsertTeacherMenuSetting(itemId, itemType, classLevel, newStatus, teacherEmail);
        } catch (err) {
            console.warn('[MenuSettings] status change failed:', err);
            setError('保存に失敗しました。deploy.sql を実行してテーブルを作成してください。');
            loadAll();
        }
    };

    // ─── Override save ───

    const handleSaveOverrides = async (
        itemId: string,
        itemType: 'exercise' | 'menu_group',
        nameOverride: string | null,
        descriptionOverride: string | null,
    ) => {
        setError(null);
        try {
            await upsertTeacherItemOverride(itemId, itemType, nameOverride, descriptionOverride, teacherEmail);
            // Optimistic update
            setOverrides(prev => {
                const filtered = prev.filter(o => !(o.itemId === itemId && o.itemType === itemType));
                if (nameOverride || descriptionOverride) {
                    filtered.push({
                        id: `temp-${Date.now()}`,
                        itemId,
                        itemType: itemType as 'exercise' | 'menu_group',
                        nameOverride,
                        descriptionOverride,
                        createdBy: teacherEmail,
                    });
                }
                return filtered;
            });
        } catch (err) {
            console.warn('[MenuSettings] save overrides failed:', err);
            setError('上書き設定の保存に失敗しました。');
        }
    };

    // ─── Exercise CRUD ───

    const handleSaveExercise = async (data: {
        name: string; sec: number; emoji: string; hasSplit: boolean; description: string; classLevels: string[];
    }) => {
        setSubmitting(true);
        setError(null);
        try {
            if (editingExercise) {
                await updateTeacherExercise(editingExercise.id, data);
            } else {
                await createTeacherExercise({ ...data, createdBy: teacherEmail });
            }
            setShowExerciseForm(false);
            setEditingExercise(null);
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] save exercise failed:', err);
            setError('種目の保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteExercise = async (id: string) => {
        if (!confirm('この種目を削除しますか？')) return;
        try {
            await deleteTeacherExercise(id);
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] delete exercise failed:', err);
        }
    };

    // ─── Menu CRUD ───

    const handleSaveMenu = async (data: {
        name: string; emoji: string; description: string; exerciseIds: string[]; classLevels: string[];
    }) => {
        setSubmitting(true);
        setError(null);
        try {
            if (editingMenu) {
                await updateTeacherMenu(editingMenu.id, data);
            } else {
                await createTeacherMenu({ ...data, createdBy: teacherEmail });
            }
            setShowMenuForm(false);
            setEditingMenu(null);
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] save menu failed:', err);
            setError('メニューの保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMenu = async (id: string) => {
        if (!confirm('このメニューを削除しますか？')) return;
        try {
            await deleteTeacherMenu(id);
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] delete menu failed:', err);
        }
    };

    // ─── Render ───

    if (parentLoading || loading) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 14,
                color: '#8395A7',
            }}>
                読み込み中...
            </div>
        );
    }

    return (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
                {([
                    { id: 'exercises' as SubTab, label: 'ひとつ' },
                    { id: 'groups' as SubTab, label: 'くみあわせ' },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setSubTab(tab.id); setShowExerciseForm(false); setShowMenuForm(false); setExpandedItemId(null); }}
                        style={{
                            flex: 1,
                            padding: '8px 0',
                            borderRadius: 10,
                            border: 'none',
                            background: subTab === tab.id ? '#2D3436' : '#F0F3F5',
                            color: subTab === tab.id ? '#FFF' : '#8395A7',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Error banner */}
            {error && (
                <div style={{
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(225, 112, 85, 0.1)',
                    border: '1px solid rgba(225, 112, 85, 0.3)',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#E17055',
                    lineHeight: 1.5,
                }}>
                    {error}
                </div>
            )}

            {/* Create button */}
            <button
                onClick={() => {
                    if (subTab === 'exercises') {
                        setEditingExercise(null);
                        setShowExerciseForm(true);
                    } else {
                        setEditingMenu(null);
                        setShowMenuForm(true);
                    }
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 0',
                    borderRadius: 12,
                    border: '2px dashed #2BBAA0',
                    background: 'rgba(43,186,160,0.04)',
                    color: '#2BBAA0',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                }}
            >
                <Plus size={16} />
                {subTab === 'exercises' ? '新しい種目をつくる' : '新しいメニューをつくる'}
            </button>

            {/* Exercise editor (full-screen portal) */}
            {showExerciseForm && subTab === 'exercises' && (
                <TeacherExerciseEditor
                    initial={editingExercise}
                    onSave={handleSaveExercise}
                    onCancel={() => { setShowExerciseForm(false); setEditingExercise(null); }}
                    submitting={submitting}
                />
            )}

            {/* Menu editor (full-screen portal) */}
            {showMenuForm && subTab === 'groups' && (
                <TeacherMenuEditor
                    initial={editingMenu}
                    teacherExercises={teacherExercises}
                    onSave={handleSaveMenu}
                    onCancel={() => { setShowMenuForm(false); setEditingMenu(null); }}
                    submitting={submitting}
                />
            )}

            {/* Legend */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: '#8395A7',
                padding: '4px 0',
            }}>
                {subTab === 'exercises' ? (
                    <>
                        <span style={{ color: '#2BBAA0' }}>★ 必須</span>
                        <span>⚪ おまかせ</span>
                        <span style={{ color: '#E17055' }}>✕ 除外</span>
                        <span style={{ color: '#8B5CF6' }}>👁 非表示</span>
                    </>
                ) : (
                    <>
                        <span>⚪ 表示</span>
                        <span style={{ color: '#8B5CF6' }}>👁 非表示</span>
                    </>
                )}
            </div>

            {/* ─── Exercise cards ─── */}
            {subTab === 'exercises' && (
                <>
                    {teacherExercises.length > 0 && (
                        <>
                            <SectionLabel text="先生がつくった種目" color="#0984E3" />
                            {teacherExercises.map(ex => (
                                <MenuSettingsItemCard
                                    key={ex.id}
                                    emoji={ex.emoji}
                                    name={ex.name}
                                    description={ex.description}
                                    statusByClass={getStatusByClass(ex.id, 'exercise')}
                                    nameOverride={null}
                                    descriptionOverride={null}
                                    expanded={expandedItemId === ex.id}
                                    onToggleExpand={() => setExpandedItemId(prev => prev === ex.id ? null : ex.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                    onSaveOverrides={() => {}}
                                    onEdit={() => { setEditingExercise(ex); setShowExerciseForm(true); }}
                                    onDelete={() => handleDeleteExercise(ex.id)}
                                    isBuiltIn={false}
                                />
                            ))}
                        </>
                    )}

                    <SectionLabel text="ビルトイン種目" color="#8395A7" />
                    {EXERCISES.map(ex => {
                        const ov = getOverride(ex.id, 'exercise');
                        return (
                            <MenuSettingsItemCard
                                key={ex.id}
                                emoji={ex.emoji}
                                name={ex.name}
                                description={ex.description ?? ''}
                                statusByClass={getStatusByClass(ex.id, 'exercise')}
                                nameOverride={ov?.nameOverride ?? null}
                                descriptionOverride={ov?.descriptionOverride ?? null}
                                expanded={expandedItemId === ex.id}
                                onToggleExpand={() => setExpandedItemId(prev => prev === ex.id ? null : ex.id)}
                                onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                onSaveOverrides={(n, d) => handleSaveOverrides(ex.id, 'exercise', n, d)}
                                isBuiltIn={true}
                            />
                        );
                    })}
                </>
            )}

            {/* ─── Group cards ─── */}
            {subTab === 'groups' && (
                <>
                    {teacherMenus.length > 0 && (
                        <>
                            <SectionLabel text="先生がつくったメニュー" color="#0984E3" />
                            {teacherMenus.map(menu => (
                                <MenuSettingsItemCard
                                    key={menu.id}
                                    emoji={menu.emoji}
                                    name={menu.name}
                                    description={menu.description}
                                    statusByClass={getStatusByClass(menu.id, 'menu_group')}
                                    nameOverride={null}
                                    descriptionOverride={null}
                                    expanded={expandedItemId === menu.id}
                                    onToggleExpand={() => setExpandedItemId(prev => prev === menu.id ? null : menu.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(menu.id, 'menu_group', cl, status)}
                                    onSaveOverrides={() => {}}
                                    onEdit={() => { setEditingMenu(menu); setShowMenuForm(true); }}
                                    onDelete={() => handleDeleteMenu(menu.id)}
                                    isBuiltIn={false}
                                    itemType="menu_group"
                                />
                            ))}
                        </>
                    )}

                    <SectionLabel text="プリセットメニュー" color="#8395A7" />
                    {PRESET_GROUPS.map(group => {
                        const ov = getOverride(group.id, 'menu_group');
                        return (
                            <MenuSettingsItemCard
                                key={group.id}
                                emoji={group.emoji}
                                name={group.name}
                                description={group.description ?? ''}
                                statusByClass={getStatusByClass(group.id, 'menu_group')}
                                nameOverride={ov?.nameOverride ?? null}
                                descriptionOverride={ov?.descriptionOverride ?? null}
                                expanded={expandedItemId === group.id}
                                onToggleExpand={() => setExpandedItemId(prev => prev === group.id ? null : group.id)}
                                onStatusChange={(cl, status) => handleStatusChange(group.id, 'menu_group', cl, status)}
                                onSaveOverrides={(n, d) => handleSaveOverrides(group.id, 'menu_group', n, d)}
                                isBuiltIn={true}
                                itemType="menu_group"
                            />
                        );
                    })}
                </>
            )}
        </div>
    );
};

const SectionLabel: React.FC<{ text: string; color: string }> = ({ text, color }) => (
    <div style={{
        fontFamily: "'Noto Sans JP', sans-serif",
        fontSize: 12,
        fontWeight: 700,
        color,
        padding: '4px 0 0',
    }}>
        {text}
    </div>
);
