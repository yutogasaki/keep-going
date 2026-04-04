import { createClient } from '@supabase/supabase-js';

function getEnv(name, fallbacks = []) {
    for (const key of [name, ...fallbacks]) {
        const value = process.env[key];
        if (value) {
            return value;
        }
    }

    throw new Error(`Missing required environment variable: ${name}`);
}

function getBaseConfig() {
    return {
        supabaseUrl: getEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']),
        supabaseAnonKey: getEnv('SUPABASE_ANON_KEY', ['VITE_SUPABASE_ANON_KEY']),
        supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    };
}

function parseBearerToken(headerValue) {
    if (!headerValue || typeof headerValue !== 'string') {
        return null;
    }

    const match = /^Bearer\s+(.+)$/i.exec(headerValue);
    return match?.[1] ?? null;
}

export function sendJson(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(body));
}

export async function authenticateRequest(req) {
    const { supabaseUrl, supabaseAnonKey } = getBaseConfig();
    const accessToken = parseBearerToken(req.headers.authorization);

    if (!accessToken) {
        return { user: null, error: 'Missing bearer token.' };
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });

    const { data, error } = await authClient.auth.getUser(accessToken);
    if (error || !data.user) {
        return { user: null, error: error?.message ?? 'Unauthorized.' };
    }

    return { user: data.user, error: null };
}

export function createAdminClient() {
    const { supabaseUrl, supabaseServiceRoleKey } = getBaseConfig();
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export function getWebPushConfig() {
    return {
        publicKey: getEnv('WEB_PUSH_PUBLIC_KEY', ['VITE_WEB_PUSH_PUBLIC_KEY']),
        privateKey: getEnv('WEB_PUSH_PRIVATE_KEY'),
        subject: process.env.WEB_PUSH_SUBJECT ?? 'mailto:notify@example.com',
    };
}

export function isAuthorizedCronRequest(req) {
    const cronSecret = process.env.CRON_SECRET;
    const bearerToken = parseBearerToken(req.headers.authorization);

    return Boolean(cronSecret) && bearerToken === cronSecret;
}
