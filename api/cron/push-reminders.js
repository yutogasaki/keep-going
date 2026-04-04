import webpush from 'web-push';
import {
    createAdminClient,
    getWebPushConfig,
    isAuthorizedCronRequest,
    sendJson,
} from '../_lib/push-server.js';

const NOTIFICATION_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const REMINDER_WINDOW_MINUTES = 10;

function normalizeNotificationTime(value) {
    return typeof value === 'string' && NOTIFICATION_TIME_PATTERN.test(value) ? value : '21:00';
}

function pad2(value) {
    return String(value).padStart(2, '0');
}

function getLocalParts(now, timeZone) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const year = Number(parts.find((part) => part.type === 'year')?.value ?? 0);
    const month = Number(parts.find((part) => part.type === 'month')?.value ?? 0);
    const day = Number(parts.find((part) => part.type === 'day')?.value ?? 0);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);

    return {
        dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
        totalMinutes: hour * 60 + minute,
    };
}

function shouldSendReminder({ now, notificationTime, timeZone, lastSentLocalDate }) {
    let localParts;

    try {
        localParts = getLocalParts(now, timeZone || 'UTC');
    } catch {
        localParts = getLocalParts(now, 'UTC');
    }

    const [hours, minutes] = normalizeNotificationTime(notificationTime).split(':').map(Number);
    const targetMinutes = hours * 60 + minutes;

    return {
        localDate: localParts.dateKey,
        shouldSend: (
            localParts.totalMinutes >= targetMinutes
            && localParts.totalMinutes < targetMinutes + REMINDER_WINDOW_MINUTES
            && localParts.dateKey !== lastSentLocalDate
        ),
    };
}

function buildReminderPayload() {
    return JSON.stringify({
        title: 'KeepGoing',
        body: 'きょうもストレッチしてみよう。',
        url: '/',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'keepgoing-daily-reminder',
    });
}

export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.setHeader('Allow', 'GET, POST');
        sendJson(res, 405, { error: 'Method not allowed.' });
        return;
    }

    if (!isAuthorizedCronRequest(req)) {
        sendJson(res, 401, { error: 'Unauthorized.' });
        return;
    }

    const admin = createAdminClient();
    const { publicKey, privateKey, subject } = getWebPushConfig();

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const [subscriptionResult, settingsResult] = await Promise.all([
        admin.from('web_push_subscriptions').select('*'),
        admin.from('app_settings').select('account_id, suspended, notifications_enabled'),
    ]);

    if (subscriptionResult.error) {
        sendJson(res, 500, { error: subscriptionResult.error.message });
        return;
    }

    if (settingsResult.error) {
        sendJson(res, 500, { error: settingsResult.error.message });
        return;
    }

    const settingsByAccountId = new Map(
        (settingsResult.data ?? []).map((item) => [item.account_id, item]),
    );
    const now = new Date();
    const payload = buildReminderPayload();

    const stats = {
        processed: 0,
        sent: 0,
        skipped: 0,
        deleted: 0,
        failed: 0,
    };

    for (const subscription of subscriptionResult.data ?? []) {
        stats.processed += 1;

        const settings = settingsByAccountId.get(subscription.account_id);
        if (settings?.suspended || settings?.notifications_enabled === false) {
            stats.skipped += 1;
            continue;
        }

        const due = shouldSendReminder({
            now,
            notificationTime: subscription.notification_time,
            timeZone: subscription.time_zone,
            lastSentLocalDate: subscription.last_sent_local_date,
        });

        if (!due.shouldSend) {
            stats.skipped += 1;
            continue;
        }

        try {
            await webpush.sendNotification({
                endpoint: subscription.endpoint,
                expirationTime: subscription.expiration_time ?? undefined,
                keys: {
                    p256dh: subscription.p256dh_key,
                    auth: subscription.auth_key,
                },
            }, payload);

            const { error } = await admin
                .from('web_push_subscriptions')
                .update({ last_sent_local_date: due.localDate })
                .eq('endpoint', subscription.endpoint);

            if (error) {
                throw error;
            }

            stats.sent += 1;
        } catch (error) {
            const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : null;

            if (statusCode === 404 || statusCode === 410) {
                await admin.from('web_push_subscriptions').delete().eq('endpoint', subscription.endpoint);
                stats.deleted += 1;
                continue;
            }

            console.warn('[push] Failed to send reminder:', error);
            stats.failed += 1;
        }
    }

    sendJson(res, 200, { ok: true, stats });
}
