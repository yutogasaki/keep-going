import React from 'react';
import { motion } from 'framer-motion';

interface BreakModalProps {
    onContinue: () => void;
}

export const BreakModal: React.FC<BreakModalProps> = ({ onContinue }) => {
    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                textAlign: 'center',
                background: 'var(--glass-bg-heavy)',
                backdropFilter: 'blur(var(--blur-xl))',
                WebkitBackdropFilter: 'blur(var(--blur-xl))',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <span style={{ fontSize: 48, marginBottom: 16 }}>🌸</span>
            <h2 style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2D3436',
                marginBottom: 8,
            }}>
                ここで止まっていい。
            </h2>
            <p style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 14,
                color: '#8395A7',
                marginBottom: 40,
                lineHeight: 1.6,
            }}>
                十分な区切りまで到達しました。<br />
                このまま終わりにしても構いません。
            </p>

            <motion.button
                onClick={onContinue}
                whileTap={{ scale: 0.95 }}
                style={{
                    padding: '14px 48px',
                    background: 'linear-gradient(135deg, #2BBAA0, #24A08A)',
                    borderRadius: 9999,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'white',
                    boxShadow: 'var(--shadow-accent-md)',
                    width: '100%',
                    maxWidth: 280,
                }}
            >
                つづける
            </motion.button>
        </motion.div>
    );
};
