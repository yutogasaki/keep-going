import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getAllSessions, type SessionRecord } from '../lib/db';
import { FuwafuwaCharacter } from '../components/FuwafuwaCharacter';
import { MagicTank } from '../components/MagicTank';

export const HomeScreen: React.FC = () => {
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

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
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute', top: '15%', left: '10%',
                    width: 120, height: 120, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(167, 243, 208, 0.4) 0%, transparent 70%)',
                    zIndex: 0, filter: 'blur(10px)'
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
                        <MagicTank count={allSessions.length} maxCount={3} />
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
                    ✨ ふわふわに まほうを おくろう ✨
                </motion.div>
            </div>
        </div>
    );
};
