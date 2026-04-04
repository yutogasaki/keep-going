import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import { useAppStore } from '../../store/useAppStore';
import { OnboardingStepScaffold } from './OnboardingStepScaffold';
import {
    getPushNotificationUnavailableMessage,
    isPushNotificationSupported,
    requestPushPermission,
} from '../../lib/pushNotifications';

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

    const supported = isPushNotificationSupported();

    const handleAllow = async () => {
        setRequesting(true);
        try {
            const permission = await requestPushPermission();
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
                width: '100%',
            }}
        >
            <OnboardingStepScaffold onBack={onBack} maxWidth={420} gap={SPACE['2xl']}>
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

                    {!supported && (
                        <div
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: RADIUS.lg,
                                background: 'rgba(255,255,255,0.72)',
                                color: COLOR.muted,
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                lineHeight: 1.6,
                            }}
                        >
                            {getPushNotificationUnavailableMessage()}
                        </div>
                    )}

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
            </OnboardingStepScaffold>
        </motion.div>
    );
};
