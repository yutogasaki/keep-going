import React, { useCallback, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { getAllSessions, getTodayKey, type SessionRecord } from '../lib/db';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { useAppStore } from '../store/useAppStore';
import { calculateFuwafuwaStatus } from '../lib/fuwafuwa';
import { audio } from '../lib/audio';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { MenuDetailSheet } from '../components/MenuDetailSheet';
import { type PublicMenu } from '../lib/publicMenus';
import {
    fetchActiveChallenges,
    fetchPastChallenges,
    fetchMyCompletions,
    type Challenge,
    type ChallengeCompletion,
} from '../lib/challenges';
import { HomeMilestoneModal } from './home/HomeMilestoneModal';
import { HomeAnimatedBackground } from './home/HomeAnimatedBackground';
import { FuwafuwaHomeCard } from './home/FuwafuwaHomeCard';
import { HomeChallengesAndMenus } from './home/HomeChallengesAndMenus';
import type { PerUserMagic, SwipePage } from './home/types';

export const HomeScreen: React.FC = () => {
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const updateUser = useAppStore((state) => state.updateUser);
    const activeMilestoneModal = useAppStore((state) => state.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore((state) => state.setActiveMilestoneModal);

    const consumeUserMagicEnergy = useAppStore((state) => state.consumeUserMagicEnergy);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
    const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
    const [pastExpanded, setPastExpanded] = useState(false);
    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);

    const loadChallenges = useCallback(() => {
        fetchActiveChallenges().then(setChallenges).catch(console.warn);
        fetchPastChallenges().then(setPastChallenges).catch(console.warn);
        fetchMyCompletions().then(setCompletions).catch(console.warn);
    }, []);

    const filteredChallenges = useMemo(() => {
        const activeClassLevels = new Set<string>();
        for (const userId of sessionUserIds) {
            const user = users.find((targetUser) => targetUser.id === userId);
            if (user?.classLevel) {
                activeClassLevels.add(user.classLevel);
            }
        }
        return challenges.filter((challenge) =>
            challenge.classLevels.length === 0 || challenge.classLevels.some((classLevel) => activeClassLevels.has(classLevel))
        );
    }, [challenges, sessionUserIds, users]);

    useEffect(() => {
        loadChallenges();
    }, [loadChallenges]);

    const todayStr = getTodayKey();
    const isTogetherMode = sessionUserIds.length > 1;
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);

    const todaySessions = useMemo(
        () =>
            allSessions.filter((session) => {
                if (session.date !== todayStr) {
                    return false;
                }
                if (isTogetherMode) {
                    return !session.userIds || session.userIds.some((id) => sessionUserIdSet.has(id));
                }
                return !session.userIds || session.userIds.includes(sessionUserIds[0]);
            }),
        [allSessions, todayStr, isTogetherMode, sessionUserIdSet, sessionUserIds],
    );

    const todaySeconds = todaySessions.reduce((acc, current) => acc + current.totalSeconds, 0);

    const activeUsers = users.filter((user) => sessionUserIds.includes(user.id));
    const singleUserTargetMinutes =
        activeUsers.length > 0
            ? (activeUsers[0].dailyTargetMinutes || 10)
            : (users.length > 0 ? (users[0].dailyTargetMinutes || 10) : 10);

    const targetSeconds = singleUserTargetMinutes * 60;

    const perUserMagic = useMemo<PerUserMagic[]>(() => {
        return activeUsers.map((user) => {
            const userSessions = allSessions.filter((session) => {
                if (session.date !== todayStr) {
                    return false;
                }
                return !session.userIds || session.userIds.includes(user.id);
            });
            const trained = userSessions.reduce((acc, session) => acc + session.totalSeconds, 0);
            const consumed = user.consumedMagicDate === todayStr ? (user.consumedMagicSeconds || 0) : 0;
            const userTarget = (user.dailyTargetMinutes || 10) * 60;
            return {
                userId: user.id,
                userName: user.name,
                displaySeconds: Math.max(0, trained - consumed),
                targetSeconds: userTarget,
            };
        });
    }, [activeUsers, allSessions, todayStr]);

    const consumedSeconds = activeUsers.reduce((sum, user) => {
        if (user.consumedMagicDate === todayStr) {
            return sum + (user.consumedMagicSeconds || 0);
        }
        return sum;
    }, 0);

    const displaySeconds = Math.max(0, todaySeconds - consumedSeconds);

    const handleTankReset = () => {
        if (displaySeconds < targetSeconds) {
            return;
        }

        activeUsers.forEach((user) => {
            const userTarget = (user.dailyTargetMinutes || 10) * 60;
            consumeUserMagicEnergy(user.id, userTarget, todayStr);
        });

        const duration = 3000;
        const end = Date.now() + duration;

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
        audio.playSuccess();
    };

    useEffect(() => {
        const load = () => {
            getAllSessions()
                .then((sessions) => {
                    setAllSessions(sessions);
                })
                .catch(console.warn);
        };

        load();

        let interval = setInterval(load, 5000);
        const handleVisibility = () => {
            clearInterval(interval);
            if (document.visibilityState === 'visible') {
                load();
                interval = setInterval(load, 5000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    useEffect(() => {
        if (allSessions.length === 0 || users.length === 0) {
            return;
        }

        let shouldTriggerModal: 'egg' | 'fairy' | 'adult' | null = null;

        users.forEach((user) => {
            if (!user.fuwafuwaBirthDate) {
                return;
            }

            const status = calculateFuwafuwaStatus(user.fuwafuwaBirthDate, allSessions);
            const currentStage = status.stage;

            if (!status.isSayonara && !(user.notifiedFuwafuwaStages || []).includes(currentStage)) {
                updateUser(user.id, { notifiedFuwafuwaStages: [...(user.notifiedFuwafuwaStages || []), currentStage] });
                if (currentStage === 1) {
                    shouldTriggerModal = 'egg';
                } else if (currentStage === 2) {
                    shouldTriggerModal = 'fairy';
                } else if (currentStage === 3) {
                    shouldTriggerModal = 'adult';
                }
            }
        });

        if (shouldTriggerModal) {
            setActiveMilestoneModal(shouldTriggerModal);
        }
    }, [allSessions, users, updateUser, setActiveMilestoneModal]);

    const swipePages = useMemo<SwipePage[]>(() => {
        const pages: SwipePage[] = users.map((user) => ({
            kind: 'user',
            id: user.id,
            name: user.name,
            user,
        }));

        if (users.length >= 2) {
            pages.push({ kind: 'together', id: 'TOGETHER', name: 'みんなで！' });
        }

        return pages;
    }, [users]);

    const currentPageIndex = useMemo(() => {
        if (swipePages.length === 0) {
            return 0;
        }

        if (sessionUserIds.length > 1) {
            const index = swipePages.findIndex((page) => page.kind === 'together');
            return index === -1 ? 0 : index;
        }

        if (sessionUserIds.length === 1) {
            const index = swipePages.findIndex(
                (page) => page.kind === 'user' && page.user.id === sessionUserIds[0],
            );
            return index === -1 ? 0 : index;
        }

        return 0;
    }, [sessionUserIds, swipePages]);

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

    const handleDragEnd = useCallback(
        (_event: unknown, info: { offset: { x: number } }) => {
            const threshold = 50;
            let newIndex = currentPageIndex;

            if (info.offset.x < -threshold && currentPageIndex < swipePages.length - 1) {
                newIndex = currentPageIndex + 1;
            } else if (info.offset.x > threshold && currentPageIndex > 0) {
                newIndex = currentPageIndex - 1;
            }

            if (newIndex !== currentPageIndex) {
                const page = swipePages[newIndex];
                if (page.kind === 'together') {
                    setSessionUserIds(users.map((user) => user.id));
                } else {
                    setSessionUserIds([page.user.id]);
                }
            }
        },
        [currentPageIndex, swipePages, users, setSessionUserIds],
    );

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
            <PageHeader
                title="ホーム"
                rightElement={<CurrentContextBadge />}
            />

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
                    swipePages={swipePages}
                    currentPageIndex={currentPageIndex}
                    onDragEnd={handleDragEnd}
                    users={users}
                    allSessions={allSessions}
                />

                <HomeChallengesAndMenus
                    filteredChallenges={filteredChallenges}
                    pastChallenges={pastChallenges}
                    completions={completions}
                    pastExpanded={pastExpanded}
                    onTogglePastExpanded={() => setPastExpanded((previous) => !previous)}
                    onChallengesUpdated={loadChallenges}
                    onOpenMenuBrowser={() => setMenuBrowserOpen(true)}
                    onMenuTap={setSelectedPublicMenu}
                />
            </div>

            <PublicMenuBrowser
                open={menuBrowserOpen}
                onClose={() => setMenuBrowserOpen(false)}
            />

            <MenuDetailSheet
                menu={selectedPublicMenu}
                onClose={() => setSelectedPublicMenu(null)}
                onTry={(exerciseIds) => {
                    setSelectedPublicMenu(null);
                    startSessionWithExercises(exerciseIds);
                }}
            />
        </div>
    );
};
