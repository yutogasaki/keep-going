import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, Smartphone, X } from 'lucide-react';

interface SyncConflictDialogProps {
    onChooseCloud: () => void;
    onChooseLocal: () => void;
    onCancel: () => void;
}

export const SyncConflictDialog: React.FC<SyncConflictDialogProps> = ({
    onChooseCloud,
    onChooseLocal,
    onCancel,
}) => {
    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    padding: 24,
                }}
                onClick={onCancel}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: 340,
                        background: 'white',
                        borderRadius: 20,
                        padding: 24,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }}
                >
                    {/* Header */}
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#2D3436',
                            margin: 0,
                        }}>
                            データが見つかりました
                        </h3>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            margin: '8px 0 0',
                            lineHeight: 1.6,
                        }}>
                            このアカウントにはクラウドに保存されたデータがあります。どちらを使いますか？
                        </p>
                    </div>

                    {/* Cloud option */}
                    <button
                        onClick={onChooseCloud}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '14px 16px',
                            borderRadius: 14,
                            border: '2px solid #2BBAA0',
                            background: 'rgba(43, 186, 160, 0.05)',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <Cloud size={22} color="#2BBAA0" />
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2BBAA0',
                            }}>
                                クラウドのデータを使う
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                                marginTop: 2,
                            }}>
                                このデバイスのデータは上書きされます
                            </div>
                        </div>
                    </button>

                    {/* Local option */}
                    <button
                        onClick={onChooseLocal}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '14px 16px',
                            borderRadius: 14,
                            border: '1px solid rgba(0,0,0,0.1)',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                        }}
                    >
                        <Smartphone size={22} color="#636E72" />
                        <div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>
                                このデバイスのデータを使う
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                color: '#8395A7',
                                marginTop: 2,
                            }}>
                                クラウドのデータは上書きされます
                            </div>
                        </div>
                    </button>

                    {/* Note about sessions */}
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#B2BEC3',
                        textAlign: 'center',
                        margin: 0,
                        lineHeight: 1.5,
                    }}>
                        練習の記録はどちらを選んでも合体されます
                    </p>

                    {/* Cancel */}
                    <button
                        onClick={onCancel}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '10px',
                            borderRadius: 10,
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            color: '#8395A7',
                        }}
                    >
                        <X size={16} />
                        キャンセル
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};
