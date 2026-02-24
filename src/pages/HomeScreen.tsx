import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllSessions, type SessionRecord } from '../lib/db';
import { FuwafuwaCharacter } from '../components/FuwafuwaCharacter';
import { MagicTank } from '../components/MagicTank';
import { useAppStore } from '../store/useAppStore';
import { calculateFuwafuwaStatus } from '../lib/fuwafuwa';

export const HomeScreen: React.FC = () => {
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

    const fuwafuwaType = useAppStore(s => s.fuwafuwaType);
    const fuwafuwaBirthDate = useAppStore(s => s.fuwafuwaBirthDate);
    const notifiedFuwafuwaStages = useAppStore(s => s.notifiedFuwafuwaStages);
    const addNotifiedFuwafuwaStage = useAppStore(s => s.addNotifiedFuwafuwaStage);
    const activeMilestoneModal = useAppStore(s => s.activeMilestoneModal);
    const setActiveMilestoneModal = useAppStore(s => s.setActiveMilestoneModal);

    const status = calculateFuwafuwaStatus(fuwafuwaBirthDate, allSessions);

    // Calculate today's total trained seconds for the Magic Tank
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = allSessions.filter(s => s.date === todayStr);
    const todaySeconds = todaySessions.reduce((acc, curr) => acc + curr.totalSeconds, 0);
    const dailyTargetMinutes = useAppStore(s => s.dailyTargetMinutes);
    const targetSeconds = dailyTargetMinutes * 60;

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
        if (!fuwafuwaBirthDate || allSessions.length === 0) return;
        const status = calculateFuwafuwaStatus(fuwafuwaBirthDate, allSessions);
        const currentStage = status.stage;

        // Exclude sayonara from milestone modals, we have a different flow for that usually, or we can just ignore for now
        if (!status.isSayonara && !notifiedFuwafuwaStages.includes(currentStage)) {
            addNotifiedFuwafuwaStage(currentStage);
            if (currentStage === 0) {
                setActiveMilestoneModal('egg');
            } else if (currentStage === 2) {
                setActiveMilestoneModal('fairy');
            } else if (currentStage === 3) {
                setActiveMilestoneModal('adult');
            }
        }
    }, [fuwafuwaBirthDate, allSessions, notifiedFuwafuwaStages, addNotifiedFuwafuwaStage, setActiveMilestoneModal]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Milestone Modals */}
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
                paddingBottom: 40 // Adjust for bottom navigation
            }}>
                {/* Magic Power Tank */}
                <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', paddingBottom: 16 }}>
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

                {/* The Star of the Show */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{
                        transform: 'scale(1.2)' // Make it slightly larger as the centerpiece
                    }}
                >
                    <FuwafuwaCharacter sessions={allSessions} />
                </motion.div>

                {/* Subtle instruction text */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.8 }}
                    transition={{ delay: 2, duration: 2 }}
                    style={{
                        marginTop: 24,
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
                    つんつん してみてね
                </motion.div>
            </div>
        </div>
    );
};
