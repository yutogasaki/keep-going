import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { ScreenScaffold } from '../components/ScreenScaffold';
import type { MenuGroup } from '../data/menuGroups';
import { getCustomGroups } from '../lib/customGroups';
import { subscribeCustomContentUpdated } from '../lib/customContentEvents';
import { getCustomExercises, type CustomExercise } from '../lib/db';
import { type PublicExercise } from '../lib/publicExercises';
import { type PublicMenu } from '../lib/publicMenus';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import { useAppStore } from '../store/useAppStore';
import { HomeAnimatedBackground } from './home/HomeAnimatedBackground';
import { FuwafuwaHomeCard } from './home/FuwafuwaHomeCard';
import { HomeChallengesAndMenus } from './home/HomeChallengesAndMenus';
import { HomeOverlays } from './home/HomeOverlays';
import {
    getFamilyHomeContextKey,
    getSoloHomeContextKey,
} from './home/homeAfterglow';
import {
    getFamilyVisitMemoryKey,
} from './home/homeVisitMemory';
import { useHomeChallenges } from './home/hooks/useHomeChallenges';
import {
    usePersonalChallenges,
    type PersonalChallengeCompletionNotice,
} from './home/hooks/usePersonalChallenges';
import { useHomeSessions } from './home/hooks/useHomeSessions';
import { useHomePublicDiscovery } from './home/hooks/useHomePublicDiscovery';
import { type ChallengeRewardScene } from './home/challengeRewardUtils';
import { useHomeFuwafuwaState } from './home/useHomeFuwafuwaState';
import { useHomePersonalChallengeActions } from './home/useHomePersonalChallengeActions';
import { useHomeRewardQueue } from './home/useHomeRewardQueue';
import { useHomeTeacherDiscovery } from './home/useHomeTeacherDiscovery';
import { getMinClassLevel } from './menu/menuPageUtils';
import { SCREEN_BOTTOM_WITH_FAB } from '../lib/styles';
import { resolvePublicMenuToSessionPlannedItems } from '../lib/publicMenuUtils';
import type { ExercisePlacement } from '../data/exercisePlacement';

