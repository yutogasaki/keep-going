import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOATING_UI_BOTTOM, FONT, FONT_SIZE, Z } from '../lib/styles';

interface ToastProps {
    message: string | null;
    onClose: () => void;
    duration?: number;
    type?: 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, onClose, duration = 2500, type = 'success' }) => {
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [message, onClose, duration]);

    return createPortal(
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: FLOATING_UI_BOTTOM,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: Z.confirm + 10,
                        padding: '12px 24px',
                        borderRadius: 16,
                        background: type === 'success'
                            ? 'rgba(43, 186, 160, 0.95)'
                            : 'rgba(225, 112, 85, 0.95)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        color: 'white',
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 600,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                    }}
                    onClick={onClose}
                >
                    {type === 'success' ? '✓ ' : '✕ '}{message}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
