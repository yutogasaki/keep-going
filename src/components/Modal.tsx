import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { Z } from '../lib/styles';

interface ModalProps {
    open: boolean;
    onClose?: () => void;
    /** z-index (default: Z.modal = 1000) */
    zIndex?: number;
    /** モーダル本体の最大幅 (default: 320) */
    maxWidth?: number;
    /** aria-label */
    ariaLabel?: string;
    children: React.ReactNode;
}

/**
 * 汎用モーダルコンポーネント
 *
 * overlay + backdrop-blur + createPortal + AnimatePresence をまとめた共通基盤。
 * 各モーダルはこの中に children を渡すだけで使える。
 *
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} ariaLabel="確認">
 *   <h3>タイトル</h3>
 *   <p>メッセージ</p>
 *   <button onClick={handleConfirm}>OK</button>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
    open,
    onClose,
    zIndex = Z.modal,
    maxWidth = 320,
    ariaLabel,
    children,
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
                        zIndex,
                        background: 'var(--overlay-bg)',
                        backdropFilter: 'blur(var(--overlay-blur))',
                        WebkitBackdropFilter: 'blur(var(--overlay-blur))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={trapRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={ariaLabel}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--glass-bg-heavy)',
                            backdropFilter: 'blur(var(--blur-xl))',
                            WebkitBackdropFilter: 'blur(var(--blur-xl))',
                            border: 'var(--glass-border)',
                            borderRadius: 'var(--card-radius)',
                            padding: 24,
                            maxWidth,
                            width: '100%',
                            boxShadow: 'var(--shadow-xl)',
                        }}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
