import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from '../lib/audio';
import { Exercise } from '../data/exercises';

interface CountdownOverlayProps {
    onComplete: () => void;
    firstExercise?: Exercise;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete, firstExercise }) => {
    const [count, setCount] = useState(5);

    useEffect(() => {
        // Init audio mapping to the tap that mounted this component
        audio.init();
    }, []);

    useEffect(() => {
        if (count > 0 && count <= 3) {
            audio.playTick();
        } else if (count === 0) {
            audio.playGo();
            onComplete();
            return;
        }
        const timer = setTimeout(() => setCount(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [count, onComplete]);

    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(20px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 40,
                zIndex: 51,
            }}>
                {firstExercise && count > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 16,
                            background: 'white',
                            padding: '24px 32px',
                            borderRadius: 24,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                        }}
                    >
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#636E72',
                            background: '#F0F3F5',
                            padding: '6px 16px',
                            borderRadius: 20,
                        }}>
                            最初は
                        </div>
                        <div style={{
                            fontSize: 72,
                            lineHeight: 1,
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
                        }}>
                            {firstExercise.emoji}
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            {firstExercise.name}
                        </div>
                    </motion.div>
                )}

                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={count}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: count > 0 ? 120 : 80,
                                fontWeight: 800,
                                color: '#2BBAA0',
                                textShadow: '0 4px 20px rgba(43, 186, 160, 0.3)',
                                lineHeight: 1,
                            }}
                        >
                            {count > 0 ? count : 'GO!'}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};
