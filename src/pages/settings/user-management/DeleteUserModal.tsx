import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useFocusTrap } from '../../../hooks/useFocusTrap';

interface DeleteUserModalProps {
    userId: string | null;
    onCancel: () => void;
    onConfirm: (userId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ userId, onCancel, onConfirm }) => {
    const trapRef = useFocusTrap<HTMLDivElement>(!!userId);
    if (!userId) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--overlay-bg)',
            backdropFilter: 'blur(var(--overlay-blur))',
            WebkitBackdropFilter: 'blur(var(--overlay-blur))',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <motion.div
                ref={trapRef}
                role="dialog"
                aria-modal="true"
                aria-label="ユーザーの削除"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                    background: 'var(--glass-bg-heavy)',
                    backdropFilter: 'blur(var(--blur-xl))',
                    WebkitBackdropFilter: 'blur(var(--blur-xl))',
                    border: 'var(--glass-border)',
                    borderRadius: 'var(--card-radius)',
                    padding: 24,
                    width: 'calc(100% - 64px)',
                    maxWidth: 320,
                    boxShadow: 'var(--shadow-xl)',
                }}
            >
                <h3 style={{
                    margin: '0 0 12px 0',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#2D3436',
                    textAlign: 'center',
                }}>
                    ユーザーの削除
                </h3>
                <p style={{
                    margin: '0 0 24px 0',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#636E72',
                    textAlign: 'center',
                    lineHeight: 1.5,
                }}>
                    本当に削除しますか？<br />この操作は取り消せません。
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: 16,
                            border: 'none',
                            background: '#F0F3F5',
                            color: '#636E72',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={() => onConfirm(userId)}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: 16,
                            border: 'none',
                            background: '#E74C3C',
                            color: 'white',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        削除する
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body,
    );
};
