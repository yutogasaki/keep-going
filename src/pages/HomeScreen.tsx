import React, { useEffect, useMemo, useState } from 'react';
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
import { useTeacherContent } from '../hooks/useTeacherContent';
import { HomeMilestoneModal } from './home/HomeMilestoneModal';
import { HomeAnimatedBackground } from './home/HomeAnimatedBackground';
import { FuwafuwaHomeCard } from './home/FuwafuwaHomeCard';
import { HomeChallengesAndMenus } from './home/HomeChallengesAndMenus';
import { TeacherExerciseDetailSheet } from './home/TeacherExerciseDetailSheet';
import { TeacherMenuDetailSheet } from './home/TeacherMenuDetailSheet';
import { pickHomeAnnouncement } from './home/homeAnnouncementUtils';
import { useHomeChallenges } from './home/hooks/useHomeChallenges';
import { useHomeSessions } from './home/hooks/useHomeSessions';
import { useHomeMilestoneWatcher } from './home/hooks/useHomeMilestoneWatcher';
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
    const currentTab = useAppStore((state) => state.currentTab);

    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [exerciseBrowserOpen, setExerciseBrowserOpen] = useState(false);
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);
    const [selectedPublicExercise, setSelectedPublicExercise] = useState<PublicExercise | null>(null);
    const [selectedTeacherMenu, setSelectedTeacherMenu] = useState<TeacherMenu | null>(null);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState<TeacherExercise | null>(null);

    const { allSessions, activeUsers, targetSeconds, perUserMagic, displaySeconds } = useHomeSessions({
        users,
        sessionUserIds,
    });

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

    useHomeMilestoneWatcher({
        allSessions,
        users,
        updateUser,
        setActiveMilestoneModal,
    });

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
                onClose={() => setActiveMilestoneModal(null)}
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
                    onSelectUser={(userId) => setSessionUserIds([userId])}
                    announcement={homeAnnouncement}
                    onAnnouncementAction={() => {
                        if (!homeAnnouncement) {
                            return;
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
