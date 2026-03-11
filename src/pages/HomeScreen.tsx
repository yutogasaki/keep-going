import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const lazyConfetti = () => import('canvas-confetti').then((m) => m.default);
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { PublicExerciseBrowser } from '../components/PublicExerciseBrowser';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { MenuDetailSheet } from '../components/MenuDetailSheet';
import { EXERCISES } from '../data/exercises';
import type { ExercisePlacement } from '../data/exercisePlacement';
import type { PublicExercise } from '../lib/publicExercises';
import type { PublicMenu } from '../lib/publicMenus';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import { audio } from '../lib/audio';
import { pickTeacherContentHighlights } from '../lib/teacherExerciseMetadata';
import { useAppStore } from '../store/useAppStore';
import type { FuwafuwaMilestoneEvent } from '../store/useAppStore';
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
    type HomeAfterglow,
} from './home/homeAfterglow';
import { pickHomeAnnouncement } from './home/homeAnnouncementUtils';
import {
    getFamilyVisitMemoryKey,
    getHomeVisitRecency,
    type HomeVisitRecency,
} from './home/homeVisitMemory';
import { useHomeChallenges } from './home/hooks/useHomeChallenges';
import { useHomeSessions } from './home/hooks/useHomeSessions';
import { useHomePublicDiscovery } from './home/hooks/useHomePublicDiscovery';
import {
    getMilestoneStage,
    useHomeMilestoneWatcher,
} from './home/hooks/useHomeMilestoneWatcher';
import { pickTeacherExerciseDiscovery } from './home/homeMenuUtils';
import { getMinClassLevel } from './menu/menuPageUtils';

