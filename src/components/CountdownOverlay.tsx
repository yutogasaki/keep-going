import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from '../lib/audio';

export const CountdownOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
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
            <AnimatePresence mode="wait">
                <motion.div
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: count > 0 ? 96 : 64,
                        fontWeight: 800,
                        color: '#2BBAA0',
                        textShadow: '0 4px 20px rgba(43, 186, 160, 0.3)',
                    }}
                >
                    {count > 0 ? count : 'GO!'}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};
