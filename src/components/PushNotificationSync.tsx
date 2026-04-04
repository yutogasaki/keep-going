import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppStore } from '../store/useAppStore';
import { disablePushSubscription, isPushNotificationSupported, syncPushSubscription } from '../lib/pushNotifications';

export const PushNotificationSync: React.FC = () => {
    const notificationTime = useAppStore((state) => state.notificationTime);
    const notificationsEnabled = useAppStore((state) => state.notificationsEnabled);
    const { user, isLoading } = useAuth();
    const userId = user?.id ?? null;

    useEffect(() => {
        if (isLoading || !userId || !isPushNotificationSupported()) {
            return;
        }

        const synchronize = async () => {
            if (Notification.permission === 'denied') {
                await disablePushSubscription();
                return;
            }

            if (!notificationsEnabled) {
                await disablePushSubscription();
                return;
            }

            if (Notification.permission !== 'granted') {
                return;
            }

            await syncPushSubscription(notificationTime);
        };

        void synchronize().catch((error) => {
            console.warn('[push] Failed to sync push subscription:', error);
        });
    }, [
        isLoading,
        notificationTime,
        notificationsEnabled,
        userId,
    ]);

    return null;
};
