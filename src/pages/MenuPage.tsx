import React, { useEffect, useMemo, useState } from 'react';
import { type PersonalChallengeCreateSeed } from '../components/PersonalChallengeFormSheet';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { ScreenScaffold } from '../components/ScreenScaffold';
import type { ExercisePlacement } from '../data/exercisePlacement';
import {
    buildCustomExerciseDeletePlan,
    buildCustomGroupDeletePlan,
} from '../lib/customContentDeletePlan';
import { useAppStore } from '../store/useAppStore';
import { CreateGroupView } from './menu/CreateGroupView';
import { SingleExerciseEditor } from './menu/SingleExerciseEditor';
import { MenuGroupTab } from './menu/MenuGroupTab';
import { MenuIndividualTab } from './menu/MenuIndividualTab';
import { MenuPageOverlays } from './menu/menu-page/MenuPageOverlays';
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
    const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);
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
        effectiveRequiredExerciseIds,
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
        myPublishedMenus,
        myPublishedExercises,
        findPublishedMenu,
        handlePublishGroup,
        handleUnpublishGroup,
        handleStartSingleExercise,
        handleStartCustomExercise,
        handleStartHybridSession,
        teacherExercises,
        teacherMenus,
        teacherSettings,
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
    const deletingCustomGroup = useMemo(
        () => customGroups.find((group) => group.id === deleteGroupId) ?? null,
        [customGroups, deleteGroupId],
    );
    const customGroupDeleteImpact = useMemo(
        () => buildCustomGroupDeletePlan(deletingCustomGroup, myPublishedMenus),
        [deletingCustomGroup, myPublishedMenus],
    );
    const deletingCustomExercise = useMemo(
        () => customExercises.find((exercise) => exercise.id === deleteExId) ?? null,
        [customExercises, deleteExId],
    );
    const customExerciseDeleteImpact = useMemo(
        () => buildCustomExerciseDeletePlan(
            deletingCustomExercise,
            customGroups,
            myPublishedMenus,
            myPublishedExercises,
        ),
        [customGroups, deletingCustomExercise, myPublishedExercises, myPublishedMenus],
    );

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
        const publishedExercise = editEx ? findPublishedExercise(editEx) : undefined;

        return (
            <SingleExerciseEditor
                initial={editEx}
                publishedExercise={publishedExercise}
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
                        requiredExercises={effectiveRequiredExerciseIds}
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

            <MenuPageOverlays
                showCustomMenu={showCustomMenu}
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredExercises={requiredExercises}
                excludedExercises={excludedExercises}
                customExercises={customExercises}
                classLevel={classLevel}
                teacherExercises={teacherExercises}
                teacherMenus={teacherMenus}
                teacherSettings={teacherSettings}
                teacherExcludedExerciseIds={teacherExcludedExerciseIds}
                teacherRequiredExerciseIds={teacherRequiredExerciseIds}
                teacherHiddenExerciseIds={teacherHiddenExerciseIds}
                onCloseCustomMenu={() => setShowCustomMenu(false)}
                onSetDailyTargetMinutes={setDailyTargetMinutes}
                onSetExcludedExercises={setExcludedExercises}
                onSetRequiredExercises={setRequiredExercises}
                showPublicBrowser={showPublicBrowser}
                onClosePublicBrowser={() => setShowPublicBrowser(false)}
                onImportedPublicMenu={loadCustomData}
                onCreatePersonalChallengeFromPublicMenu={
                    canCreatePersonalChallenge
                        ? async (seed) => {
                            await loadCustomData();
                            setShowPublicBrowser(false);
                            openPersonalChallengeForm(seed);
                        }
                        : undefined
                }
                showPublicExerciseBrowser={showPublicExerciseBrowser}
                onClosePublicExerciseBrowser={() => setShowPublicExerciseBrowser(false)}
                onImportedPublicExercise={loadCustomData}
                onCreatePersonalChallengeFromPublicExercise={
                    canCreatePersonalChallenge
                        ? async (seed) => {
                            await loadCustomData();
                            setShowPublicExerciseBrowser(false);
                            openPersonalChallengeForm(seed);
                        }
                        : undefined
                }
                personalChallengeFormOpen={personalChallengeFormOpen}
                personalChallengeMember={personalChallengeMember}
                customGroups={customGroups}
                personalChallengeSeed={personalChallengeSeed}
                onClosePersonalChallengeForm={() => {
                    setPersonalChallengeFormOpen(false);
                    setPersonalChallengeSeed(null);
                }}
                onPersonalChallengeSaved={() => {
                    setPersonalChallengeSeed(null);
                }}
                deleteGroupId={deleteGroupId}
                deleteGroupLoading={deleteGroupLoading}
                customGroupDeleteImpact={customGroupDeleteImpact}
                onCancelDeleteGroup={() => {
                    if (deleteGroupLoading) {
                        return;
                    }
                    setDeleteGroupId(null);
                }}
                onConfirmDeleteGroup={() => {
                    if (!deleteGroupId || deleteGroupLoading) {
                        return;
                    }

                    void (async () => {
                        setDeleteGroupLoading(true);
                        try {
                            await handleDeleteGroup(deleteGroupId);
                            setDeleteGroupId(null);
                        } finally {
                            setDeleteGroupLoading(false);
                        }
                    })();
                }}
                deleteExId={deleteExId}
                deleteExLoading={deleteExLoading}
                customExerciseDeleteImpact={customExerciseDeleteImpact}
                onCancelDeleteExercise={() => {
                    if (deleteExLoading) {
                        return;
                    }
                    setDeleteExId(null);
                }}
                onConfirmDeleteExercise={() => {
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
                toastMessage={toastMessage}
                onCloseToast={clearToast}
            />
        </>
    );
};
