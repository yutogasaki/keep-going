import React, { useMemo } from 'react';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { PublicExerciseBrowser } from '../components/PublicExerciseBrowser';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { MenuDetailSheet } from '../components/MenuDetailSheet';
import { EXERCISES } from '../data/exercises';
import type { ExercisePlacement } from '../data/exercisePlacement';
import { pickTeacherContentHighlights } from '../lib/teacherExerciseMetadata';
import { useAppStore } from '../store/useAppStore';
import { useTeacherContent } from '../hooks/useTeacherContent';
import { HomeMilestoneModal } from './home/HomeMilestoneModal';
import { HomeAnimatedBackground } from './home/HomeAnimatedBackground';
import { FuwafuwaHomeCard } from './home/FuwafuwaHomeCard';
import { HomeChallengesAndMenus } from './home/HomeChallengesAndMenus';
import { TeacherExerciseDetailSheet } from './home/TeacherExerciseDetailSheet';
import { TeacherMenuDetailSheet } from './home/TeacherMenuDetailSheet';
import {
    getFamilyHomeContextKey,
    getSoloHomeContextKey,
} from './home/homeAfterglow';
import { pickHomeAnnouncement } from './home/homeAnnouncementUtils';
import {
    getFamilyVisitMemoryKey,
} from './home/homeVisitMemory';
import { useHomeChallenges } from './home/hooks/useHomeChallenges';
import { useHomeSessions } from './home/hooks/useHomeSessions';
import { useHomePublicDiscovery } from './home/hooks/useHomePublicDiscovery';
import {
    useHomeMilestoneWatcher,
} from './home/hooks/useHomeMilestoneWatcher';
import { useHomeScreenState } from './home/hooks/useHomeScreenState';
import { pickTeacherExerciseDiscovery } from './home/homeMenuUtils';
import { getMinClassLevel } from './menu/menuPageUtils';

