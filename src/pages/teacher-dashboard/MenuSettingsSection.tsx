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
import { MenuSettingsItemRow } from './menu-settings/MenuSettingsItemRow';
import { TeacherExerciseForm } from './menu-settings/TeacherExerciseForm';
import { TeacherMenuForm } from './menu-settings/TeacherMenuForm';

type SubTab = 'exercises' | 'groups';

interface MenuSettingsSectionProps {
    teacherEmail: string;
    loading: boolean;
}

const NEXT_STATUS: Record<MenuSettingStatus, MenuSettingStatus> = {
    optional: 'required',
    required: 'excluded',
    excluded: 'optional',
};

export const MenuSettingsSection: React.FC<MenuSettingsSectionProps> = ({
    teacherEmail,
    loading: parentLoading,
}) => {
    const [subTab, setSubTab] = useState<SubTab>('exercises');
    const [settings, setSettings] = useState<TeacherMenuSetting[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [showExerciseForm, setShowExerciseForm] = useState(false);
    const [editingExercise, setEditingExercise] = useState<TeacherExercise | null>(null);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState<TeacherMenu | null>(null);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [s, te, tm] = await Promise.all([
                fetchAllTeacherMenuSettings(true),
                fetchTeacherExercises(true),
                fetchTeacherMenus(true),
            ]);
            setSettings(s);
            setTeacherExercises(te);
            setTeacherMenus(tm);
        } catch (err) {
            console.warn('[MenuSettings] load failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    // Build lookup: itemId+itemType -> classLevel -> status
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

    const handleCycle = async (itemId: string, itemType: 'exercise' | 'menu_group', classLevel: string) => {
        const current = getStatus(itemId, itemType, classLevel);
        const next = NEXT_STATUS[current];

        // Optimistic update
        setSettings(prev => {
            const filtered = prev.filter(
                s => !(s.itemId === itemId && s.itemType === itemType && s.classLevel === classLevel)
            );
            if (next !== 'optional') {
                filtered.push({
                    id: `temp-${Date.now()}`,
                    itemId,
                    itemType,
                    classLevel,
                    status: next,
                    createdBy: teacherEmail,
                });
            }
            return filtered;
        });

        try {
            await upsertTeacherMenuSetting(itemId, itemType, classLevel, next, teacherEmail);
        } catch (err) {
            console.warn('[MenuSettings] cycle failed:', err);
            loadAll();
        }
    };

    // ─── Exercise CRUD ───
    const handleSaveExercise = async (data: {
        name: string; sec: number; emoji: string; hasSplit: boolean; description: string; classLevels: string[];
    }) => {
        setSubmitting(true);
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
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
                {([
                    { id: 'exercises' as SubTab, label: 'ひとつ' },
                    { id: 'groups' as SubTab, label: 'くみあわせ' },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setSubTab(tab.id); setShowExerciseForm(false); setShowMenuForm(false); }}
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

            {/* Exercise form */}
            {showExerciseForm && subTab === 'exercises' && (
                <TeacherExerciseForm
                    initial={editingExercise}
                    onSave={handleSaveExercise}
                    onCancel={() => { setShowExerciseForm(false); setEditingExercise(null); }}
                    submitting={submitting}
                />
            )}

            {/* Menu form */}
            {showMenuForm && subTab === 'groups' && (
                <TeacherMenuForm
                    initial={editingMenu}
                    teacherExercises={teacherExercises}
                    onSave={handleSaveMenu}
                    onCancel={() => { setShowMenuForm(false); setEditingMenu(null); }}
                    submitting={submitting}
                />
            )}

            {/* Legend + class headers */}
            <div className="card" style={{ padding: '12px 16px', overflow: 'hidden' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    color: '#8395A7',
                }}>
                    <span>★ 必須</span>
                    <span>⚪ おまかせ</span>
                    <span>✕ 除外</span>
                </div>

                {/* Class headers */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: '2px solid rgba(0,0,0,0.08)',
                }}>
                    <div style={{ width: 120, flexShrink: 0 }} />
                    <div style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
                        {CLASS_LEVELS.map(cl => (
                            <div
                                key={cl.id}
                                style={{
                                    width: 32,
                                    textAlign: 'center',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: '#8395A7',
                                }}
                            >
                                {cl.emoji}
                            </div>
                        ))}
                    </div>
                    <div style={{ width: 28, flexShrink: 0 }} />
                </div>

                {/* Items */}
                {subTab === 'exercises' && (
                    <>
                        {/* Teacher-created exercises first */}
                        {teacherExercises.length > 0 && (
                            <>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#0984E3',
                                    padding: '8px 0 4px',
                                }}>
                                    先生がつくった種目
                                </div>
                                {teacherExercises.map(ex => (
                                    <MenuSettingsItemRow
                                        key={ex.id}
                                        emoji={ex.emoji}
                                        name={ex.name}
                                        statusByClass={getStatusByClass(ex.id, 'exercise')}
                                        onCycle={(cl) => handleCycle(ex.id, 'exercise', cl)}
                                        onEdit={() => { setEditingExercise(ex); setShowExerciseForm(true); }}
                                        onDelete={() => handleDeleteExercise(ex.id)}
                                    />
                                ))}
                            </>
                        )}

                        {/* Built-in exercises */}
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#8395A7',
                            padding: '8px 0 4px',
                        }}>
                            ビルトイン種目
                        </div>
                        {EXERCISES.map(ex => (
                            <MenuSettingsItemRow
                                key={ex.id}
                                emoji={ex.emoji}
                                name={ex.name}
                                statusByClass={getStatusByClass(ex.id, 'exercise')}
                                onCycle={(cl) => handleCycle(ex.id, 'exercise', cl)}
                            />
                        ))}
                    </>
                )}

                {subTab === 'groups' && (
                    <>
                        {/* Teacher-created menus first */}
                        {teacherMenus.length > 0 && (
                            <>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#0984E3',
                                    padding: '8px 0 4px',
                                }}>
                                    先生がつくったメニュー
                                </div>
                                {teacherMenus.map(menu => (
                                    <MenuSettingsItemRow
                                        key={menu.id}
                                        emoji={menu.emoji}
                                        name={menu.name}
                                        statusByClass={getStatusByClass(menu.id, 'menu_group')}
                                        onCycle={(cl) => handleCycle(menu.id, 'menu_group', cl)}
                                        onEdit={() => { setEditingMenu(menu); setShowMenuForm(true); }}
                                        onDelete={() => handleDeleteMenu(menu.id)}
                                    />
                                ))}
                            </>
                        )}

                        {/* Preset menus */}
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#8395A7',
                            padding: '8px 0 4px',
                        }}>
                            プリセットメニュー
                        </div>
                        {PRESET_GROUPS.map(group => (
                            <MenuSettingsItemRow
                                key={group.id}
                                emoji={group.emoji}
                                name={group.name}
                                statusByClass={getStatusByClass(group.id, 'menu_group')}
                                onCycle={(cl) => handleCycle(group.id, 'menu_group', cl)}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};
