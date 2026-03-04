import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmDeleteModalProps {
    open: boolean;
    title: string;
    message: string;
    onCancel: () => void;
    onConfirm: () => void;
    loading?: boolean;
    confirmLabel?: string;
    loadingLabel?: string;
    confirmColor?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    open,
    title,
    message,
    onCancel,
    onConfirm,
    loading = false,
    confirmLabel = '削除する',
    loadingLabel = '削除中...',
    confirmColor = '#E17055',
}) => {
    const trapRef = useFocusTrap<HTMLDivElement>(open);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    onClick={onCancel}
                >
                    <motion.div
                        ref={trapRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: 24,
                            maxWidth: 320,
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        }}
                    >
                        <h3 style={{
                            margin: '0 0 8px',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            margin: '0 0 20px',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#636E72',
                            lineHeight: 1.6,
                        }}>
                            {message}
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 14,
                                    border: '1px solid #E0E0E0',
                                    background: '#fff',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: '#636E72',
                                    cursor: 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: confirmColor,
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#fff',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1,
                                }}
                            >
                                {loading ? loadingLabel : confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
