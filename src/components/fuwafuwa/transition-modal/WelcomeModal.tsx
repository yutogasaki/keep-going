import React from 'react';
import { motion } from 'framer-motion';
import { getFuwafuwaImagePath } from '../../../lib/fuwafuwa';

interface WelcomeModalProps {
    userFuwafuwaType: number;
    onWelcomeClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
    userFuwafuwaType,
    onWelcomeClose,
}) => {
    return (
        <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(180deg, #F0FDFA 0%, #E0F7FA 50%, #F0F4FF 100%)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 32,
            }}
        >
            {[...Array(10)].map((_, index) => (
                <motion.div
                    key={`welcome-particle-${index}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                    }}
                    style={{
                        position: 'absolute',
                        fontSize: 16,
                        left: `${5 + (index * 11) % 90}%`,
                        top: `${10 + (index * 13) % 70}%`,
                        pointerEvents: 'none',
                    }}
                >
                    ✨
                </motion.div>
            ))}

            <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
                style={{ marginBottom: 24 }}
            >
                <div
                    style={{
                        width: 130,
                        height: 130,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid rgba(255,255,255,0.95)',
                        boxShadow: '0 16px 48px rgba(43, 186, 160, 0.25)',
                        background: '#fff',
                    }}
                >
                    <motion.img
                        animate={{
                            scale: [1.05, 1.1, 1.05],
                            rotate: [0, 2, -2, 0],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        src={getFuwafuwaImagePath(userFuwafuwaType, 1)}
                        alt="new egg"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: 48, marginBottom: 8 }}
            >
                🎉
            </motion.div>

            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#2D3436',
                    margin: '0 0 12px',
                    textAlign: 'center',
                }}
            >
                あたらしい たまごが<br />やってきたよ！
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                    textAlign: 'center',
                    lineHeight: 1.8,
                    margin: '0 0 32px',
                }}
            >
                まいにち がんばって<br />たいせつに そだてよう！
            </motion.p>

            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                whileTap={{ scale: 0.95 }}
                onClick={onWelcomeClose}
                style={{
                    padding: '16px 40px',
                    borderRadius: 99,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2BBAA0, #3AEDC6)',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(43, 186, 160, 0.3)',
                    letterSpacing: 2,
                }}
            >
                よろしくね！
            </motion.button>
        </motion.div>
    );
};
