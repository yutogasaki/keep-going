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
import { sortTeacherContentByRecommendation, type TeacherContentDisplayMode } from '../../lib/teacherExerciseMetadata';
import { CANONICAL_TERMS, DISPLAY_TERMS } from '../../lib/terminology';

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

export const MenuSettingsSection: React.FC<MenuSettingsSectionProps> = ({ teacherEmail, loading: parentLoading }) => {
    const startTeacherPreviewSession = useAppStore((state) => state.startTeacherPreviewSession);
    const [subTab, setSubTab] = useState<SubTab>('groups');
    const {
        canDeleteExercise,
        canDeleteMenu,
        clearDeleteTarget,
        closeExerciseForm,
        closeMenuForm,
        deleteLoading,
        deleteImpact,
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
            <div
                style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                }}
            >
                読み込み中...
            </div>
        );
    }

    return (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
                {[
                    { id: 'groups' as SubTab, label: DISPLAY_TERMS.groupTab },
                    { id: 'exercises' as SubTab, label: DISPLAY_TERMS.exerciseTab },
                ].map((tab) => (
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
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'rgba(225, 112, 85, 0.1)',
                        border: '1px solid rgba(225, 112, 85, 0.3)',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#E17055',
                        lineHeight: 1.5,
                    }}
                >
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
                {subTab === 'exercises'
                    ? `新しい${CANONICAL_TERMS.teacherExercise}を作成`
                    : `新しい${CANONICAL_TERMS.teacherMenu}を作成`}
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
                    onPlay={
                        exerciseEditorItemId
                            ? () => {
                                  audio.initTTS();
                                  startTeacherPreviewSession([exerciseEditorItemId]);
                              }
                            : undefined
                    }
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
                    onPlay={
                        menuEditorItemId
                            ? () => {
                                  audio.initTTS();
                                  startTeacherPreviewSession(menuEditorInitial?.exerciseIds ?? []);
                              }
                            : undefined
                    }
                    onDelete={canDeleteMenu ? handleDeleteMenuFromEditor : undefined}
                    submitting={submitting}
                />
            )}

            {/* Legend */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    color: '#8395A7',
                    padding: '4px 0',
                }}
            >
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
                            <SectionLabel text={CANONICAL_TERMS.teacherExercise} color="#0984E3" />
                            {sortTeacherExercises(teacherExercises).map((ex) => (
                                <MenuSettingsItemCard
                                    key={ex.id}
                                    emoji={ex.emoji}
                                    name={ex.name}
                                    categoryLabel={getExercisePlacementLabel(ex.placement)}
                                    recommended={ex.recommended}
                                    recommendedOrder={ex.recommendedOrder}
                                    visibility={ex.visibility}
                                    displayMode={ex.displayMode}
                                    statusByClass={getStatusByClass(ex.id, 'exercise')}
                                    expanded={expandedItemId === ex.id}
                                    onToggleExpand={() => toggleExpandedItem(ex.id)}
                                    onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                    onEdit={() => openTeacherExerciseEditor(ex)}
                                    onDelete={() => promptDeleteExercise(ex)}
                                    onPlay={() => {
                                        audio.initTTS();
                                        startTeacherPreviewSession([ex.id]);
                                    }}
                                    editLabel="編集"
                                />
                            ))}
                        </>
                    )}

                    <SectionLabel text={CANONICAL_TERMS.standardExercise} color="#8395A7" />
                    {EXERCISES.map((ex) => {
                        const ov = getOverride(ex.id, 'exercise');
                        const displayName = ov?.nameOverride ?? ex.name;
                        const displayEmoji = ov?.emojiOverride ?? ex.emoji;
                        const displayModeOv = ov?.displayModeOverride as TeacherContentDisplayMode | null | undefined;
                        return (
                            <MenuSettingsItemCard
                                key={ex.id}
                                emoji={displayEmoji}
                                name={displayName}
                                categoryLabel={getExercisePlacementLabel(ex.placement)}
                                displayMode={displayModeOv ?? undefined}
                                statusByClass={getStatusByClass(ex.id, 'exercise')}
                                expanded={expandedItemId === ex.id}
                                onToggleExpand={() => toggleExpandedItem(ex.id)}
                                onStatusChange={(cl, status) => handleStatusChange(ex.id, 'exercise', cl, status)}
                                onEdit={() => openBuiltInExerciseEditor(ex.id)}
                                onPlay={() => {
                                    audio.initTTS();
                                    startTeacherPreviewSession([ex.id]);
                                }}
                                editLabel="調整"
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
                            <SectionLabel text={CANONICAL_TERMS.teacherMenu} color="#0984E3" />
                            {sortTeacherMenus(teacherMenus).map((menu) => (
                                <MenuSettingsItemCard
                                    key={menu.id}
                                    emoji={menu.emoji}
                                    name={menu.name}
                                    recommended={menu.recommended}
                                    recommendedOrder={menu.recommendedOrder}
                                    visibility={menu.visibility}
                                    displayMode={menu.displayMode}
                                    statusByClass={getStatusByClass(menu.id, 'menu_group')}
                                    expanded={expandedItemId === menu.id}
                                    onToggleExpand={() => toggleExpandedItem(menu.id)}
                                    onStatusChange={(cl, status) =>
                                        handleStatusChange(menu.id, 'menu_group', cl, status)
                                    }
                                    onEdit={() => openTeacherMenuEditor(menu)}
                                    onDelete={() => promptDeleteMenu(menu)}
                                    onPlay={() => {
                                        audio.initTTS();
                                        startTeacherPreviewSession(menu.exerciseIds);
                                    }}
                                    itemType="menu_group"
                                    editLabel="編集"
                                />
                            ))}
                        </>
                    )}

                    <SectionLabel text={CANONICAL_TERMS.presetMenu} color="#8395A7" />
                    {PRESET_GROUPS.map((group) => {
                        const ov = getOverride(group.id, 'menu_group');
                        const displayName = ov?.nameOverride ?? group.name;
                        const displayEmoji = ov?.emojiOverride ?? group.emoji;
                        const displayModeOv = ov?.displayModeOverride as TeacherContentDisplayMode | null | undefined;
                        return (
                            <MenuSettingsItemCard
                                key={group.id}
                                emoji={displayEmoji}
                                name={displayName}
                                displayMode={displayModeOv ?? undefined}
                                statusByClass={getStatusByClass(group.id, 'menu_group')}
                                expanded={expandedItemId === group.id}
                                onToggleExpand={() => toggleExpandedItem(group.id)}
                                onStatusChange={(cl, status) => handleStatusChange(group.id, 'menu_group', cl, status)}
                                onEdit={() => openBuiltInMenuEditor(group.id)}
                                onPlay={() => {
                                    audio.initTTS();
                                    startTeacherPreviewSession(group.exerciseIds);
                                }}
                                itemType="menu_group"
                                editLabel="調整"
                            />
                        );
                    })}
                </>
            )}

            {/* Delete confirmation modal */}
            <ConfirmDeleteModal
                open={!!deleteTarget}
                title={deleteTarget?.type === 'exercise' ? 'この種目を削除しますか？' : 'このメニューを削除しますか？'}
                message={
                    deleteTarget?.type === 'exercise' &&
                    deleteImpact &&
                    (deleteImpact.updatedTeacherMenuNames.length > 0 ||
                        deleteImpact.removedTeacherMenuNames.length > 0 ||
                        deleteImpact.updatedCustomMenuNames.length > 0 ||
                        deleteImpact.removedCustomMenuNames.length > 0)
                        ? `「${deleteTarget?.name ?? ''}」を削除します。使っているメニューからは自動で外し、空になったメニューは自動で削除します。`
                        : `「${deleteTarget?.name ?? ''}」を削除すると元に戻せません。`
                }
                details={
                    deleteTarget?.type === 'exercise' && deleteImpact ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {deleteImpact.updatedTeacherMenuNames.length > 0 ? (
                                <ImpactList
                                    title="自動で外れる先生メニュー"
                                    names={deleteImpact.updatedTeacherMenuNames}
                                    bg="rgba(9, 132, 227, 0.08)"
                                    color="#0984E3"
                                />
                            ) : null}
                            {deleteImpact.removedTeacherMenuNames.length > 0 ? (
                                <ImpactList
                                    title="空になるので削除される先生メニュー"
                                    names={deleteImpact.removedTeacherMenuNames}
                                    bg="rgba(225, 112, 85, 0.1)"
                                    color="#E17055"
                                />
                            ) : null}
                            {deleteImpact.updatedCustomMenuNames.length > 0 ? (
                                <ImpactList
                                    title="この端末で自動更新される じぶんメニュー"
                                    names={deleteImpact.updatedCustomMenuNames}
                                    bg="rgba(43, 186, 160, 0.1)"
                                    color="#00796B"
                                />
                            ) : null}
                            {deleteImpact.removedCustomMenuNames.length > 0 ? (
                                <ImpactList
                                    title="この端末で削除される じぶんメニュー"
                                    names={deleteImpact.removedCustomMenuNames}
                                    bg="rgba(225, 112, 85, 0.1)"
                                    color="#E17055"
                                />
                            ) : null}
                        </div>
                    ) : null
                }
                onCancel={clearDeleteTarget}
                onConfirm={handleConfirmDelete}
                loading={deleteLoading}
                confirmLabel={
                    deleteTarget?.type === 'exercise' &&
                    deleteImpact &&
                    (deleteImpact.updatedTeacherMenuNames.length > 0 ||
                        deleteImpact.removedTeacherMenuNames.length > 0 ||
                        deleteImpact.updatedCustomMenuNames.length > 0 ||
                        deleteImpact.removedCustomMenuNames.length > 0)
                        ? '外して削除する'
                        : '削除する'
                }
                loadingLabel="更新中..."
            />
        </div>
    );
};

const ImpactList: React.FC<{
    title: string;
    names: string[];
    bg: string;
    color: string;
}> = ({ title, names, bg, color }) => (
    <div>
        <div
            style={{
                marginBottom: 6,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color,
            }}
        >
            {title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {names.map((name) => (
                <span
                    key={`${title}-${name}`}
                    style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        background: bg,
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color,
                    }}
                >
                    {name}
                </span>
            ))}
        </div>
    </div>
);

const SectionLabel: React.FC<{ text: string; color: string }> = ({ text, color }) => (
    <div
        style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color,
            padding: '4px 0 0',
        }}
    >
        {text}
    </div>
);
