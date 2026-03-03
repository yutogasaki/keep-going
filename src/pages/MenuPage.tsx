import React from 'react';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { PublicExerciseBrowser } from '../components/PublicExerciseBrowser';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
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
                    isTogetherMode={isTogetherMode}
                    dailyTargetMinutes={dailyTargetMinutes}
                    requiredExercises={requiredExercises}
                    excludedExercises={excludedExercises}
                    autoMenuMinutes={autoMenuMinutes}
                    presets={presets}
                    customGroups={customGroups}
                    sessionUserCount={sessionUserCount}
                    getCreatorName={getCreatorName}
                    onOpenCustomMenu={() => setShowCustomMenu(true)}
                    onGroupTap={handleGroupTap}
                    onEditGroup={setEditGroup}
                    onDeleteGroup={handleDeleteGroup}
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
                    onDeleteCustomExercise={handleDeleteEx}
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
        </div>
    );
};
