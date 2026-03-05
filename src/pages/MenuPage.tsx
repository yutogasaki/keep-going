import React, { useState } from 'react';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { PublicExerciseBrowser } from '../components/PublicExerciseBrowser';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Toast } from '../components/Toast';
import { useAppStore } from '../store/useAppStore';
import { CustomMenuModal } from './menu/CustomMenuModal';
import { CreateGroupView } from './menu/CreateGroupView';
import { SingleExerciseEditor } from './menu/SingleExerciseEditor';
import { MenuGroupTab } from './menu/MenuGroupTab';
import { MenuIndividualTab } from './menu/MenuIndividualTab';
import { MenuTabs } from './menu/menu-page/MenuTabs';
import { useMenuPageData } from './menu/menu-page/useMenuPageData';

export const MenuPage: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);
    const updateUserSettings = useAppStore((state) => state.updateUserSettings);

    const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
    const [deleteExId, setDeleteExId] = useState<string | null>(null);

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
        autoMenuMinutes,
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
        teacherExercises,
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
        updateUserSettings,
    });

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
                teacherExercises={teacherExercises.filter(te => !teacherHiddenExerciseIds.has(te.id))}
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
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 100,
        }}>
            <PageHeader title="メニュー" rightElement={<CurrentContextBadge />} />

            <MenuTabs tab={tab} onChange={setTab} />

            {tab === 'group' && (
                <MenuGroupTab
                    exerciseMap={exerciseMap}
                    isTogetherMode={isTogetherMode}
                    dailyTargetMinutes={dailyTargetMinutes}
                    effectiveRequiredCount={effectiveRequiredCount}
                    effectiveExcludedCount={effectiveExcludedCount}
                    autoMenuMinutes={autoMenuMinutes}
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
                />
            )}

            {tab === 'individual' && (
                <MenuIndividualTab
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
                />
            )}

            <CustomMenuModal
                show={showCustomMenu}
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredExercises={requiredExercises}
                excludedExercises={excludedExercises}
                customExercises={customExercises}
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
            />

            <PublicExerciseBrowser
                open={showPublicExerciseBrowser}
                onClose={() => setShowPublicExerciseBrowser(false)}
                onImported={loadCustomData}
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
                message="このじぶん種目をさくじょしますか？この操作は取り消せません。"
                onCancel={() => setDeleteExId(null)}
                onConfirm={() => {
                    if (deleteExId) {
                        handleDeleteEx(deleteExId);
                    }
                    setDeleteExId(null);
                }}
            />

            <Toast
                message={toastMessage?.text ?? null}
                type={toastMessage?.type ?? 'success'}
                onClose={clearToast}
            />
        </div>
    );
};
