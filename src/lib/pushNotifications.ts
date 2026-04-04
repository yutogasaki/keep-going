import { supabase } from './supabase';
import { normalizeNotificationTime } from './pushReminderSchedule';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY ?? '';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(normalized);
    const buffer = new Uint8Array(rawData.length);
    for (let index = 0; index < rawData.length; index += 1) {
        buffer[index] = rawData.charCodeAt(index);
    }
    return buffer.buffer;
}

async function getAccessToken(): Promise<string> {
    if (!supabase) {
        throw new Error('Supabase が設定されていません。');
    }

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
        throw new Error('ログイン情報が見つかりません。');
    }

    return token;
}

async function callSubscriptionApi(method: 'POST' | 'DELETE', body?: Record<string, unknown>) {
    const token = await getAccessToken();

    const response = await fetch('/api/push/subscription', {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Push subscription request failed: ${response.status}`);
    }
}

export function isPushNotificationSupported(): boolean {
    return (
        typeof window !== 'undefined'
        && window.isSecureContext
        && 'Notification' in window
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && VAPID_PUBLIC_KEY.length > 0
    );
}

export function getPushNotificationUnavailableMessage(): string {
    if (typeof window === 'undefined') {
        return 'この環境ではプッシュ通知を使えません。';
    }

    if (!window.isSecureContext) {
        return '通知は HTTPS または localhost でのみ使えます。';
    }

    if (!('Notification' in window)) {
        return 'お使いのブラウザは通知に対応していません。';
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        return 'この環境ではプッシュ通知に対応していません。iPhone や iPad はホーム画面に追加したあとにお試しください。';
    }

    if (!VAPID_PUBLIC_KEY) {
        return '通知の公開鍵が設定されていません。';
    }

    return 'この環境ではプッシュ通知を使えません。';
}

export async function requestPushPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.requestPermission();
}

export async function syncPushSubscription(notificationTime: string): Promise<void> {
    if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
        return;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
    }

    const payload = subscription.toJSON();
    if (!payload.endpoint || !payload.keys?.auth || !payload.keys?.p256dh) {
        throw new Error('Push subscription payload is incomplete.');
    }

    await callSubscriptionApi('POST', {
        endpoint: payload.endpoint,
        keys: payload.keys,
        expirationTime: payload.expirationTime ?? null,
        notificationTime: normalizeNotificationTime(notificationTime),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
}

export async function disablePushSubscription(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        return;
    }

    const registration = await navigator.serviceWorker.ready.catch(() => null);
    const subscription = await registration?.pushManager.getSubscription();

    if (!subscription) {
        return;
    }

    try {
        await callSubscriptionApi('DELETE', { endpoint: subscription.endpoint });
    } catch (error) {
        console.warn('[push] Failed to delete remote subscription:', error);
    }

    await subscription.unsubscribe().catch((error) => {
        console.warn('[push] Failed to unsubscribe local push subscription:', error);
    });
}
