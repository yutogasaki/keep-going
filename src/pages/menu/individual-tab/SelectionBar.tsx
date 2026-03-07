import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw } from 'lucide-react';

interface SelectionBarProps {
    count: number;
    onStart: () => void;
    onReset: () => void;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({ count, onStart, onReset }) => {
    return (
        <AnimatePresence>
            {count > 0 && (
                <motion.div
                    initial={{ y: 80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 80, opacity: 0 }}
                    transition={{ type: 'spring', damping: 24, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
                        left: 16,
                        right: 16,
                        zIndex: 50,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px 10px 16px',
                        borderRadius: 18,
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(16px)',
                        WebkitBackdropFilter: 'blur(16px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                    }}
                >
                    <div style={{
                        flex: 1,
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: '#2BBAA0',
                            color: '#FFF',
                            fontSize: 13,
                            fontWeight: 800,
                            fontFamily: "'Outfit', sans-serif",
                            marginRight: 6,
                        }}>
                            {count}
                        </span>
                        えらんだ
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={onReset}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            border: 'none',
                            background: 'rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <RotateCcw size={16} color="#8395A7" />
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onStart}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '10px 18px',
                            borderRadius: 14,
                            border: 'none',
                            background: 'linear-gradient(135deg, #2BBAA0, #26A68D)',
                            color: '#FFF',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 4px 12px rgba(43, 186, 160, 0.35)',
                        }}
                    >
                        <Sparkles size={15} />
                        おまかせスタート
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
