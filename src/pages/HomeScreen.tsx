import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSessions, getTodayKey, type SessionRecord } from '../lib/db';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { PageHeader } from '../components/PageHeader';
import { FuwafuwaCharacter } from '../components/FuwafuwaCharacter';
import { MagicTank } from '../components/MagicTank';
import { useAppStore } from '../store/useAppStore';
import { calculateFuwafuwaStatus } from '../lib/fuwafuwa';

export const HomeScreen: React.FC = () => {
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

    const users = useAppStore(s => s.users);
    const sessionUserIds = useAppStore(s => s.sessionUserIds);
    const setSessionUserIds = useAppStore(s => s.setSessionUserIds);
    const updateUser = useAppStore(s => s.updateUser);
    const activeMilestoneModal = useAppStore(s => s.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore(s => s.setActiveMilestoneModal);

    // Calculate today's total trained seconds for the Magic Tank based on the CURRENT swipe selection (sessionUserIds)
    const todayStr = getTodayKey();
    const isTogetherMode = sessionUserIds.length > 1;

    const todaySessions = allSessions.filter(s => {
        if (s.date !== todayStr) return false;
        // In together mode, sum ALL sessions that involve ANY of the users to show family total.
        // In individual mode, sum ONLY sessions that involve this specific user.
        if (isTogetherMode) {
            return !s.userIds || s.userIds.some(id => users.map(u => u.id).includes(id));
        } else {
            return !s.userIds || s.userIds.includes(sessionUserIds[0]);
        }
    });
    const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.totalSeconds, 0);
    const baseDailyTargetMinutes = useAppStore(s => s.dailyTargetMinutes);
    // In Together mode, scale target by the number of active family members so it represents a shared pool
    const targetSeconds = (isTogetherMode ? baseDailyTargetMinutes * users.length : baseDailyTargetMinutes) * 60;

    // Confetti logic for Magic Tank reset
    const handleTankReset = () => {
        import('canvas-confetti').then((confetti) => {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti.default({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'] // matches tank colors
                });
                confetti.default({
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
        });

        // Let's also play a happy sound
        import('../lib/audio').then(({ audio }) => {
            audio.playSuccess();
        });
    };

    useEffect(() => {
        const load = () => {
            getAllSessions().then(sessions => {
                setAllSessions(sessions);
            });
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
                if (currentStage === 0) shouldTriggerModal = 'egg';
                else if (currentStage === 2) shouldTriggerModal = 'fairy';
                else if (currentStage === 3) shouldTriggerModal = 'adult';
            }
        });

        if (shouldTriggerModal) {
            setActiveMilestoneModal(shouldTriggerModal);
        }
    }, [allSessions, users, updateUser, setActiveMilestoneModal]);

    // Define the swipeable pages based on users
    const swipePages = [...users];
    if (users.length >= 2) {
        // Automatically add "Together" page if 2 or more users exist
        swipePages.push({ id: 'TOGETHER', name: 'みんなで！', classLevel: '初級' } as any);
    }

    const [currentPageIndex, setCurrentPageIndex] = useState(() => {
        // Initialize to match sessionUserIds if possible (e.g. returning from Menu)
        if (sessionUserIds.length > 1) {
            const idx = swipePages.findIndex(p => p.id === 'TOGETHER');
            return Math.max(0, idx);
        } else if (sessionUserIds.length === 1) {
            const idx = swipePages.findIndex(p => p.id === sessionUserIds[0]);
            return Math.max(0, idx);
        }
        return 0;
    });


    // Sync sessionUserIds whenever swipe page changes
    useEffect(() => {
        if (users.length === 0) return;
        const page = swipePages[currentPageIndex];
        if (!page) {
            // Safety fallback
            if (currentPageIndex !== 0) setCurrentPageIndex(0);
            return;
        }

        if (page.id === 'TOGETHER') {
            setSessionUserIds(users.map(u => u.id));
        } else {
            setSessionUserIds([page.id]);
        }
    }, [currentPageIndex]); // Removed users from dependency to prevent infinite loops

    // Reverse sync: Update currentPageIndex when sessionUserIds change externally (e.g. from badge tap)
    useEffect(() => {
        if (users.length === 0) return;

        let targetIndex = 0;
        if (sessionUserIds.length > 1) {
            targetIndex = swipePages.findIndex(p => p.id === 'TOGETHER');
        } else if (sessionUserIds.length === 1) {
            targetIndex = swipePages.findIndex(p => p.id === sessionUserIds[0]);
        }

        if (targetIndex !== -1 && targetIndex !== currentPageIndex) {
            setCurrentPageIndex(targetIndex);
        }
    }, [sessionUserIds]);

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
                justifyContent: 'center',
                width: '100%',
                flex: 1,
                paddingTop: 'min(2vh, 16px)',
                paddingBottom: 90 // Ensure it clears the floating play button
            }}>
                {/* Magic Power Tank */}
                <div style={{ height: 'min(10vh, 100px)', display: 'flex', alignItems: 'flex-end', paddingBottom: 'min(1vh, 8px)' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <MagicTank
                            currentSeconds={todaySeconds}
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
                            const isTogetherPage = page.id === 'TOGETHER';
                            const renderUsers = isTogetherPage ? users : [page];

                            return (
                                <div key={page.id} style={{
                                    width: '100%',
                                    flexShrink: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 'min(2vh, 16px)',
                                    opacity: currentPageIndex === index ? 1 : 0.3,
                                    transition: 'opacity 0.3s ease'
                                }}>
                                    <h2 style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 20,
                                        fontWeight: 800,
                                        color: '#2D3436',
                                        margin: 0,
                                        background: 'rgba(255,255,255,0.6)',
                                        padding: '4px 16px',
                                        borderRadius: 20,
                                        letterSpacing: 2
                                    }}>
                                        {page.name}
                                    </h2>
                                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center' }}>
                                        {renderUsers.map((u: any) => (
                                            <div key={u.id} style={{
                                                transform: renderUsers.length === 1 ? 'scale(0.95)' : 'scale(0.85)',
                                                position: 'relative'
                                            }}>
                                                {/* Optional: Show tiny name badge if multiple users */}
                                                {renderUsers.length > 1 && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: -24,
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        background: 'rgba(255, 255, 255, 0.8)',
                                                        padding: '2px 8px',
                                                        borderRadius: 12,
                                                        fontSize: 10,
                                                        fontWeight: 'bold',
                                                        color: '#2BBAA0',
                                                        whiteSpace: 'nowrap',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                                        zIndex: 2
                                                    }}>
                                                        {u.name}
                                                    </div>
                                                )}
                                                <FuwafuwaCharacter user={u} sessions={allSessions} />
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
            </div>
        </div>
    );
};