const noop = () => {};

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

    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [exerciseBrowserOpen, setExerciseBrowserOpen] = useState(false);
    const [pendingMilestoneEvents, setPendingMilestoneEvents] = useState<FuwafuwaMilestoneEvent[]>([]);
    const [recentMilestoneEvent, setRecentMilestoneEvent] = useState<FuwafuwaMilestoneEvent | null>(null);
    const [recentAfterglow, setRecentAfterglow] = useState<HomeAfterglow | null>(null);
    const [selectedUserVisitRecency, setSelectedUserVisitRecency] = useState<HomeVisitRecency>('first');
    const [familyVisitRecency, setFamilyVisitRecency] = useState<HomeVisitRecency>('first');
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);
    const [selectedPublicExercise, setSelectedPublicExercise] = useState<PublicExercise | null>(null);
    const [selectedTeacherMenu, setSelectedTeacherMenu] = useState<TeacherMenu | null>(null);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState<TeacherExercise | null>(null);
    const lastSoloVisitKeyRef = useRef('');
    const lastFamilyVisitKeyRef = useRef('');

    const { allSessions, activeUsers, targetSeconds, perUserMagic, displaySeconds } = useHomeSessions({
        users,
        sessionUserIds,
    });
    const {
        recommendedMenus,
        recommendedExercises,
        ambientCue,
    } = useHomePublicDiscovery();

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
    const activeMilestoneUser = useMemo(
        () => activeMilestoneModal
            ? users.find((user) => user.id === activeMilestoneModal.userId) ?? null
            : null,
        [activeMilestoneModal, users],
    );
    const pendingMilestoneEventsByUserId = useMemo(
        () => new Map(
            pendingMilestoneEvents.map((event) => [event.userId, event]),
        ),
        [pendingMilestoneEvents],
    );
    const teacherContent = useTeacherContent({
        classLevel: currentClassLevel,
        onLoadError: noop,
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

    const queueMilestoneEvent = useCallback((event: FuwafuwaMilestoneEvent) => {
        setPendingMilestoneEvents((current) => (
            current.some((item) => item.userId === event.userId && item.kind === event.kind)
                ? current
                : [...current, event]
        ));
    }, []);

    const hasKnownMilestoneEvent = useCallback((event: FuwafuwaMilestoneEvent) => (
        pendingMilestoneEvents.some((item) => item.userId === event.userId && item.kind === event.kind)
        || (activeMilestoneModal?.userId === event.userId && activeMilestoneModal.kind === event.kind)
    ), [activeMilestoneModal, pendingMilestoneEvents]);

    useHomeMilestoneWatcher({
        allSessions,
        hasKnownMilestoneEvent,
        queueMilestoneEvent,
        users,
    });

    useEffect(() => {
        const validUserIds = new Set(users.map((user) => user.id));
        setPendingMilestoneEvents((current) => current.filter((event) => validUserIds.has(event.userId)));
    }, [users]);

    useEffect(() => {
        if (!recentMilestoneEvent) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRecentMilestoneEvent((current) => (
                current?.userId === recentMilestoneEvent.userId && current.kind === recentMilestoneEvent.kind
                    ? null
                    : current
            ));
        }, 12000);

        return () => window.clearTimeout(timerId);
    }, [recentMilestoneEvent]);

    useEffect(() => {
        if (!recentAfterglow) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRecentAfterglow((current) => (
                current?.kind === recentAfterglow.kind && current.contextKey === recentAfterglow.contextKey
                    ? null
                    : current
            ));
        }, 10000);

        return () => window.clearTimeout(timerId);
    }, [recentAfterglow]);

    useEffect(() => {
        if (isTogetherMode || !selectedUser) {
            lastSoloVisitKeyRef.current = '';
            setSelectedUserVisitRecency('first');
            return;
        }

        const visitKey = selectedUser.id;
        if (lastSoloVisitKeyRef.current === visitKey) {
            return;
        }

        lastSoloVisitKeyRef.current = visitKey;
        setSelectedUserVisitRecency(
            getHomeVisitRecency(homeVisitMemory.soloByUserId[visitKey] ?? null),
        );
        markSoloHomeVisit(visitKey, new Date().toISOString());
    }, [homeVisitMemory.soloByUserId, isTogetherMode, markSoloHomeVisit, selectedUser]);

    useEffect(() => {
        if (!isTogetherMode || familyVisitKey.length === 0) {
            lastFamilyVisitKeyRef.current = '';
            setFamilyVisitRecency('first');
            return;
        }

        if (lastFamilyVisitKeyRef.current === familyVisitKey) {
            return;
        }

        lastFamilyVisitKeyRef.current = familyVisitKey;
        setFamilyVisitRecency(
            getHomeVisitRecency(homeVisitMemory.familyByUserSet[familyVisitKey] ?? null),
        );
        markFamilyHomeVisit(currentUsers.map((user) => user.id), new Date().toISOString());
    }, [currentUsers, familyVisitKey, homeVisitMemory.familyByUserSet, isTogetherMode, markFamilyHomeVisit]);

    useEffect(() => {
        if (isTogetherMode || !selectedUser || activeMilestoneModal) {
            return;
        }

        const nextEvent = pendingMilestoneEvents.find((event) => event.userId === selectedUser.id);
        if (!nextEvent) {
            return;
        }

        setPendingMilestoneEvents((current) => current.filter(
            (event) => !(event.userId === nextEvent.userId && event.kind === nextEvent.kind),
        ));
        setActiveMilestoneModal(nextEvent);
    }, [activeMilestoneModal, isTogetherMode, pendingMilestoneEvents, selectedUser, setActiveMilestoneModal]);

    const handleMilestoneModalClose = useCallback(() => {
        if (activeMilestoneModal?.source === 'system' && activeMilestoneUser) {
            const stage = getMilestoneStage(activeMilestoneModal.kind);
            if (!(activeMilestoneUser.notifiedFuwafuwaStages || []).includes(stage)) {
                updateUser(activeMilestoneUser.id, {
                    notifiedFuwafuwaStages: [...(activeMilestoneUser.notifiedFuwafuwaStages || []), stage],
                });
            }
        }

        if (activeMilestoneModal) {
            setRecentMilestoneEvent(activeMilestoneModal);
        }
        setActiveMilestoneModal(null);
    }, [activeMilestoneModal, activeMilestoneUser, setActiveMilestoneModal, updateUser]);

    useEffect(() => {
        if (
            currentTab === 'menu'
            && homeAnnouncement
            && (homeAnnouncement.kind === 'teacher_menu' || homeAnnouncement.kind === 'teacher_exercise')
        ) {
            dismissHomeAnnouncement(homeAnnouncement.id);
        }
    }, [currentTab, dismissHomeAnnouncement, homeAnnouncement]);

    const handleTankReset = () => {
        if (displaySeconds < targetSeconds) {
            return;
        }

        if (currentHomeContextKey) {
            setRecentAfterglow({
                kind: 'magic_delivery',
                contextKey: currentHomeContextKey,
            });
        }

        activeUsers.forEach((user) => {
            const userTarget = (user.dailyTargetMinutes || 10) * 60;
            consumeUserMagicEnergy(user.id, userTarget);
        });

        const duration = 3000;
        const end = Date.now() + duration;

        lazyConfetti().then((confetti) => {
            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        });
        audio.playSuccess();
    };

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
            <PageHeader title="ホーム" rightElement={<CurrentContextBadge />} />

            <HomeMilestoneModal
                activeMilestoneModal={activeMilestoneModal}
                user={activeMilestoneUser}
                onClose={handleMilestoneModalClose}
            />

            <HomeAnimatedBackground />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    flex: 1,
                    paddingTop: 12,
                    paddingBottom: 90,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <FuwafuwaHomeCard
                    isTogetherMode={isTogetherMode}
                    perUserMagic={perUserMagic}
                    displaySeconds={displaySeconds}
                    targetSeconds={targetSeconds}
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

                        setTab('menu');
                    }}
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
            </div>

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
