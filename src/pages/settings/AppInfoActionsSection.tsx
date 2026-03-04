import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { RotateCcw, Trash2 } from 'lucide-react';
import { clearAllData } from '../../lib/db';
import { useAppStore } from '../../store/useAppStore';

export const AppInfoActionsSection: React.FC = () => {
    const setOnboardingCompleted = useAppStore(s => s.setOnboardingCompleted);

    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [showConfirmRedo, setShowConfirmRedo] = useState(false);

    const handleReset = async () => {
        await clearAllData();
        setShowConfirmReset(false);
        window.location.reload();
    };

    const handleRedoOnboarding = () => {
        setOnboardingCompleted(false);
        setShowConfirmRedo(false);
        setTimeout(() => {
            window.location.reload();
        }, 50);
    };

    return (
        <>
            <div className="card card-sm" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
            }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    アプリ情報
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                }}>
                    <span style={{ color: '#8395A7' }}>バージョン</span>
                    <span style={{ color: '#2D3436', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>0.1.0</span>
                </div>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                }}>
                    <span style={{ color: '#8395A7' }}>KeepGoing</span>
                    <span style={{ color: '#B2BEC3', fontSize: 11 }}>今日のちょっとが、未来のちからに。</span>
                </div>
            </div>

            <div
                className="card card-sm"
                onClick={() => setShowConfirmRedo(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#2BBAA0',
                }}
            >
                <RotateCcw size={16} />
                <span>チュートリアルをやりなおす</span>
            </div>

            <div
                className="card card-sm"
                onClick={() => setShowConfirmReset(true)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 20px',
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#E17055',
                }}
            >
                <Trash2 size={16} />
                <span>データをリセット</span>
            </div>

            {showConfirmReset && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'var(--overlay-bg)',
                    backdropFilter: 'blur(var(--overlay-blur))',
                    WebkitBackdropFilter: 'blur(var(--overlay-blur))',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}>
                    <motion.div
                        className="card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '32px 24px',
                            maxWidth: 320,
                            width: '100%',
                        }}
                    >
                        <h3 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 8,
                        }}>
                            本当にリセットしますか？
                        </h3>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            marginBottom: 24,
                            lineHeight: 1.5,
                        }}>
                            すべての記録とプロフィールが<br />削除されます。
                        </p>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => setShowConfirmReset(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 500,
                                    color: '#8395A7',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleReset}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: '#E17055',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                リセットする
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body,
            )}

            {showConfirmRedo && createPortal(
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'var(--overlay-bg)',
                    backdropFilter: 'blur(var(--overlay-blur))',
                    WebkitBackdropFilter: 'blur(var(--overlay-blur))',
                    zIndex: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}>
                    <motion.div
                        className="card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '32px 24px',
                            maxWidth: 320,
                            width: '100%',
                        }}
                    >
                        <h3 style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#2D3436',
                            margin: '0 0 16px',
                        }}>
                            チュートリアルをやり直す
                        </h3>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            color: '#636E72',
                            margin: '0 0 24px',
                            lineHeight: 1.6,
                        }}>
                            最初の設定画面に戻りますか？<br />
                            <span style={{ fontSize: 13, color: '#8395A7' }}>※これまでの記録は消えません。</span>
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setShowConfirmRedo(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: '#DFE6E9',
                                    color: '#2D3436',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleRedoOnboarding}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: '#2BBAA0',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                やり直す
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body,
            )}
        </>
    );
};
