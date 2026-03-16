import React, { useEffect, useMemo, useState } from 'react';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { PublicExerciseBrowser } from '../components/PublicExerciseBrowser';
import { PersonalChallengeFormSheet, type PersonalChallengeCreateSeed } from '../components/PersonalChallengeFormSheet';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Toast } from '../components/Toast';
import type { ExercisePlacement } from '../data/exercisePlacement';
import { menuGroupReferencesExercise, removeExerciseFromMenuGroup } from '../lib/menuExerciseCleanup';
import { useAppStore } from '../store/useAppStore';
import { CustomMenuModal } from './menu/CustomMenuModal';
import { CreateGroupView } from './menu/CreateGroupView';
import { SingleExerciseEditor } from './menu/SingleExerciseEditor';
import { MenuGroupTab } from './menu/MenuGroupTab';
import { MenuIndividualTab } from './menu/MenuIndividualTab';
import { MenuTabs } from './menu/menu-page/MenuTabs';
import { useMenuPageData } from './menu/menu-page/useMenuPageData';
import { useMenuUsageStats } from './menu/menu-page/useMenuUsageStats';

export const MenuPage: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const currentTab = useAppStore((state) => state.currentTab);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);
    const startSessionWithPlan = useAppStore((state) => state.startSessionWithPlan);
    const startHybridSession = useAppStore((state) => state.startHybridSession);
    const updateUserSettings = useAppStore((state) => state.updateUserSettings);
    const menuOpenIntent = useAppStore((state) => state.menuOpenIntent);
    const clearMenuOpenIntent = useAppStore((state) => state.clearMenuOpenIntent);

    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
    const [deleteExId, setDeleteExId] = useState<string | null>(null);
    const [deleteExLoading, setDeleteExLoading] = useState(false);
    const [focusedPlacement, setFocusedPlacement] = useState<ExercisePlacement | null>(null);
    const [focusRequestId, setFocusRequestId] = useState(0);
    const [personalChallengeSeed, setPersonalChallengeSeed] = useState<PersonalChallengeCreateSeed | null>(null);
    const [personalChallengeFormOpen, setPersonalChallengeFormOpen] = useState(false);
    const usageStats = useMenuUsageStats();

    const {
        tab,
        setTab,
        classLevel,
        presets,
        customGroups,
        customExercises,
        showCreateGroup,
        setShowCreateGroup,
        showCreateEx,
        setShowCreateEx,
        editGroup,
        setEditGroup,
        editEx,
        setEditEx,
        showCustomMenu,
        setShowCustomMenu,
        showPublicBrowser,
        setShowPublicBrowser,
        isTogetherMode,
        dailyTargetMinutes,
        excludedExercises,
        requiredExercises,
        currentUsers,
        exercises,
        canPublish,
        effectiveRequiredCount,
        effectiveExcludedCount,
        sessionUserCount,
        getCreatorName,
        loadCustomData,
        setDailyTargetMinutes,
        setExcludedExercises,
        setRequiredExercises,
        handleGroupTap,
        handleDeleteGroup,
        handleDeleteEx,
        handleCreatedGroup,
        handleCreatedEx,
        findPublishedMenu,
        handlePublishGroup,
        handleUnpublishGroup,
        handleStartSingleExercise,
        handleStartCustomExercise,
        handleStartHybridSession,
        teacherExercises,
        teacherMenus,
        teacherExerciseIds,
        teacherMenuIds,
        teacherExcludedExerciseIds,
        teacherRequiredExerciseIds,
        teacherHiddenExerciseIds,
        isNewTeacherContent,
        showPublicExerciseBrowser,
        setShowPublicExerciseBrowser,
        findPublishedExercise,
        handlePublishExercise,
        handleUnpublishExercise,
        exerciseMap,
        toastMessage,
        clearToast,
    } = useMenuPageData({
        users,
        sessionUserIds,
        startSessionWithExercises,
        startSessionWithPlan,
        startHybridSession,
        updateUserSettings,
    });

    const canCreatePersonalChallenge = !isTogetherMode && currentUsers.length === 1;
    const personalChallengeMember = canCreatePersonalChallenge ? (currentUsers[0] ?? null) : null;
    const deletingCustomExercise = useMemo(
        () => customExercises.find((exercise) => exercise.id === deleteExId) ?? null,
        [customExercises, deleteExId],
    );
    const customExerciseDeleteImpact = useMemo(() => {
        if (!deletingCustomExercise) {
            return {
                updatedMenuNames: [] as string[],
                removedMenuNames: [] as string[],
            };
        }

        const updatedMenuNames: string[] = [];
        const removedMenuNames: string[] = [];
        for (const group of customGroups) {
            if (!menuGroupReferencesExercise(group, deletingCustomExercise.id)) {
                continue;
            }

            const nextGroup = removeExerciseFromMenuGroup(group, deletingCustomExercise.id);
            if (nextGroup === null) {
                removedMenuNames.push(group.name);
            } else {
                updatedMenuNames.push(group.name);
            }
        }

        return {
            updatedMenuNames,
            removedMenuNames,
        };
    }, [customGroups, deletingCustomExercise]);

    const openPersonalChallengeForm = (seed: PersonalChallengeCreateSeed) => {
        if (!canCreatePersonalChallenge) {
            return;
        }
        setPersonalChallengeSeed(seed);
        setPersonalChallengeFormOpen(true);
    };

    useEffect(() => {
        if (currentTab !== 'menu' || !menuOpenIntent) {
            return;
        }

        setTab(menuOpenIntent.tab);
        setFocusedPlacement(menuOpenIntent.placement);
        setFocusRequestId(menuOpenIntent.requestId);
        clearMenuOpenIntent();
    }, [clearMenuOpenIntent, currentTab, menuOpenIntent, setTab]);

    if (showCreateGroup || editGroup) {
        const publishedId = editGroup ? findPublishedMenu(editGroup)?.id : undefined;

        return (
            <CreateGroupView
                classLevel={classLevel}
                initial={editGroup}
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                authorName={currentUsers[0]?.name ?? 'ゲスト'}
                publishedMenuId={publishedId}
                customExercises={customExercises}
                teacherExercises={teacherExercises.filter((te) => !teacherHiddenExerciseIds.has(te.id))}
                onSave={handleCreatedGroup}
                onCancel={() => {
                    setShowCreateGroup(false);
                    setEditGroup(null);
                }}
            />
        );
    }

    if (showCreateEx || editEx) {
        return (
            <SingleExerciseEditor
                initial={editEx}
                currentUserId={sessionUserIds.length === 1 ? sessionUserIds[0] : undefined}
                authorName={currentUsers[0]?.name ?? 'ゲスト'}
                onSave={handleCreatedEx}
                onCancel={() => {
                    setShowCreateEx(false);
                    setEditEx(null);
                }}
            />
        );
    }

    return (
        <>
            <ScreenScaffold
                header={<PageHeader title="メニュー" rightElement={<CurrentContextBadge />} />}
                withBottomNav
                contentStyle={{ display: 'flex', flexDirection: 'column' }}
            >
                <MenuTabs tab={tab} onChange={setTab} />

                {tab === 'group' && (
                    <MenuGroupTab
                        usageStats={usageStats}
                        exerciseMap={exerciseMap}
                        isTogetherMode={isTogetherMode}
                        dailyTargetMinutes={dailyTargetMinutes}
                        effectiveRequiredCount={effectiveRequiredCount}
                        effectiveExcludedCount={effectiveExcludedCount}
                        presets={presets}
                        customGroups={customGroups}
                        sessionUserCount={sessionUserCount}
                        getCreatorName={getCreatorName}
                        onOpenCustomMenu={() => setShowCustomMenu(true)}
                        onGroupTap={handleGroupTap}
                        onEditGroup={setEditGroup}
                        onDeleteGroup={(groupId) => setDeleteGroupId(groupId)}
                        onCreateGroup={() => setShowCreateGroup(true)}
                        canPublish={canPublish}
                        onPublishGroup={handlePublishGroup}
                        onUnpublishGroup={handleUnpublishGroup}
                        findPublishedMenu={findPublishedMenu}
                        onOpenPublicBrowser={() => setShowPublicBrowser(true)}
                        teacherMenuIds={teacherMenuIds}
                        isNewTeacherContent={isNewTeacherContent}
                        onCreatePersonalChallenge={canCreatePersonalChallenge ? openPersonalChallengeForm : undefined}
                    />
                )}

                {tab === 'individual' && (
                    <MenuIndividualTab
                        usageStats={usageStats}
                        exercises={exercises}
                        requiredExercises={requiredExercises}
                        customExercises={customExercises}
                        isTogetherMode={isTogetherMode}
                        getCreatorName={getCreatorName}
                        onStartExercise={handleStartSingleExercise}
                        onEditCustomExercise={setEditEx}
                        onDeleteCustomExercise={(exId) => setDeleteExId(exId)}
                        onStartCustomExercise={handleStartCustomExercise}
                        onCreateCustomExercise={() => setShowCreateEx(true)}
                        teacherExerciseIds={teacherExerciseIds}
                        isNewTeacherContent={isNewTeacherContent}
                        canPublish={canPublish}
                        findPublishedExercise={findPublishedExercise}
                        onPublishExercise={handlePublishExercise}
                        onUnpublishExercise={handleUnpublishExercise}
                        onOpenPublicExerciseBrowser={() => setShowPublicExerciseBrowser(true)}
                        onStartHybridSession={handleStartHybridSession}
                        focusCategory={focusedPlacement}
                        focusRequestId={focusRequestId}
                        onCreatePersonalChallenge={canCreatePersonalChallenge ? openPersonalChallengeForm : undefined}
                    />
                )}
            </ScreenScaffold>

            <CustomMenuModal
                show={showCustomMenu}
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredExercises={requiredExercises}
                excludedExercises={excludedExercises}
                customExercises={customExercises}
                teacherExercises={teacherExercises.filter((te) => !teacherHiddenExerciseIds.has(te.id))}
                teacherExcludedExerciseIds={teacherExcludedExerciseIds}
                teacherRequiredExerciseIds={teacherRequiredExerciseIds}
                teacherHiddenExerciseIds={teacherHiddenExerciseIds}
                onClose={() => setShowCustomMenu(false)}
                onSetDailyTargetMinutes={setDailyTargetMinutes}
                onSetExcludedExercises={setExcludedExercises}
                onSetRequiredExercises={setRequiredExercises}
            />

            <PublicMenuBrowser
                open={showPublicBrowser}
                onClose={() => setShowPublicBrowser(false)}
                onImported={loadCustomData}
                onCreatePersonalChallenge={
                    canCreatePersonalChallenge
                        ? async (seed) => {
                              await loadCustomData();
                              setShowPublicBrowser(false);
                              openPersonalChallengeForm(seed);
                          }
                        : undefined
                }
            />

            <PublicExerciseBrowser
                open={showPublicExerciseBrowser}
                onClose={() => setShowPublicExerciseBrowser(false)}
                onImported={loadCustomData}
                onCreatePersonalChallenge={
                    canCreatePersonalChallenge
                        ? async (seed) => {
                              await loadCustomData();
                              setShowPublicExerciseBrowser(false);
                              openPersonalChallengeForm(seed);
                          }
                        : undefined
                }
            />

            <PersonalChallengeFormSheet
                open={personalChallengeFormOpen}
                member={personalChallengeMember}
                teacherExercises={teacherExercises}
                teacherMenus={teacherMenus}
                customExercises={customExercises}
                customMenus={customGroups}
                initialSeed={personalChallengeSeed}
                onClose={() => {
                    setPersonalChallengeFormOpen(false);
                    setPersonalChallengeSeed(null);
                }}
                onSaved={() => {
                    setPersonalChallengeSeed(null);
                }}
            />

            <ConfirmDeleteModal
                open={deleteGroupId !== null}
                title="メニューをさくじょ"
                message="このメニューをさくじょしますか？この操作は取り消せません。"
                onCancel={() => setDeleteGroupId(null)}
                onConfirm={() => {
                    if (deleteGroupId) {
                        handleDeleteGroup(deleteGroupId);
                    }
                    setDeleteGroupId(null);
                }}
            />

            <ConfirmDeleteModal
                open={deleteExId !== null}
                title="種目をさくじょ"
                message={
                    customExerciseDeleteImpact.updatedMenuNames.length > 0 ||
                    customExerciseDeleteImpact.removedMenuNames.length > 0
                        ? 'このじぶん種目をさくじょします。使っているメニューからは自動で外し、空になったメニューは自動でさくじょします。'
                        : 'このじぶん種目をさくじょしますか？この操作は取り消せません。'
                }
                details={
                    customExerciseDeleteImpact.updatedMenuNames.length > 0 ||
                    customExerciseDeleteImpact.removedMenuNames.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {customExerciseDeleteImpact.updatedMenuNames.length > 0 ? (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: 6,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#2BBAA0',
                                        }}
                                    >
                                        自動で外れるメニュー
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {customExerciseDeleteImpact.updatedMenuNames.map((name) => (
                                            <span
                                                key={`update-${name}`}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(43, 186, 160, 0.1)',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#00796B',
                                                }}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {customExerciseDeleteImpact.removedMenuNames.length > 0 ? (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: 6,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#E17055',
                                        }}
                                    >
                                        空になるので削除されるメニュー
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {customExerciseDeleteImpact.removedMenuNames.map((name) => (
                                            <span
                                                key={`remove-${name}`}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(225, 112, 85, 0.1)',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#E17055',
                                                }}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null
                }
                loading={deleteExLoading}
                confirmLabel={
                    customExerciseDeleteImpact.updatedMenuNames.length > 0 ||
                    customExerciseDeleteImpact.removedMenuNames.length > 0
                        ? '外して削除する'
                        : '削除する'
                }
                loadingLabel="更新中..."
                onCancel={() => {
                    if (deleteExLoading) {
                        return;
                    }
                    setDeleteExId(null);
                }}
                onConfirm={() => {
                    if (!deleteExId || deleteExLoading) {
                        return;
                    }

                    void (async () => {
                        setDeleteExLoading(true);
                        try {
                            await handleDeleteEx(deleteExId);
                            setDeleteExId(null);
                        } finally {
                            setDeleteExLoading(false);
                        }
                    })();
                }}
            />

            <Toast message={toastMessage?.text ?? null} type={toastMessage?.type ?? 'success'} onClose={clearToast} />
        </>
    );
};
