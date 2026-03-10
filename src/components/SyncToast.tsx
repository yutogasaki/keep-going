import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOATING_UI_BOTTOM } from '../lib/styles';

interface SyncToastProps {
    message: string | null;
}

export const SyncToast: React.FC<SyncToastProps> = ({ message }) => {
    return createPortal(
        <AnimatePresence>
            {message && (
                <motion.div
                    key="sync-toast"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 40 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        position: 'fixed',
                        bottom: FLOATING_UI_BOTTOM,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9998,
                        padding: '10px 20px',
                        borderRadius: 12,
                        background: 'rgba(45, 52, 54, 0.9)',
                        backdropFilter: 'blur(var(--blur-sm))',
                        WebkitBackdropFilter: 'blur(var(--blur-sm))',
                        color: 'white',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        boxShadow: 'var(--shadow-lg)',
                        pointerEvents: 'none',
                    }}
                >
                    {message}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