export const HomeScreen: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const setTab = useAppStore((state) => state.setTab);
    const updateUser = useAppStore((state) => state.updateUser);
    const activeMilestoneModal = useAppStore((state) => state.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore((state) => state.setActiveMilestoneModal);
    const consumeUserMagicEnergy = useAppStore((state) => state.consumeUserMagicEnergy);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);
    const dismissedHomeAnnouncementIds = useAppStore((state) => state.dismissedHomeAnnouncementIds);
    const dismissHomeAnnouncement = useAppStore((state) => state.dismissHomeAnnouncement);
    const homeVisitMemory = useAppStore((state) => state.homeVisitMemory);
    const markSoloHomeVisit = useAppStore((state) => state.markSoloHomeVisit);
    const markFamilyHomeVisit = useAppStore((state) => state.markFamilyHomeVisit);
    const currentTab = useAppStore((state) => state.currentTab);

    const { allSessions, activeUsers, targetSeconds, perUserMagic, displaySeconds } = useHomeSessions({
        users,
        sessionUserIds,
    });
    const {
        recommendedMenus,
        recommendedExercises,
        ambientCue,
    } = useHomePublicDiscovery();

    const isTogetherMode = sessionUserIds.length > 1;
    const currentUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
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
    const teacherContent = useTeacherContent({
        classLevel: currentClassLevel,
        onLoadError: () => {},
    });
    const teacherMenuHighlights = useMemo(
        () => pickTeacherContentHighlights(
            teacherContent.teacherMenus.filter((menu) => menu.displayMode === 'teacher_section'),
            2,
        ),
        [teacherContent.teacherMenus],
    );
    const teacherExerciseHighlight = useMemo(
        () => pickTeacherExerciseDiscovery(teacherContent.teacherExercises),
        [teacherContent.teacherExercises],
    );
    const teacherMenuExerciseMap = useMemo(() => {
        const map = new Map<string, {
            name: string;
            emoji: string;
            sec: number;
            placement: ExercisePlacement;
        }>();
        for (const exercise of EXERCISES) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }
        for (const exercise of teacherContent.teacherExercises) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }
        return map;
    }, [teacherContent.teacherExercises]);

    const {
        filteredChallenges,
        pastChallenges,
        completions,
        teacherExercises,
        pastExpanded,
        setPastExpanded,
        loadChallenges,
    } = useHomeChallenges({
        users,
        sessionUserIds,
    });
    const activeAnnouncementUserIds = useMemo(
        () => (currentUsers.length > 0 ? currentUsers.map((user) => user.id) : sessionUserIds),
        [currentUsers, sessionUserIds],
    );
    const homeAnnouncement = useMemo(
        () => pickHomeAnnouncement({
            activeUserIds: activeAnnouncementUserIds,
            challenges: filteredChallenges,
            joinedChallengeIds,
            dismissedAnnouncementIds: dismissedHomeAnnouncementIds,
            teacherMenuHighlights,
            teacherExerciseHighlight,
            isNewTeacherContent: teacherContent.isNewTeacherContent,
        }),
        [
            activeAnnouncementUserIds,
            dismissedHomeAnnouncementIds,
            filteredChallenges,
            joinedChallengeIds,
            teacherContent.isNewTeacherContent,
            teacherExerciseHighlight,
            teacherMenuHighlights,
        ],
    );
    const {
        activeMagicDeliveryContextKey,
        activeMilestoneUser,
        exerciseBrowserOpen,
        familyVisitRecency,
        handleAnnouncementAction,
        handleMilestoneModalClose,
        handleTankReset,
        hasKnownMilestoneEvent,
        menuBrowserOpen,
        pendingMilestoneEventsByUserId,
        queueMilestoneEvent,
        recentAfterglow,
        recentMilestoneEvent,
        selectedPublicExercise,
        selectedPublicMenu,
        selectedTeacherExercise,
        selectedTeacherMenu,
        selectedUserVisitRecency,
        setExerciseBrowserOpen,
        setMenuBrowserOpen,
        setSelectedPublicExercise,
        setSelectedPublicMenu,
        setSelectedTeacherExercise,
        setSelectedTeacherMenu,
    } = useHomeScreenState({
        users,
        sessionUserIds,
        setSessionUserIds,
        currentUsers,
        activeUsers,
        selectedUser,
        currentTab,
        setTab,
        updateUser,
        activeMilestoneModal,
        setActiveMilestoneModal,
        consumeUserMagicEnergy,
        displaySeconds,
        targetSeconds,
        currentHomeContextKey,
        homeVisitMemory,
        markSoloHomeVisit,
        markFamilyHomeVisit,
        familyVisitKey,
        isTogetherMode,
        homeAnnouncement,
        dismissHomeAnnouncement,
    });

    useHomeMilestoneWatcher({
        allSessions,
        hasKnownMilestoneEvent,
        queueMilestoneEvent,
        users,
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
            <HomeMilestoneModal
                activeMilestoneModal={activeMilestoneModal}
                user={activeMilestoneUser}
                onClose={handleMilestoneModalClose}
            />

            <HomeAnimatedBackground />

            <ScreenScaffold
                header={<PageHeader title="ホーム" rightElement={<CurrentContextBadge />} />}
                withBottomNav
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
                    onAnnouncementAction={handleAnnouncementAction}
                />

                <HomeChallengesAndMenus
                    filteredChallenges={filteredChallenges}
                    pastChallenges={pastChallenges}
                    completions={completions}
                    recommendedMenus={recommendedMenus}
                    recommendedExercises={recommendedExercises}
                    teacherExercises={teacherExercises}
                    teacherMenuHighlights={teacherMenuHighlights}
                    teacherExerciseHighlight={teacherExerciseHighlight}
                    teacherMenuExerciseMap={teacherMenuExerciseMap}
                    isNewTeacherContent={teacherContent.isNewTeacherContent}
                    pastExpanded={pastExpanded}
                    onTogglePastExpanded={() => setPastExpanded((previous) => !previous)}
                    onChallengesUpdated={loadChallenges}
                    onOpenMenuBrowser={() => setMenuBrowserOpen(true)}
                    onOpenExerciseBrowser={() => setExerciseBrowserOpen(true)}
                    onOpenMenuTab={() => setTab('menu')}
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

            <PublicMenuBrowser
                open={menuBrowserOpen}
                onClose={() => setMenuBrowserOpen(false)}
            />

            <TeacherMenuDetailSheet
                menu={selectedTeacherMenu}
                exerciseMap={teacherMenuExerciseMap}
                onClose={() => setSelectedTeacherMenu(null)}
                onOpenMenuTab={() => setTab('menu')}
                onStart={(menu) => {
                    startSessionWithExercises(menu.exerciseIds, {
                        sourceMenuId: menu.id,
                        sourceMenuSource: 'teacher',
                        sourceMenuName: menu.name,
                    });
                }}
            />

            <TeacherExerciseDetailSheet
                exercise={selectedTeacherExercise}
                onClose={() => setSelectedTeacherExercise(null)}
                onOpenMenuTab={() => setTab('menu')}
                onStart={(exercise) => {
                    startSessionWithExercises([exercise.id]);
                }}
            />

            <PublicExerciseBrowser
                open={exerciseBrowserOpen}
                onClose={() => setExerciseBrowserOpen(false)}
            />

            <MenuDetailSheet
                menu={selectedPublicMenu}
                onClose={() => setSelectedPublicMenu(null)}
                onTry={(exerciseIds, metadata) => {
                    setSelectedPublicMenu(null);
                    startSessionWithExercises(exerciseIds, {
                        sourceMenuId: metadata.menuId,
                        sourceMenuSource: metadata.menuSource,
                        sourceMenuName: metadata.menuName,
                    });
                }}
            />

            <ExerciseDetailSheet
                exercise={selectedPublicExercise}
                onClose={() => setSelectedPublicExercise(null)}
                onTry={(exerciseId) => {
                    setSelectedPublicExercise(null);
                    startSessionWithExercises([exerciseId]);
                }}
            />
        </div>
    );
};
