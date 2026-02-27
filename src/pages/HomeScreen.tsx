import React, { useEffect, useMemo, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSessions, getTodayKey, type SessionRecord } from '../lib/db';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { FuwafuwaCharacter } from '../components/FuwafuwaCharacter';
import { MagicTank } from '../components/MagicTank';
import { useAppStore, type UserProfileStore } from '../store/useAppStore';
import { calculateFuwafuwaStatus } from '../lib/fuwafuwa';
import { audio } from '../lib/audio';
import { UserAvatar } from '../components/UserAvatar';
import { ChallengeCard } from '../components/ChallengeCard';
import { PopularMenusRow } from '../components/PopularMenusRow';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { fetchActiveChallenges, fetchMyCompletions, type Challenge, type ChallengeCompletion } from '../lib/challenges';

type SwipePage =
    | { kind: 'user'; id: string; name: string; user: UserProfileStore }
    | { kind: 'together'; id: 'TOGETHER'; name: 'みんなで！' };

export const HomeScreen: React.FC = () => {
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

    const users = useAppStore(s => s.users);
    const sessionUserIds = useAppStore(s => s.sessionUserIds);
    const setSessionUserIds = useAppStore(s => s.setSessionUserIds);
    const updateUser = useAppStore(s => s.updateUser);
    const activeMilestoneModal = useAppStore(s => s.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore(s => s.setActiveMilestoneModal);

    const consumeUserMagicEnergy = useAppStore(s => s.consumeUserMagicEnergy);
    const startSessionWithExercises = useAppStore(s => s.startSessionWithExercises);

    // Challenge & menu state
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);

    const loadChallenges = useCallback(() => {
        fetchActiveChallenges().then(setChallenges).catch(console.warn);
        fetchMyCompletions().then(setCompletions).catch(console.warn);
    }, []);

    useEffect(() => {
        loadChallenges();
    }, [loadChallenges]);

    // Calculate today's total trained seconds for the Magic Tank based on the CURRENT swipe selection (sessionUserIds)
    const todayStr = getTodayKey();
    const isTogetherMode = sessionUserIds.length > 1;
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);

    const todaySessions = allSessions.filter(s => {
        if (s.date !== todayStr) return false;
        // In together mode, sum ALL sessions that involve ANY of the users to show family total.
        // In individual mode, sum ONLY sessions that involve this specific user.
        if (isTogetherMode) {
            return !s.userIds || s.userIds.some(id => sessionUserIdSet.has(id));
        } else {
            return !s.userIds || s.userIds.includes(sessionUserIds[0]);
        }
    });
    const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.totalSeconds, 0);

    // Calculate total target time based on active session users
    const activeUsers = users.filter(u => sessionUserIds.includes(u.id));
    const totalTargetMinutes = activeUsers.reduce((sum, u) => sum + (u.dailyTargetMinutes || 10), 0);
    // If no users are selected yet but users exist, default to the first user's target (or 10 min)
    const fallbackTargetMinutes = users.length > 0 ? (users[0].dailyTargetMinutes || 10) : 10;

    const targetSeconds = (activeUsers.length > 0 ? totalTargetMinutes : fallbackTargetMinutes) * 60;

    // Calculate consumed seconds for today
    const consumedSeconds = activeUsers.reduce((sum, u) => {
        if (u.consumedMagicDate === todayStr) {
            return sum + (u.consumedMagicSeconds || 0);
        }
        return sum;
    }, 0);

    const displaySeconds = Math.max(0, todaySeconds - consumedSeconds);

    // Confetti logic for Magic Tank reset
    const handleTankReset = () => {
        // Only reset if we actually reached the target
        if (displaySeconds < targetSeconds) return;

        // Consume the energy 
        activeUsers.forEach(u => {
            // Give proportional consumption to each active user based on their own target, 
            // or just give all the consumption equally if simple? Actually `targetSeconds` is sum of all targets.
            // Simplified: just consume each user's target amount from them.
            const uTarget = (u.dailyTargetMinutes || 10) * 60;
            consumeUserMagicEnergy(u.id, uTarget, todayStr);
        });

        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'] // matches tank colors
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        // Let's also play a happy sound
        audio.playSuccess();
    };

    useEffect(() => {
        const load = () => {
            getAllSessions().then(sessions => {
                setAllSessions(sessions);
            }).catch(console.warn);
        };
        load();
        // Refresh every 5 seconds to pick up new sessions
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (allSessions.length === 0 || users.length === 0) return;

        let shouldTriggerModal: 'egg' | 'fairy' | 'adult' | null = null;

        users.forEach(user => {
            if (!user.fuwafuwaBirthDate) return;
            const status = calculateFuwafuwaStatus(user.fuwafuwaBirthDate, allSessions);
            const currentStage = status.stage;

            if (!status.isSayonara && !(user.notifiedFuwafuwaStages || []).includes(currentStage)) {
                updateUser(user.id, { notifiedFuwafuwaStages: [...(user.notifiedFuwafuwaStages || []), currentStage] });
                if (currentStage === 1) shouldTriggerModal = 'egg';
                else if (currentStage === 2) shouldTriggerModal = 'fairy';
                else if (currentStage === 3) shouldTriggerModal = 'adult';
            }
        });

        if (shouldTriggerModal) {
            setActiveMilestoneModal(shouldTriggerModal);
        }
    }, [allSessions, users, updateUser, setActiveMilestoneModal]);

    // Define the swipeable pages based on users
    const swipePages = useMemo<SwipePage[]>(() => {
        const pages: SwipePage[] = users.map(user => ({
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

    const [currentPageIndex, setCurrentPageIndex] = useState(() => {
        // Initialize to match sessionUserIds if possible (e.g. returning from Menu)
        if (sessionUserIds.length > 1) {
            const idx = swipePages.findIndex(p => p.kind === 'together');
            return Math.max(0, idx);
        } else if (sessionUserIds.length === 1) {
            const idx = swipePages.findIndex(p => p.kind === 'user' && p.user.id === sessionUserIds[0]);
            return Math.max(0, idx);
        }
        return 0;
    });


    // Sync sessionUserIds whenever swipe page changes
    useEffect(() => {
        if (swipePages.length === 0) return;
        const page = swipePages[currentPageIndex];
        if (!page) {
            // Safety fallback
            if (currentPageIndex !== 0) setCurrentPageIndex(0);
            return;
        }

        const nextSessionUserIds = page.kind === 'together'
            ? users.map(u => u.id)
            : [page.user.id];

        const unchanged =
            nextSessionUserIds.length === sessionUserIds.length &&
            nextSessionUserIds.every((id, idx) => id === sessionUserIds[idx]);

        if (!unchanged) {
            setSessionUserIds(nextSessionUserIds);
        }
    }, [currentPageIndex, swipePages, users, sessionUserIds, setSessionUserIds]);

    // Reverse sync: Update currentPageIndex when sessionUserIds change externally (e.g. from badge tap)
    useEffect(() => {
        if (swipePages.length === 0) return;

        let targetIndex = 0;
        if (sessionUserIds.length > 1) {
            targetIndex = swipePages.findIndex(p => p.kind === 'together');
        } else if (sessionUserIds.length === 1) {
            targetIndex = swipePages.findIndex(p => p.kind === 'user' && p.user.id === sessionUserIds[0]);
        }

        // Fallback to 0 if target user not found (e.g. deleted user, stale sessionUserIds)
        if (targetIndex === -1) targetIndex = 0;
        if (targetIndex !== currentPageIndex) {
            setCurrentPageIndex(targetIndex);
        }
    }, [sessionUserIds, swipePages, currentPageIndex]);

    const handleDragEnd = (_event: any, info: any) => {
        const threshold = 50; // pixels
        if (info.offset.x < -threshold && currentPageIndex < swipePages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        } else if (info.offset.x > threshold && currentPageIndex > 0) {
            setCurrentPageIndex(prev => prev - 1);
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
        }}>
            <PageHeader
                title="ホーム"
                rightElement={<CurrentContextBadge />}
            />

            {/* Pagination Dots (Top) */}
            <AnimatePresence>
                {activeMilestoneModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        padding: 24
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                                width: '100%',
                                maxWidth: 320,
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 16,
                                padding: 32,
                                background: 'white',
                                borderRadius: 24,
                                boxShadow: '0 16px 48px rgba(0,0,0,0.1)'
                            }}
                        >
                            <span style={{ fontSize: 64 }}>
                                {activeMilestoneModal === 'egg' ? '🥚' : activeMilestoneModal === 'fairy' ? '🧚' : '🌟'}
                            </span>
                            <h2 style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 24, margin: 0, color: '#2D3436' }}>
                                {activeMilestoneModal === 'egg' ? 'たまごが やってきた！' :
                                    activeMilestoneModal === 'fairy' ? 'たまごが かえった！' : 'おおきく そだったね！'}
                            </h2>
                            <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: '#8395A7', lineHeight: 1.6, margin: 0 }}>
                                {activeMilestoneModal === 'egg' ? 'これから、あなたと一緒に頑張るパートナーだよ。大切に育ててね！' :
                                    activeMilestoneModal === 'fairy' ? '毎日の頑張りで、妖精の姿になったよ！これからもよろしくね！' : '毎日の頑張りで、立派な大人の姿に成長したよ！ここまで続けてこれてすごいね！'}
                            </p>
                            <button
                                onClick={() => setActiveMilestoneModal(null)}
                                style={{
                                    marginTop: 16,
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: 99,
                                    border: 'none',
                                    background: '#2BBAA0',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                わかった！
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Premium Animated Background */}
            <motion.div
                animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at center, #ffffff 0%, #f0fdfa 40%, #e0f2fe 100%)',
                    backgroundSize: '200% 200%',
                    zIndex: 0,
                    opacity: 0.8
                }}
            />

            {/* Floating Orbs in Background */}
            <motion.div
                animate={{ y: [0, -20, 0], x: [0, 10, 0], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: '10%', left: '15%',
                    width: 250, height: 250, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(168, 230, 207, 0.3) 0%, transparent 70%)',
                    zIndex: 0, filter: 'blur(20px)'
                }}
            />
            <motion.div
                animate={{ y: [0, 30, 0], x: [0, -15, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                style={{
                    position: 'absolute', bottom: '20%', right: '10%',
                    width: 180, height: 180, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(186, 230, 253, 0.4) 0%, transparent 70%)',
                    zIndex: 0, filter: 'blur(15px)'
                }}
            />

            {/* Foreground Content */}
            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '100%',
                flex: 1,
                paddingTop: 'min(2vh, 16px)',
                paddingBottom: 90, // Ensure it clears the floating play button
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
            }}>
                {/* Magic Power Tank */}
                <div style={{ height: 'min(10vh, 100px)', display: 'flex', alignItems: 'flex-end', paddingBottom: 'min(1vh, 8px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <MagicTank
                            currentSeconds={displaySeconds}
                            maxSeconds={targetSeconds}
                            onReset={handleTankReset}
                        />
                    </motion.div>
                </div>

                {/* The Stars of the Show (Carousel) */}
                <div style={{ width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={handleDragEnd}
                        animate={{ x: `calc(-${currentPageIndex * 100}%)` }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{ display: 'flex', width: '100%', alignItems: 'center' }}
                    >
                        {swipePages.map((page, index) => {
                            const isTogetherPage = page.kind === 'together';
                            const renderUsers = isTogetherPage ? users : [page.user];

                            return (
                                <div key={page.id} style={{
                                    width: '100%',
                                    flexShrink: 0,
                                    padding: '0 20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'min(2vh, 16px)',
                                    opacity: currentPageIndex === index ? 1 : 0.5,
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    {/* User Name Badge */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        style={{
                                            background: 'rgba(255,255,255,0.85)',
                                            padding: '6px 16px',
                                            borderRadius: 20,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            fontWeight: 700,
                                            color: '#2D3436',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                            marginBottom: '1vh',
                                            backdropFilter: 'blur(10px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                        }}
                                    >
                                        {page.kind === 'user' ? (
                                            <UserAvatar
                                                avatarUrl={page.user.avatarUrl}
                                                name={page.name}
                                                size={24}
                                            />
                                        ) : '🌍'}
                                        {page.name}
                                    </motion.div>

                                    <div style={{
                                        display: 'flex',
                                        gap: isTogetherPage ? 12 : 0,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        width: '100%'
                                    }}>
                                        {renderUsers.map((u) => (
                                            <div key={u.id} style={{
                                                transform: isTogetherPage ? 'scale(0.85)' : 'scale(1)',
                                                position: 'relative'
                                            }}>
                                                <FuwafuwaCharacter
                                                    user={u}
                                                    sessions={allSessions}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Pagination Dots */}
                {swipePages.length > 1 && (
                    <div style={{
                        display: 'flex',
                        gap: 8,
                        marginTop: 'min(3vh, 24px)',
                        alignItems: 'center'
                    }}>
                        {swipePages.map((_, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: currentPageIndex === idx ? 24 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    background: currentPageIndex === idx ? '#2BBAA0' : 'rgba(43, 186, 160, 0.3)',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Subtle instruction text */}
                {swipePages.length > 1 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        transition={{ delay: 2, duration: 2 }}
                        style={{
                            marginTop: 'min(2vh, 16px)',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#636e72',
                            letterSpacing: 2,
                            background: 'rgba(255, 255, 255, 0.5)',
                            padding: '6px 16px',
                            borderRadius: 20,
                        }}
                    >
                        スワイプしてえらんでね
                    </motion.div>
                )}

                {/* ─── Challenge Section ─── */}
                {challenges.length > 0 && (
                    <div style={{
                        width: '100%',
                        padding: '0 20px',
                        marginTop: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                    }}>
                        <span style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#636E72',
                            padding: '0 4px',
                        }}>
                            チャレンジ
                        </span>
                        {challenges.map(ch => (
                            <ChallengeCard
                                key={ch.id}
                                challenge={ch}
                                completions={completions}
                                onCompleted={loadChallenges}
                            />
                        ))}
                    </div>
                )}

                {/* ─── Popular Menus Section ─── */}
                <div style={{
                    width: '100%',
                    padding: '0 20px',
                    marginTop: challenges.length > 0 ? 20 : 24,
                }}>
                    <PopularMenusRow
                        onOpenBrowser={() => setMenuBrowserOpen(true)}
                        onSelectMenu={(exerciseIds) => startSessionWithExercises(exerciseIds)}
                    />
                </div>
            </div>

            {/* Public Menu Browser Modal */}
            <PublicMenuBrowser
                open={menuBrowserOpen}
                onClose={() => setMenuBrowserOpen(false)}
            />
        </div>
    );
};
