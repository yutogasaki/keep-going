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
import { ChallengeCard } from '../components/ChallengeCard';
import { PopularMenusRow } from '../components/PopularMenusRow';
import { PublicMenuBrowser } from '../components/PublicMenuBrowser';
import { MenuDetailSheet } from '../components/MenuDetailSheet';
import { type PublicMenu } from '../lib/publicMenus';
import { ChevronDown } from 'lucide-react';
import { fetchActiveChallenges, fetchPastChallenges, fetchMyCompletions, type Challenge, type ChallengeCompletion } from '../lib/challenges';

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

    // Filter challenges by current user's class level
    const filteredChallenges = useMemo(() => {
        const activeClassLevels = new Set<string>();
        for (const uid of sessionUserIds) {
            const user = users.find(u => u.id === uid);
            if (user?.classLevel) activeClassLevels.add(user.classLevel);
        }
        return challenges.filter(ch =>
            ch.classLevels.length === 0 || ch.classLevels.some(cl => activeClassLevels.has(cl))
        );
    }, [challenges, sessionUserIds, users]);

    useEffect(() => {
        loadChallenges();
    }, [loadChallenges]);

    // Calculate today's total trained seconds for the Magic Tank based on the CURRENT swipe selection (sessionUserIds)
    const todayStr = getTodayKey();
    const isTogetherMode = sessionUserIds.length > 1;
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);

    const todaySessions = useMemo(() => allSessions.filter(s => {
        if (s.date !== todayStr) return false;
        if (isTogetherMode) {
            return !s.userIds || s.userIds.some(id => sessionUserIdSet.has(id));
        } else {
            return !s.userIds || s.userIds.includes(sessionUserIds[0]);
        }
    }), [allSessions, todayStr, isTogetherMode, sessionUserIdSet, sessionUserIds]);
    const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.totalSeconds, 0);

    // Calculate target time — in together mode, use individual user's target (not summed)
    const activeUsers = users.filter(u => sessionUserIds.includes(u.id));
    const singleUserTargetMinutes = activeUsers.length > 0
        ? (activeUsers[0].dailyTargetMinutes || 10)
        : (users.length > 0 ? (users[0].dailyTargetMinutes || 10) : 10);

    // For single-user mode or as overall target: use the active user's target
    const targetSeconds = singleUserTargetMinutes * 60;

    // Per-user magic energy calculations (for individual tanks in together mode)
    const perUserMagic = useMemo(() => {
        return activeUsers.map(u => {
            const userSessions = allSessions.filter(s => {
                if (s.date !== todayStr) return false;
                return !s.userIds || s.userIds.includes(u.id);
            });
            const trained = userSessions.reduce((acc, s) => acc + s.totalSeconds, 0);
            const consumed = u.consumedMagicDate === todayStr ? (u.consumedMagicSeconds || 0) : 0;
            const userTarget = (u.dailyTargetMinutes || 10) * 60;
            return {
                userId: u.id,
                userName: u.name,
                displaySeconds: Math.max(0, trained - consumed),
                targetSeconds: userTarget,
            };
        });
    }, [activeUsers, allSessions, todayStr]);

    // Overall display (single-user mode uses first user's values)
    const consumedSeconds = activeUsers.reduce((sum, u) => {
        if (u.consumedMagicDate === todayStr) {
            return sum + (u.consumedMagicSeconds || 0);
        }
        return sum;
    }, 0);
    const displaySeconds = Math.max(0, todaySeconds - consumedSeconds);

    // Confetti logic for Magic Tank reset
    const handleTankReset = () => {
        if (displaySeconds < targetSeconds) return;

        activeUsers.forEach(u => {
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
                colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E']
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

        audio.playSuccess();
    };

    useEffect(() => {
        const load = () => {
            getAllSessions().then(sessions => {
                setAllSessions(sessions);
            }).catch(console.warn);
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

    // Derive currentPageIndex from sessionUserIds (single source of truth)
    const currentPageIndex = useMemo(() => {
        if (swipePages.length === 0) return 0;
        if (sessionUserIds.length > 1) {
            const idx = swipePages.findIndex(p => p.kind === 'together');
            return idx === -1 ? 0 : idx;
        } else if (sessionUserIds.length === 1) {
            const idx = swipePages.findIndex(
                p => p.kind === 'user' && p.user.id === sessionUserIds[0]
            );
            return idx === -1 ? 0 : idx;
        }
        return 0;
    }, [sessionUserIds, swipePages]);


    // Initialize sessionUserIds if empty (e.g. page refresh) and clean up stale IDs (e.g. user deleted)
    useEffect(() => {
        if (users.length === 0) return;
        if (sessionUserIds.length === 0) {
            setSessionUserIds([users[0].id]);
            return;
        }
        const userIdSet = new Set(users.map(u => u.id));
        const validIds = sessionUserIds.filter(id => userIdSet.has(id));
        if (validIds.length !== sessionUserIds.length) {
            setSessionUserIds(validIds.length > 0 ? validIds : [users[0].id]);
        }
    }, [users, sessionUserIds, setSessionUserIds]);

    const handleDragEnd = useCallback((_event: any, info: any) => {
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
                setSessionUserIds(users.map(u => u.id));
            } else {
                setSessionUserIds([page.user.id]);
            }
        }
    }, [currentPageIndex, swipePages, users, setSessionUserIds]);

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

            {/* Milestone Modal */}
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
                paddingTop: 12,
                paddingBottom: 90,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
            }}>

                {/* ─── Fuwafuwa White Card ─── */}
                <div style={{
                    width: 'calc(100% - 32px)',
                    maxWidth: 400,
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 24,
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.9)',
                    padding: '16px 0 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                    {/* Magic Power Tank — above fuwafuwa */}
                    {isTogetherMode ? (
                        <div style={{
                            display: 'flex',
                            gap: 16,
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            marginBottom: 16,
                        }}>
                            {perUserMagic.map(um => (
                                <div key={um.userId} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                    <div style={{
                                        transform: 'scale(0.75)',
                                        transformOrigin: 'top center',
                                        marginBottom: -33,
                                    }}>
                                        <MagicTank
                                            currentSeconds={um.displaySeconds}
                                            maxSeconds={um.targetSeconds}
                                            onReset={handleTankReset}
                                        />
                                    </div>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#8395A7',
                                    }}>
                                        {um.userName}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ marginBottom: 8 }}>
                            <MagicTank
                                currentSeconds={displaySeconds}
                                maxSeconds={targetSeconds}
                                onReset={handleTankReset}
                            />
                        </div>
                    )}

                    {/* The Stars of the Show (Carousel) */}
                    <div style={{ width: '100%', overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <motion.div
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            dragDirectionLock
                            onDragEnd={handleDragEnd}
                            animate={{ x: `calc(-${currentPageIndex * 100}%)` }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}
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
                                        gap: 8,
                                        opacity: currentPageIndex === index ? 1 : 0.5,
                                        transition: 'opacity 0.3s ease'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            gap: isTogetherPage ? 12 : 0,
                                            justifyContent: 'center',
                                            alignItems: isTogetherPage ? 'flex-start' : 'center',
                                            width: '100%'
                                        }}>
                                            {renderUsers.map((u) => (
                                                <div key={u.id} style={{
                                                    transform: isTogetherPage ? 'scale(0.85)' : 'scale(1)',
                                                    transformOrigin: isTogetherPage ? 'top center' : undefined,
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
                            gap: 6,
                            marginTop: 8,
                            alignItems: 'center'
                        }}>
                            {swipePages.map((_, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        width: currentPageIndex === idx ? 20 : 6,
                                        height: 6,
                                        borderRadius: 3,
                                        background: currentPageIndex === idx ? '#2BBAA0' : 'rgba(43, 186, 160, 0.25)',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Challenge Section ─── */}
                {filteredChallenges.length > 0 && (
                    <div style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
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
                        {filteredChallenges.map(ch => (
                            <ChallengeCard
                                key={ch.id}
                                challenge={ch}
                                completions={completions}
                                onCompleted={loadChallenges}
                            />
                        ))}
                    </div>
                )}

                {/* ─── Past Challenges Section ─── */}
                {pastChallenges.length > 0 && (
                    <div style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: filteredChallenges.length > 0 ? 10 : 20,
                    }}>
                        <button
                            onClick={() => setPastExpanded(!pastExpanded)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px 4px',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#B2BEC3',
                            }}
                        >
                            <ChevronDown
                                size={14}
                                style={{
                                    transform: pastExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s ease',
                                }}
                            />
                            おわったチャレンジ（{pastChallenges.length}）
                        </button>
                        <AnimatePresence>
                            {pastExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                                >
                                    {pastChallenges.map(ch => (
                                        <ChallengeCard
                                            key={ch.id}
                                            challenge={ch}
                                            completions={completions}
                                            onCompleted={loadChallenges}
                                            expired
                                        />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* ─── Popular Menus Section ─── */}
                <div style={{
                    width: '100%',
                    padding: '0 16px',
                    marginTop: 20,
                }}>
                    <PopularMenusRow
                        onOpenBrowser={() => setMenuBrowserOpen(true)}
                        onMenuTap={setSelectedPublicMenu}
                    />
                </div>
            </div>

            {/* Public Menu Browser Modal */}
            <PublicMenuBrowser
                open={menuBrowserOpen}
                onClose={() => setMenuBrowserOpen(false)}
            />

            {/* Menu Detail Sheet (from Popular row) */}
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
