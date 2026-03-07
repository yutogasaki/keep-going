import React, { useEffect, useMemo, useState } from 'react';
const lazyConfetti = () => import('canvas-confetti').then((m) => m.default);
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { MenuDetailSheet } from '../components/MenuDetailSheet';
import type { PublicMenu } from '../lib/publicMenus';
import { audio } from '../lib/audio';
import { useAppStore } from '../store/useAppStore';
import { HomeMilestoneModal } from './home/HomeMilestoneModal';
import { HomeAnimatedBackground } from './home/HomeAnimatedBackground';
import { FuwafuwaHomeCard } from './home/FuwafuwaHomeCard';
import { HomeChallengesAndMenus } from './home/HomeChallengesAndMenus';
import { useHomeChallenges } from './home/hooks/useHomeChallenges';
import { useHomeSessions } from './home/hooks/useHomeSessions';
import { useHomeMilestoneWatcher } from './home/hooks/useHomeMilestoneWatcher';

export const HomeScreen: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const updateUser = useAppStore((state) => state.updateUser);
    const activeMilestoneModal = useAppStore((state) => state.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore((state) => state.setActiveMilestoneModal);
    const consumeUserMagicEnergy = useAppStore((state) => state.consumeUserMagicEnergy);
    const startSessionWithExercises = useAppStore((state) => state.startSessionWithExercises);

    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);

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
    const selectedUser = useMemo(
        () => activeUsers[0] ?? users.find((user) => user.id === sessionUserIds[0]) ?? null,
        [activeUsers, sessionUserIds, users],
    );

    const {
        filteredChallenges,
        pastChallenges,
        completions,
        pastExpanded,
        setPastExpanded,
        loadChallenges,
    } = useHomeChallenges({
        users,
        sessionUserIds,
    });

    useHomeMilestoneWatcher({
        allSessions,
        users,
        updateUser,
        setActiveMilestoneModal,
    });

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