export const HomeScreen: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const openMenuWithIntent = useAppStore((state) => state.openMenuWithIntent);
    const updateUser = useAppStore((state) => state.updateUser);
    const activeMilestoneModal = useAppStore((state) => state.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore((state) => state.setActiveMilestoneModal);
    const consumeUserMagicEnergy = useAppStore((state) => state.consumeUserMagicEnergy);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);
    const startSessionWithPlan = useAppStore((state) => state.startSessionWithPlan);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);
    const dismissedHomeAnnouncementIds = useAppStore((state) => state.dismissedHomeAnnouncementIds);
    const dismissHomeAnnouncement = useAppStore((state) => state.dismissHomeAnnouncement);
    const homeVisitMemory = useAppStore((state) => state.homeVisitMemory);
    const markSoloHomeVisit = useAppStore((state) => state.markSoloHomeVisit);
    const markFamilyHomeVisit = useAppStore((state) => state.markFamilyHomeVisit);
    const currentTab = useAppStore((state) => state.currentTab);
    const isHomeActive = currentTab === 'home';

    const openMenuGroupTab = useCallback(() => {
        openMenuWithIntent({ tab: 'group' });
    }, [openMenuWithIntent]);

    const openMenuIndividualTab = useCallback((placement?: ExercisePlacement | null) => {
        openMenuWithIntent({ tab: 'individual', placement: placement ?? null });
    }, [openMenuWithIntent]);

    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [exerciseBrowserOpen, setExerciseBrowserOpen] = useState(false);
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);
    const [selectedPublicExercise, setSelectedPublicExercise] = useState<PublicExercise | null>(null);
    const [selectedTeacherMenu, setSelectedTeacherMenu] = useState<TeacherMenu | null>(null);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState<TeacherExercise | null>(null);
    const [challengeHubOpen, setChallengeHubOpen] = useState(false);
    const [customChallengeExercises, setCustomChallengeExercises] = useState<CustomExercise[]>([]);
    const [customChallengeMenus, setCustomChallengeMenus] = useState<MenuGroup[]>([]);

    const { allSessions, activeUsers, targetSeconds, perUserMagic, displaySeconds } = useHomeSessions({
        users,
        sessionUserIds,
        enabled: isHomeActive,
    });
    const {
        recommendedMenus,
        recommendedExercises,
        ambientCue,
    } = useHomePublicDiscovery(isHomeActive);

    useEffect(() => {
        if (users.length === 0) {
            return;
        }

        if (sessionUserIds.length === 0) {
            setSessionUserIds([users[0].id]);
            return;
        }

        const userIdSet = new Set(users.map((user) => user.id));
        const validIds = sessionUserIds.filter((id) => userIdSet.has(id));
        if (validIds.length !== sessionUserIds.length) {
            setSessionUserIds(validIds.length > 0 ? validIds : [users[0].id]);
        }
    }, [users, sessionUserIds, setSessionUserIds]);

    const isTogetherMode = sessionUserIds.length > 1;
    const currentUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [sessionUserIds, users],
    );
    const activeHomeUserIds = useMemo(
        () => (sessionUserIds.length > 0 ? sessionUserIds : users.map((user) => user.id)),
        [sessionUserIds, users],
    );
    const currentClassLevel = useMemo(
        () => getMinClassLevel(currentUsers),
        [currentUsers],
    );
    const selectedUser = useMemo(
        () => activeUsers[0] ?? users.find((user) => user.id === sessionUserIds[0]) ?? null,
        [activeUsers, sessionUserIds, users],
    );
    const familyVisitKey = useMemo(
        () => (isTogetherMode ? getFamilyVisitMemoryKey(currentUsers.map((user) => user.id)) : ''),
        [currentUsers, isTogetherMode],
    );
    const currentHomeContextKey = useMemo(
        () => (isTogetherMode
            ? getFamilyHomeContextKey(currentUsers.map((user) => user.id))
            : getSoloHomeContextKey(selectedUser?.id ?? sessionUserIds[0] ?? '')),
        [currentUsers, isTogetherMode, selectedUser?.id, sessionUserIds],
    );

    const {
        filteredChallenges,
        todayDoneChallenges,
        pastChallenges,
        completions,
        rewardGrants,
        teacherExercises,
        loadChallenges,
    } = useHomeChallenges({
        users,
        sessionUserIds,
        enabled: isHomeActive,
        sessions: allSessions,
    });
    const {
        activeChallengeRewardScene,
        queueChallengeRewardScene,
        closeActiveChallengeRewardScene,
    } = useHomeRewardQueue({
        currentTab,
        activeMilestoneModal,
    });
    const {
        activeChallenges: personalActiveChallenges,
        todayDoneChallenges: personalTodayDoneChallenges,
        pastChallenges: personalPastChallenges,
        loading: personalChallengesLoading,
        reload: reloadPersonalChallenges,
    } = usePersonalChallenges({
        users,
        sessionUserIds,
        enabled: isHomeActive,
        sessions: allSessions,
        onChallengeCompleted: useCallback((notice: PersonalChallengeCompletionNotice) => {
            if (notice.rewardStars <= 0) {
                return;
            }

            const scene: ChallengeRewardScene = {
                id: `personal:${notice.challengeId}`,
                challengeId: notice.challengeId,
                source: 'personal',
                title: notice.title,
                memberId: notice.memberId,
                memberName: notice.memberName,
                rewardKind: 'star',
                rewardValue: notice.rewardStars,
                accentEmoji: '⭐',
            };

            queueChallengeRewardScene(scene);
        }, [queueChallengeRewardScene]),
    });
    const loadCustomChallengeTargets = useCallback(async () => {
        const [menus, exercises] = await Promise.all([
            getCustomGroups(),
            getCustomExercises(),
        ]);
        setCustomChallengeMenus(menus);
        setCustomChallengeExercises(exercises);
    }, []);
    const activeAnnouncementUserIds = useMemo(
        () => (currentUsers.length > 0 ? currentUsers.map((user) => user.id) : sessionUserIds),
        [currentUsers, sessionUserIds],
    );
    const {
        teacherContent,
        teacherMenuHighlights,
        teacherExerciseHighlight,
        teacherMenuExerciseMap,
        homeAnnouncement,
        joinedTeacherChallenges,
        recommendedTeacherChallenge,
    } = useHomeTeacherDiscovery({
        currentClassLevel,
        activeAnnouncementUserIds,
        activeHomeUserIds,
        filteredChallenges,
        todayDoneChallenges,
        joinedChallengeIds,
        dismissedHomeAnnouncementIds,
    });

    useEffect(() => {
        void loadCustomChallengeTargets();
    }, [loadCustomChallengeTargets]);

    useEffect(() => {
        return subscribeCustomContentUpdated(() => {
            void loadCustomChallengeTargets();
        });
    }, [loadCustomChallengeTargets]);

    const {
        activeMilestoneUser,
        pendingMilestoneEventsByUserId,
        recentMilestoneEvent,
        recentAfterglow,
        setRecentAfterglow,
        activeMagicDeliveryContextKey,
        selectedUserVisitRecency,
        familyVisitRecency,
        handleMilestoneModalClose,
        handleTankReset,
    } = useHomeFuwafuwaState({
        users,
        allSessions,
        activeUsers,
        currentUsers,
        selectedUser,
        isTogetherMode,
        currentTab,
        activeMilestoneModal,
        setActiveMilestoneModal,
        updateUser,
        homeVisitMemory,
        markSoloHomeVisit,
        markFamilyHomeVisit,
        familyVisitKey,
        currentHomeContextKey,
        displaySeconds,
        targetSeconds,
        consumeUserMagicEnergy,
        homeAnnouncement,
        dismissHomeAnnouncement,
    });
    const {
        canCreatePersonalChallenge,
        selectedPersonalChallenge,
        editingPersonalChallenge,
        personalChallengeSeed,
        personalFormOpen,
        personalChallengeDeleteOpen,
        deletingPersonalChallenge,
        personalChallengeFormMember,
        handleOpenPersonalChallenge,
        handleCreatePersonalChallenge,
        handleCreatePersonalChallengeFromPublicMenu,
        handleCreatePersonalChallengeFromPublicExercise,
        handleCreatePersonalChallengeFromTeacherMenu,
        handleCreatePersonalChallengeFromTeacherExercise,
        handleEditPersonalChallenge,
        handleRetryPersonalChallenge,
        handleEndPersonalChallenge,
        handlePromptDeletePersonalChallenge,
        handleDeletePersonalChallenge,
        closeSelectedPersonalChallenge,
        closePersonalChallengeDelete,
        closePersonalChallengeForm,
        handlePersonalChallengeSaved,
    } = useHomePersonalChallengeActions({
        isTogetherMode,
        selectedUser,
        teacherMenus: teacherContent.teacherMenus,
        teacherExercises: teacherContent.teacherExercises,
        customChallengeExercises,
        customChallengeMenus,
        loadCustomChallengeTargets,
        reloadPersonalChallenges,
        closeChallengeHub: () => setChallengeHubOpen(false),
        closePublicMenu: () => setSelectedPublicMenu(null),
        closePublicExercise: () => setSelectedPublicExercise(null),
        closeTeacherMenu: () => setSelectedTeacherMenu(null),
        closeTeacherExercise: () => setSelectedTeacherExercise(null),
    });

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <HomeAnimatedBackground />

            <ScreenScaffold
                header={<PageHeader title="ホーム" rightElement={<CurrentContextBadge />} />}
                withBottomNav
                bottomPadding={SCREEN_BOTTOM_WITH_FAB}
                style={{ position: 'relative', zIndex: 1 }}
                contentStyle={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    paddingTop: 12,
                }}
            >
                <FuwafuwaHomeCard
                    isTogetherMode={isTogetherMode}
                    perUserMagic={perUserMagic}
                    displaySeconds={displaySeconds}
                    targetSeconds={targetSeconds}
                    isMagicDeliveryActive={activeMagicDeliveryContextKey === currentHomeContextKey}
                    onTankReset={handleTankReset}
                    selectedUser={selectedUser}
                    activeUsers={activeUsers}
                    allSessions={allSessions}
                    milestoneEventsByUserId={pendingMilestoneEventsByUserId}
                    recentMilestoneEvent={selectedUser && recentMilestoneEvent?.userId === selectedUser.id ? recentMilestoneEvent : null}
                    recentAfterglow={recentAfterglow}
                    onSelectUser={(userId) => setSessionUserIds([userId])}
                    announcement={homeAnnouncement}
                    ambientCue={ambientCue}
                    familyVisitRecency={familyVisitRecency}
                    selectedUserVisitRecency={selectedUserVisitRecency}
                    onAnnouncementAction={() => {
                        if (!homeAnnouncement) {
                            return;
                        }

                        if (currentHomeContextKey) {
                            setRecentAfterglow({
                                kind: 'announcement',
                                contextKey: currentHomeContextKey,
                                announcement: homeAnnouncement,
                            });
                        }

                        dismissHomeAnnouncement(homeAnnouncement.id);

                        if (homeAnnouncement.kind === 'challenge') {
                            document.getElementById('home-challenges-section')?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start',
                            });
                            return;
                        }

                        openMenuGroupTab();
                    }}
                />

                <HomeChallengesAndMenus
                    showChallengeSection={Boolean(selectedUser)}
                    challengeCardsEnabled={isHomeActive}
                    teacherActiveChallenges={joinedTeacherChallenges}
                    teacherRecommendedChallenge={recommendedTeacherChallenge}
                    personalActiveChallenges={personalActiveChallenges.slice(0, 2)}
                    completions={completions}
                    rewardGrants={rewardGrants}
                    recommendedMenus={recommendedMenus}
                    recommendedExercises={recommendedExercises}
                    teacherExercises={teacherExercises}
                    teacherMenus={teacherContent.teacherMenus}
                    customChallengeExercises={customChallengeExercises}
                    customChallengeMenus={customChallengeMenus}
                    teacherMenuHighlights={teacherMenuHighlights}
                    teacherExerciseHighlight={teacherExerciseHighlight}
                    teacherMenuExerciseMap={teacherMenuExerciseMap}
                    isNewTeacherContent={teacherContent.isNewTeacherContent}
                    onChallengesUpdated={loadChallenges}
                    onTeacherChallengeRewardGranted={queueChallengeRewardScene}
                    onOpenChallengeHub={() => setChallengeHubOpen(true)}
                    onOpenPersonalChallenge={handleOpenPersonalChallenge}
                    onCreatePersonalChallenge={handleCreatePersonalChallenge}
                    onOpenMenuBrowser={() => setMenuBrowserOpen(true)}
                    onOpenExerciseBrowser={() => setExerciseBrowserOpen(true)}
                    onOpenMenuTab={openMenuGroupTab}
                    onOpenExerciseTab={openMenuIndividualTab}
                    onTeacherMenuPreview={setSelectedTeacherMenu}
                    onTeacherExercisePreview={setSelectedTeacherExercise}
                    onTeacherMenuStart={(menu) => {
                        startSessionWithExercises(menu.exerciseIds, {
                            sourceMenuId: menu.id,
                            sourceMenuSource: 'teacher',
                            sourceMenuName: menu.name,
                        });
                    }}
                    onMenuTap={setSelectedPublicMenu}
                    onExerciseTap={setSelectedPublicExercise}
                />
            </ScreenScaffold>

            <HomeOverlays
                activeMilestoneModal={activeMilestoneModal}
                activeMilestoneUser={activeMilestoneUser}
                onCloseMilestoneModal={handleMilestoneModalClose}
                activeChallengeRewardScene={activeChallengeRewardScene}
                onCloseRewardModal={closeActiveChallengeRewardScene}
                challengeHubOpen={challengeHubOpen}
                isHomeActive={isHomeActive}
                filteredChallenges={filteredChallenges}
                todayDoneChallenges={todayDoneChallenges}
                pastChallenges={pastChallenges}
                completions={completions}
                rewardGrants={rewardGrants}
                teacherExercises={teacherContent.teacherExercises}
                teacherMenus={teacherContent.teacherMenus}
                customChallengeExercises={customChallengeExercises}
                customChallengeMenus={customChallengeMenus}
                personalActiveChallenges={personalActiveChallenges}
                personalTodayDoneChallenges={personalTodayDoneChallenges}
                personalPastChallenges={personalPastChallenges}
                personalChallengesLoading={personalChallengesLoading}
                canCreatePersonalChallenge={canCreatePersonalChallenge}
                onCloseChallengeHub={() => setChallengeHubOpen(false)}
                onCreatePersonalChallenge={handleCreatePersonalChallenge}
                onOpenPersonalChallenge={handleOpenPersonalChallenge}
                onTeacherChallengesUpdated={loadChallenges}
                onTeacherChallengeRewardGranted={queueChallengeRewardScene}
                selectedPersonalChallenge={selectedPersonalChallenge}
                onClosePersonalChallenge={closeSelectedPersonalChallenge}
                onEditPersonalChallenge={handleEditPersonalChallenge}
                onEndPersonalChallenge={handleEndPersonalChallenge}
                onPromptDeletePersonalChallenge={handlePromptDeletePersonalChallenge}
                onRetryPersonalChallenge={handleRetryPersonalChallenge}
                personalChallengeDeleteOpen={personalChallengeDeleteOpen}
                deletingPersonalChallenge={deletingPersonalChallenge}
                onClosePersonalChallengeDelete={closePersonalChallengeDelete}
                onDeletePersonalChallenge={handleDeletePersonalChallenge}
                personalFormOpen={personalFormOpen}
                personalChallengeFormMember={personalChallengeFormMember}
                editingPersonalChallenge={editingPersonalChallenge}
                personalChallengeSeed={personalChallengeSeed}
                onClosePersonalChallengeForm={closePersonalChallengeForm}
                onPersonalChallengeSaved={handlePersonalChallengeSaved}
                menuBrowserOpen={menuBrowserOpen}
                onCloseMenuBrowser={() => setMenuBrowserOpen(false)}
                exerciseBrowserOpen={exerciseBrowserOpen}
                onCloseExerciseBrowser={() => setExerciseBrowserOpen(false)}
                selectedTeacherMenu={selectedTeacherMenu}
                teacherMenuExerciseMap={teacherMenuExerciseMap}
                onCloseTeacherMenu={() => setSelectedTeacherMenu(null)}
                onOpenMenuTab={openMenuGroupTab}
                onOpenExerciseTab={openMenuIndividualTab}
                onCreatePersonalChallengeFromTeacherMenu={canCreatePersonalChallenge ? handleCreatePersonalChallengeFromTeacherMenu : undefined}
                onStartTeacherMenu={(menu) => {
                    startSessionWithExercises(menu.exerciseIds, {
                        sourceMenuId: menu.id,
                        sourceMenuSource: 'teacher',
                        sourceMenuName: menu.name,
                    });
                }}
                selectedTeacherExercise={selectedTeacherExercise}
                onCloseTeacherExercise={() => setSelectedTeacherExercise(null)}
                onCreatePersonalChallengeFromTeacherExercise={canCreatePersonalChallenge ? handleCreatePersonalChallengeFromTeacherExercise : undefined}
                onStartTeacherExercise={(exercise) => {
                    startSessionWithExercises([exercise.id]);
                }}
                selectedPublicMenu={selectedPublicMenu}
                onClosePublicMenu={() => setSelectedPublicMenu(null)}
                onImportedPublicMenu={() => {
                    void loadCustomChallengeTargets();
                }}
                onCreatePersonalChallengeFromPublicMenu={handleCreatePersonalChallengeFromPublicMenu}
                onTryPublicMenu={(menu, metadata) => {
                    setSelectedPublicMenu(null);
                    startSessionWithPlan(resolvePublicMenuToSessionPlannedItems(menu), {
                        sourceMenuId: metadata.menuId,
                        sourceMenuSource: metadata.menuSource,
                        sourceMenuName: metadata.menuName,
                    });
                }}
                selectedPublicExercise={selectedPublicExercise}
                onClosePublicExercise={() => setSelectedPublicExercise(null)}
                onImportedPublicExercise={() => {
                    void loadCustomChallengeTargets();
                }}
                onCreatePersonalChallengeFromPublicExercise={handleCreatePersonalChallengeFromPublicExercise}
                onTryPublicExercise={(exerciseId) => {
                    setSelectedPublicExercise(null);
                    startSessionWithExercises([exerciseId]);
                }}
            />

        </div>
    );
};
