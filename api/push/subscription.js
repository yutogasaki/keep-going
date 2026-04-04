import { authenticateRequest, createAdminClient, sendJson } from '../_lib/push-server.js';

const NOTIFICATION_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function normalizeNotificationTime(value) {
    return typeof value === 'string' && NOTIFICATION_TIME_PATTERN.test(value) ? value : '21:00';
}

function normalizeTimeZone(value) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : 'UTC';
}

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        res.setHeader('Allow', 'POST, DELETE');
        sendJson(res, 405, { error: 'Method not allowed.' });
        return;
    }

    const { user, error: authError } = await authenticateRequest(req);
    if (!user) {
        sendJson(res, 401, { error: authError ?? 'Unauthorized.' });
        return;
    }

    const admin = createAdminClient();

    if (req.method === 'POST') {
        const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
        const p256dhKey = typeof req.body?.keys?.p256dh === 'string' ? req.body.keys.p256dh : '';
        const authKey = typeof req.body?.keys?.auth === 'string' ? req.body.keys.auth : '';

        if (!endpoint || !p256dhKey || !authKey) {
            sendJson(res, 400, { error: 'Invalid push subscription payload.' });
            return;
        }

        const { error } = await admin
            .from('web_push_subscriptions')
            .upsert({
                account_id: user.id,
                endpoint,
                p256dh_key: p256dhKey,
                auth_key: authKey,
                expiration_time: typeof req.body?.expirationTime === 'number'
                    ? Math.trunc(req.body.expirationTime)
                    : null,
                notification_time: normalizeNotificationTime(req.body?.notificationTime),
                time_zone: normalizeTimeZone(req.body?.timeZone),
                user_agent: req.headers['user-agent']?.slice(0, 500) ?? null,
            }, {
                onConflict: 'endpoint',
            });

        if (error) {
            sendJson(res, 500, { error: error.message });
            return;
        }

        sendJson(res, 200, { ok: true });
        return;
    }

    const deleteQuery = admin
        .from('web_push_subscriptions')
        .delete()
        .eq('account_id', user.id);

    if (typeof req.body?.endpoint === 'string' && req.body.endpoint) {
        deleteQuery.eq('endpoint', req.body.endpoint);
    }

    const { error } = await deleteQuery;
    if (error) {
        sendJson(res, 500, { error: error.message });
        return;
    }

    sendJson(res, 200, { ok: true });
}
