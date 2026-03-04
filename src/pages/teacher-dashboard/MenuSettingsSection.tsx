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
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { useAppStore } from '../../store/useAppStore';
import { audio } from '../../lib/audio';

type SubTab = 'exercises' | 'groups';

interface MenuSettingsSectionProps {
    teacherEmail: string;
    loading: boolean;
}

export const MenuSettingsSection: React.FC<MenuSettingsSectionProps> = ({
    teacherEmail,
    loading: parentLoading,
}) => {
    const startTeacherPreviewSession = useAppStore((state) => state.startTeacherPreviewSession);
    const [subTab, setSubTab] = useState<SubTab>('groups');
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
    const [editingBuiltInExerciseId, setEditingBuiltInExerciseId] = useState<string | null>(null);
    const [showMenuForm, setShowMenuForm] = useState(false);
    const [editingMenu, setEditingMenu] = useState<TeacherMenu | null>(null);
    const [editingBuiltInMenuId, setEditingBuiltInMenuId] = useState<string | null>(null);

    // Delete confirmation modal
    const [deleteTarget, setDeleteTarget] = useState<{
        id: string;
        type: 'exercise' | 'menu';
        name: string;
    } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    // ─── Exercise CRUD ───

    const handleSaveExercise = async (data: {
        name: string; sec: number; emoji: string; hasSplit: boolean; description: string; classLevels: string[];
        statusByClass?: Record<string, MenuSettingStatus>;
    }) => {
        setSubmitting(true);
        setError(null);
        try {
            if (editingBuiltInExerciseId) {
                // Built-in exercise: save as overrides
                const builtIn = EXERCISES.find(e => e.id === editingBuiltInExerciseId);
                if (builtIn) {
                    await upsertTeacherItemOverride(
                        editingBuiltInExerciseId,
                        'exercise',
                        {
                            nameOverride: data.name !== builtIn.name ? data.name : null,
                            descriptionOverride: data.description !== (builtIn.description ?? '') ? data.description : null,
                            emojiOverride: data.emoji !== builtIn.emoji ? data.emoji : null,
                            secOverride: data.sec !== builtIn.sec ? data.sec : null,
                            hasSplitOverride: data.hasSplit !== (builtIn.hasSplit ?? false) ? data.hasSplit : null,
                        },
                        teacherEmail,
                    );
                }
                // Save per-class statuses
                if (data.statusByClass) {
                    for (const [cl, status] of Object.entries(data.statusByClass)) {
                        await upsertTeacherMenuSetting(editingBuiltInExerciseId, 'exercise', cl, status, teacherEmail);
                    }
                }
            } else {
                // Teacher-created exercise
                let itemId: string;
                if (editingExercise) {
                    await updateTeacherExercise(editingExercise.id, data);
                    itemId = editingExercise.id;
                } else {
                    const newId = await createTeacherExercise({ ...data, createdBy: teacherEmail });
                    itemId = newId ?? '';
                }
                if (data.statusByClass && itemId) {
                    for (const [cl, status] of Object.entries(data.statusByClass)) {
                        await upsertTeacherMenuSetting(itemId, 'exercise', cl, status, teacherEmail);
                    }
                }
            }
            closeExerciseForm();
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] save exercise failed:', err);
            setError('種目の保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Menu CRUD ───

    const handleSaveMenu = async (data: {
        name: string; emoji: string; description: string; exerciseIds: string[]; classLevels: string[];
        statusByClass?: Record<string, MenuSettingStatus>;
    }) => {
        setSubmitting(true);
        setError(null);
        try {
            if (editingBuiltInMenuId) {
                // Built-in menu: save as overrides
                const builtIn = PRESET_GROUPS.find(g => g.id === editingBuiltInMenuId);
                if (builtIn) {
                    await upsertTeacherItemOverride(
                        editingBuiltInMenuId,
                        'menu_group',
                        {
                            nameOverride: data.name !== builtIn.name ? data.name : null,
                            descriptionOverride: data.description !== (builtIn.description ?? '') ? data.description : null,
                            emojiOverride: data.emoji !== builtIn.emoji ? data.emoji : null,
                            exerciseIdsOverride:
                                JSON.stringify(data.exerciseIds) !== JSON.stringify(builtIn.exerciseIds)
                                    ? data.exerciseIds
                                    : null,
                        },
                        teacherEmail,
                    );
                }
                if (data.statusByClass) {
                    for (const [cl, status] of Object.entries(data.statusByClass)) {
                        await upsertTeacherMenuSetting(editingBuiltInMenuId, 'menu_group', cl, status, teacherEmail);
                    }
                }
            } else {
                // Teacher-created menu
                let itemId: string;
                if (editingMenu) {
                    await updateTeacherMenu(editingMenu.id, data);
                    itemId = editingMenu.id;
                } else {
                    const newId = await createTeacherMenu({ ...data, createdBy: teacherEmail });
                    itemId = newId ?? '';
                }
                if (data.statusByClass && itemId) {
                    for (const [cl, status] of Object.entries(data.statusByClass)) {
                        await upsertTeacherMenuSetting(itemId, 'menu_group', cl, status, teacherEmail);
                    }
                }
            }
            closeMenuForm();
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] save menu failed:', err);
            setError('メニューの保存に失敗しました。');
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Delete (with modal confirmation) ───

    const handleDeleteExerciseFromEditor = () => {
        if (!editingExercise) return;
        setDeleteTarget({ id: editingExercise.id, type: 'exercise', name: editingExercise.name });
    };

    const handleDeleteMenuFromEditor = () => {
        if (!editingMenu) return;
        setDeleteTarget({ id: editingMenu.id, type: 'menu', name: editingMenu.name });
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            if (deleteTarget.type === 'exercise') {
                await deleteTeacherExercise(deleteTarget.id);
                if (editingExercise?.id === deleteTarget.id) closeExerciseForm();
            } else {
                await deleteTeacherMenu(deleteTarget.id);
                if (editingMenu?.id === deleteTarget.id) closeMenuForm();
            }
            await loadAll();
        } catch (err) {
            console.warn('[MenuSettings] delete failed:', err);
        } finally {
            setDeleteLoading(false);
            setDeleteTarget(null);
        }
    };

    // ─── Helper: Build initial data for built-in item editing ───

    const buildBuiltInExerciseInitial = (exerciseId: string): TeacherExercise | null => {
        const ex = EXERCISES.find(e => e.id === exerciseId);
        if (!ex) return null;
        const ov = getOverride(exerciseId, 'exercise');
        return {
            id: ex.id,
            name: ov?.nameOverride ?? ex.name,
            sec: ov?.secOverride ?? ex.sec,
            emoji: ov?.emojiOverride ?? ex.emoji,
            hasSplit: ov?.hasSplitOverride ?? (ex.hasSplit ?? false),
            description: ov?.descriptionOverride ?? (ex.description ?? ''),
            classLevels: ex.classes as string[],
            createdBy: '',
            createdAt: '',
        };
    };

    const buildBuiltInMenuInitial = (menuId: string): TeacherMenu | null => {
        const group = PRESET_GROUPS.find(g => g.id === menuId);
        if (!group) return null;
        const ov = getOverride(menuId, 'menu_group');
        return {
            id: group.id,
            name: ov?.nameOverride ?? group.name,
            emoji: ov?.emojiOverride ?? group.emoji,
            description: ov?.descriptionOverride ?? (group.description ?? ''),
            exerciseIds: ov?.exerciseIdsOverride ?? group.exerciseIds,
            classLevels: [],
            createdBy: '',
            createdAt: '',
        };
    };

    // ─── Form open/close helpers ───

    const closeExerciseForm = () => {
        setShowExerciseForm(false);
        setEditingExercise(null);
        setEditingBuiltInExerciseId(null);
    };

    const closeMenuForm = () => {
        setShowMenuForm(false);
        setEditingMenu(null);
        setEditingBuiltInMenuId(null);
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

    // Determine what initial data to pass to editors
    const exerciseEditorInitial = editingExercise
        ?? (editingBuiltInExerciseId ? buildBuiltInExerciseInitial(editingBuiltInExerciseId) : null);
    const exerciseEditorStatuses = editingExercise
        ? getStatusByClass(editingExercise.id, 'exercise')
        : editingBuiltInExerciseId
            ? getStatusByClass(editingBuiltInExerciseId, 'exercise')
            : undefined;
    const exerciseEditorItemId = editingExercise?.id ?? editingBuiltInExerciseId;

    const menuEditorInitial = editingMenu
        ?? (editingBuiltInMenuId ? buildBuiltInMenuInitial(editingBuiltInMenuId) : null);
    const menuEditorStatuses = editingMenu
        ? getStatusByClass(editingMenu.id, 'menu_group')
        : editingBuiltInMenuId
            ? getStatusByClass(editingBuiltInMenuId, 'menu_group')
            : undefined;
    const menuEditorItemId = editingMenu?.id ?? editingBuiltInMenuId;

    return (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
                {([
                    { id: 'groups' as SubTab, label: '組み合わせ' },
                    { id: 'exercises' as SubTab, label: '種目' },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setSubTab(tab.id); closeExerciseForm(); closeMenuForm(); setExpandedItemId(null); }}
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
                        setEditingBuiltInExerciseId(null);
                        setShowExerciseForm(true);
                    } else {
                        setEditingMenu(null);
                        setEditingBuiltInMenuId(null);
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
                {subTab === 'exercises' ? '新しい種目を作成' : '新しいメニューを作成'}
            </button>

            {/* Exercise editor (full-screen portal) */}
            {showExerciseForm && subTab === 'exercises' && (
                <TeacherExerciseEditor
                    key={exerciseEditorItemId ?? 'new'}
                    initial={exerciseEditorInitial}
                    initialStatuses={exerciseEditorStatuses}
                    onSave={handleSaveExercise}
                    onCancel={closeExerciseForm}
                    onPlay={exerciseEditorItemId ? () => { audio.initTTS(); startTeacherPreviewSession([exerciseEditorItemId]); } : undefined}
                    onDelete={editingExercise ? handleDeleteExerciseFromEditor : undefined}
                    submitting={submitting}
                />
            )}

            {/* Menu editor (full-screen portal) */}
            {showMenuForm && subTab === 'groups' && (
                <TeacherMenuEditor
                    key={menuEditorItemId ?? 'new'}
                    initial={menuEditorInitial}
                    initialStatuses={menuEditorStatuses}
                    teacherExercises={teacherExercises}
                    onSave={handleSaveMenu}
                    onCancel={closeMenuForm}
                    onPlay={menuEditorItemId ? () => { audio.initTTS(); startTeacherPreviewSession(menuEditorInitial?.exerciseIds ?? []); } : undefined}
                    onDelete={editingMenu ? handleDeleteMenuFromEditor : undefined}
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
                                    statusByClass={getStatusByClass(ex.id, 'exercise')}
                                    expanded={expandedItemId === ex.id}
                                    onToggleExpand={() => setExpandedItemId(prev => prev === ex.id ? null : ex.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                    onEdit={() => { setEditingExercise(ex); setEditingBuiltInExerciseId(null); setShowExerciseForm(true); }}
                                    onDelete={() => setDeleteTarget({ id: ex.id, type: 'exercise', name: ex.name })}
                                    onPlay={() => { audio.initTTS(); startTeacherPreviewSession([ex.id]); }}
                                />
                            ))}
                        </>
                    )}

                    <SectionLabel text="ビルトイン種目" color="#8395A7" />
                    {EXERCISES.map(ex => {
                        const ov = getOverride(ex.id, 'exercise');
                        const displayName = ov?.nameOverride ?? ex.name;
                        const displayEmoji = ov?.emojiOverride ?? ex.emoji;
                        return (
                            <MenuSettingsItemCard
                                key={ex.id}
                                emoji={displayEmoji}
                                name={displayName}
                                statusByClass={getStatusByClass(ex.id, 'exercise')}
                                expanded={expandedItemId === ex.id}
                                onToggleExpand={() => setExpandedItemId(prev => prev === ex.id ? null : ex.id)}
                                onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                onEdit={() => { setEditingBuiltInExerciseId(ex.id); setEditingExercise(null); setShowExerciseForm(true); }}
                                onPlay={() => { audio.initTTS(); startTeacherPreviewSession([ex.id]); }}
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
                                    statusByClass={getStatusByClass(menu.id, 'menu_group')}
                                    expanded={expandedItemId === menu.id}
                                    onToggleExpand={() => setExpandedItemId(prev => prev === menu.id ? null : menu.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(menu.id, 'menu_group', cl, status)}
                                    onEdit={() => { setEditingMenu(menu); setEditingBuiltInMenuId(null); setShowMenuForm(true); }}
                                    onDelete={() => setDeleteTarget({ id: menu.id, type: 'menu', name: menu.name })}
                                    onPlay={() => { audio.initTTS(); startTeacherPreviewSession(menu.exerciseIds); }}
                                    itemType="menu_group"
                                />
                            ))}
                        </>
                    )}

                    <SectionLabel text="プリセットメニュー" color="#8395A7" />
                    {PRESET_GROUPS.map(group => {
                        const ov = getOverride(group.id, 'menu_group');
                        const displayName = ov?.nameOverride ?? group.name;
                        const displayEmoji = ov?.emojiOverride ?? group.emoji;
                        return (
                            <MenuSettingsItemCard
                                key={group.id}
                                emoji={displayEmoji}
                                name={displayName}
                                statusByClass={getStatusByClass(group.id, 'menu_group')}
                                expanded={expandedItemId === group.id}
                                onToggleExpand={() => setExpandedItemId(prev => prev === group.id ? null : group.id)}
                                onStatusChange={(cl, status) => handleStatusChange(group.id, 'menu_group', cl, status)}
                                onEdit={() => { setEditingBuiltInMenuId(group.id); setEditingMenu(null); setShowMenuForm(true); }}
                                onPlay={() => { audio.initTTS(); startTeacherPreviewSession(group.exerciseIds); }}
                                itemType="menu_group"
                            />
                        );
                    })}
                </>
            )}

            {/* Delete confirmation modal */}
            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={deleteTarget?.type === 'exercise' ? 'この種目を削除しますか？' : 'このメニューを削除しますか？'}
                message={`「${deleteTarget?.name ?? ''}」を削除すると元に戻せません。`}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
            />
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
