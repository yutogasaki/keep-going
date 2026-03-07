import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronLeft } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface NotificationStepProps {
    onDone: () => void;
    onBack: () => void;
}

export const NotificationStep: React.FC<NotificationStepProps> = ({ onDone, onBack }) => {
    const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
    const [requesting, setRequesting] = useState(false);

    const supported = typeof window !== 'undefined' && 'Notification' in window;

    const handleAllow = async () => {
        setRequesting(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setNotificationsEnabled(true);
            }
        } catch {
            // 対応していない環境ではスキップ
        } finally {
            setRequesting(false);
            onDone();
        }
    };

    return (
        <motion.div
            key="notification"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                padding: '0 32px',
                maxWidth: 360,
                textAlign: 'center',
                width: '100%',
            }}
        >
            <button
                onClick={onBack}
                style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    color: '#8395A7',
                    fontSize: 14,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: 'pointer',
                }}
            >
                <ChevronLeft size={18} />
                もどる
            </button>

            <div
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(43,186,160,0.15) 0%, rgba(43,186,160,0.05) 100%)',
                    border: '2px solid rgba(43, 186, 160, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Bell size={32} color="#2BBAA0" />
            </div>

            <div>
                <h2
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 22,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 12,
                    }}
                >
                    まいにち おしらせ
                </h2>
                <p
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        color: '#8395A7',
                        lineHeight: 1.8,
                    }}
                >
                    ストレッチの じかんを<br />
                    おしらせすることができます
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                {supported && (
                    <button
                        onClick={handleAllow}
                        disabled={requesting}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: 16,
                            background: requesting
                                ? 'rgba(43, 186, 160, 0.5)'
                                : 'linear-gradient(135deg, #2BBAA0 0%, #1A937D 100%)',
                            border: 'none',
                            color: 'white',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            cursor: requesting ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(43, 186, 160, 0.3)',
                        }}
                    >
                        {requesting ? '...' : 'おしらせを うけとる'}
                    </button>
                )}

                <button
                    onClick={onDone}
                    disabled={requesting}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: 16,
                        background: 'none',
                        border: '1.5px solid rgba(131, 149, 167, 0.3)',
                        color: '#8395A7',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: requesting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {supported ? 'スキップ' : 'つぎへ'}
                </button>
            </div>
        </motion.div>
    );
};
