import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, ChevronLeft } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import { useAppStore } from '../../store/useAppStore';

const REMINDER_TIME_OPTIONS = [
    { value: '17:00', label: '17:00' },
    { value: '19:00', label: '19:00' },
    { value: '21:00', label: '21:00' },
] as const;

interface NotificationStepProps {
    onDone: () => void;
    onBack: () => void;
}

export const NotificationStep: React.FC<NotificationStepProps> = ({ onDone, onBack }) => {
    const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
    const notificationTime = useAppStore((state) => state.notificationTime);
    const setNotificationTime = useAppStore((state) => state.setNotificationTime);
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
                gap: SPACE['2xl'],
                padding: `0 ${SPACE['3xl']}px`,
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
                    gap: SPACE.xs,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    color: COLOR.muted,
                    fontSize: FONT_SIZE.md,
                    fontFamily: FONT.body,
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
                    borderRadius: RADIUS.circle,
                    background: 'linear-gradient(135deg, rgba(43,186,160,0.15) 0%, rgba(43,186,160,0.05) 100%)',
                    border: `2px solid rgba(43, 186, 160, 0.3)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Bell size={32} color={COLOR.primary} />
            </div>

            <div>
                <h2
                    style={{
                        fontFamily: FONT.body,
                        fontSize: 22,
                        fontWeight: 700,
                        color: COLOR.dark,
                        marginBottom: SPACE.md,
                    }}
                >
                    まいにち おしらせ
                </h2>
                <p
                    style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.lg,
                        color: COLOR.muted,
                        lineHeight: 1.8,
                    }}
                >
                    なんじに おしらせするか
                    <br />
                    えらべます
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md, width: '100%' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: SPACE.sm,
                        width: '100%',
                    }}
                >
                    {REMINDER_TIME_OPTIONS.map((option) => {
                        const selected = notificationTime === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setNotificationTime(option.value)}
                                style={{
                                    padding: '12px 0',
                                    borderRadius: RADIUS.lg,
                                    border: selected
                                        ? `1.5px solid ${COLOR.primary}`
                                        : '1.5px solid rgba(131, 149, 167, 0.22)',
                                    background: selected ? 'rgba(43, 186, 160, 0.12)' : 'rgba(255,255,255,0.74)',
                                    color: selected ? COLOR.primaryDark : COLOR.text,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: selected ? 700 : 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>

                {supported && (
                    <button
                        onClick={handleAllow}
                        disabled={requesting}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: RADIUS.xl,
                            background: requesting
                                ? 'rgba(43, 186, 160, 0.5)'
                                : `linear-gradient(135deg, ${COLOR.primary} 0%, ${COLOR.primaryDark} 100%)`,
                            border: 'none',
                            color: COLOR.white,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.lg,
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
                        borderRadius: RADIUS.xl,
                        background: 'none',
                        border: '1.5px solid rgba(131, 149, 167, 0.3)',
                        color: COLOR.muted,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.lg,
                        fontWeight: 600,
                        cursor: requesting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {supported ? 'あとでいい' : 'つぎへ'}
                </button>
            </div>
        </motion.div>
    );
};
