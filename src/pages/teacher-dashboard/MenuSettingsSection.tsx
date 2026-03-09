import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { EXERCISES } from '../../data/exercises';
import { getExercisePlacementLabel } from '../../data/exercisePlacement';
import { PRESET_GROUPS } from '../../data/menuGroups';
import { MenuSettingsItemCard } from './menu-settings/MenuSettingsItemCard';
import { TeacherExerciseEditor } from './menu-settings/TeacherExerciseEditor';
import { TeacherMenuEditor } from './menu-settings/TeacherMenuEditor';
import { useMenuSettingsController } from './menu-settings/useMenuSettingsController';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { useAppStore } from '../../store/useAppStore';
import { audio } from '../../lib/audio';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import { sortTeacherContentByRecommendation } from '../../lib/teacherExerciseMetadata';

function sortTeacherExercises(exercises: TeacherExercise[]): TeacherExercise[] {
    return sortTeacherContentByRecommendation(exercises);
}

function sortTeacherMenus(menus: TeacherMenu[]): TeacherMenu[] {
    return sortTeacherContentByRecommendation(menus);
}

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
    const {
        canDeleteExercise,
        canDeleteMenu,
        clearDeleteTarget,
        closeExerciseForm,
        closeMenuForm,
        deleteLoading,
        deleteTarget,
        error,
        expandedItemId,
        exerciseEditorInitial,
        exerciseEditorItemId,
        exerciseEditorStatuses,
        getOverride,
        getStatusByClass,
        handleConfirmDelete,
        handleDeleteExerciseFromEditor,
        handleDeleteMenuFromEditor,
        handleSaveExercise,
        handleSaveMenu,
        handleStatusChange,
        isBuiltInExerciseEditor,
        loading,
        menuEditorInitial,
        menuEditorItemId,
        menuEditorStatuses,
        openBuiltInExerciseEditor,
        openBuiltInMenuEditor,
        openNewExerciseForm,
        openNewMenuForm,
        openTeacherExerciseEditor,
        openTeacherMenuEditor,
        promptDeleteExercise,
        promptDeleteMenu,
        resetTransientUi,
        showExerciseForm,
        showMenuForm,
        submitting,
        teacherExercises,
        teacherMenus,
        toggleExpandedItem,
    } = useMenuSettingsController({ teacherEmail });

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
                    { id: 'groups' as SubTab, label: '組み合わせ' },
                    { id: 'exercises' as SubTab, label: '種目' },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setSubTab(tab.id);
                            resetTransientUi();
                        }}
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
                        openNewExerciseForm();
                    } else {
                        openNewMenuForm();
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
                    error={error}
                    onSave={handleSaveExercise}
                    onCancel={closeExerciseForm}
                    onPlay={exerciseEditorItemId ? () => { audio.initTTS(); startTeacherPreviewSession([exerciseEditorItemId]); } : undefined}
                    onDelete={canDeleteExercise ? handleDeleteExerciseFromEditor : undefined}
                    placementLocked={isBuiltInExerciseEditor}
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
                    error={error}
                    onSave={handleSaveMenu}
                    onCancel={closeMenuForm}
                    onPlay={menuEditorItemId ? () => { audio.initTTS(); startTeacherPreviewSession(menuEditorInitial?.exerciseIds ?? []); } : undefined}
                    onDelete={canDeleteMenu ? handleDeleteMenuFromEditor : undefined}
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
                            {sortTeacherExercises(teacherExercises).map(ex => (
                                <MenuSettingsItemCard
                                    key={ex.id}
                                    emoji={ex.emoji}
                                    name={ex.name}
                                    categoryLabel={getExercisePlacementLabel(ex.placement)}
                                    metadataChips={ex.focusTags}
                                    recommended={ex.recommended}
                                    recommendedOrder={ex.recommendedOrder}
                                    visibility={ex.visibility}
                                    statusByClass={getStatusByClass(ex.id, 'exercise')}
                                    expanded={expandedItemId === ex.id}
                                    onToggleExpand={() => toggleExpandedItem(ex.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                    onEdit={() => openTeacherExerciseEditor(ex)}
                                    onDelete={() => promptDeleteExercise(ex)}
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
                                categoryLabel={getExercisePlacementLabel(ex.placement)}
                                statusByClass={getStatusByClass(ex.id, 'exercise')}
                                expanded={expandedItemId === ex.id}
                                onToggleExpand={() => toggleExpandedItem(ex.id)}
                                onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                onEdit={() => openBuiltInExerciseEditor(ex.id)}
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
                            {sortTeacherMenus(teacherMenus).map(menu => (
                                <MenuSettingsItemCard
                                    key={menu.id}
                                    emoji={menu.emoji}
                                    name={menu.name}
                                    metadataChips={menu.focusTags}
                                    recommended={menu.recommended}
                                    recommendedOrder={menu.recommendedOrder}
                                    visibility={menu.visibility}
                                    statusByClass={getStatusByClass(menu.id, 'menu_group')}
                                    expanded={expandedItemId === menu.id}
                                    onToggleExpand={() => toggleExpandedItem(menu.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(menu.id, 'menu_group', cl, status)}
                                    onEdit={() => openTeacherMenuEditor(menu)}
                                    onDelete={() => promptDeleteMenu(menu)}
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
                                onToggleExpand={() => toggleExpandedItem(group.id)}
                                onStatusChange={(cl, status) => handleStatusChange(group.id, 'menu_group', cl, status)}
                                onEdit={() => openBuiltInMenuEditor(group.id)}
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
                onCancel={clearDeleteTarget}
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
