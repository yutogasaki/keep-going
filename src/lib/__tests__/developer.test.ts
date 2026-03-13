import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../supabase-types';

const developerSupabaseMocks = vi.hoisted(() => ({
    familyMembers: [] as Database['public']['Tables']['family_members']['Row'][],
    sessions: [] as Database['public']['Tables']['sessions']['Row'][],
    appSettings: [] as Database['public']['Tables']['app_settings']['Row'][],
    errors: {
        family_members: null as unknown,
        sessions: null as unknown,
        app_settings: null as unknown,
    },
}));

vi.mock('../supabase', () => ({
    supabase: {
        from(table: 'family_members' | 'sessions' | 'app_settings') {
            const getResult = () => {
                const error = developerSupabaseMocks.errors[table];
                if (error) {
                    return Promise.reject(error);
                }

                const source = table === 'family_members'
                    ? developerSupabaseMocks.familyMembers
                    : table === 'sessions'
                        ? developerSupabaseMocks.sessions
                        : developerSupabaseMocks.appSettings;

                return Promise.resolve({ data: source, error: null });
            };

            const builder = {
                select() {
                    return builder;
                },
                order() {
                    return builder;
                },
                limit() {
                    return builder;
                },
                then<TResult1 = { data: unknown[]; error: null }, TResult2 = never>(
                    onfulfilled?: ((value: { data: unknown[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
                    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
                ) {
                    return getResult().then(onfulfilled, onrejected);
                },
                catch<TResult = never>(
                    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
                ) {
                    return getResult().catch(onrejected);
                },
            };

            return {
                ...builder,
            };
        },
    },
}));

import { fetchAllAccountsForAdmin } from '../developer';

function createFamilyMember(
    id: string,
    accountId: string,
): Database['public']['Tables']['family_members']['Row'] {
    return {
        id,
        account_id: accountId,
        name: `member-${id}`,
        class_level: '初級',
        fuwafuwa_birth_date: '2026-03-01',
        fuwafuwa_type: 1,
        fuwafuwa_cycle_count: 1,
        fuwafuwa_name: null,
        past_fuwafuwas: [],
        notified_fuwafuwa_stages: [],
        daily_target_minutes: 10,
        excluded_exercises: [],
        required_exercises: [],
        consumed_magic_seconds: 0,
        avatar_url: null,
        chibifuwas: [],
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
    };
}

function createAppSettings(
    accountId: string,
    suspended: boolean,
): Database['public']['Tables']['app_settings']['Row'] {
    return {
        account_id: accountId,
        onboarding_completed: true,
        sound_volume: 1,
        tts_enabled: true,
        bgm_enabled: true,
        haptic_enabled: true,
        notifications_enabled: false,
        notification_time: '18:00',
        suspended,
        updated_at: '2026-03-01T00:00:00Z',
    };
}

beforeEach(() => {
    developerSupabaseMocks.familyMembers = [];
    developerSupabaseMocks.sessions = [];
    developerSupabaseMocks.appSettings = [];
    developerSupabaseMocks.errors.family_members = null;
    developerSupabaseMocks.errors.sessions = null;
    developerSupabaseMocks.errors.app_settings = null;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00+09:00'));
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe('fetchAllAccountsForAdmin', () => {
    it('returns member-only accounts when session fetch fails', async () => {
        developerSupabaseMocks.familyMembers = [
            createFamilyMember('member-1', 'account-1'),
        ];
        developerSupabaseMocks.appSettings = [
            createAppSettings('account-1', true),
        ];
        developerSupabaseMocks.errors.sessions = new Error('sessions unavailable');

        const accounts = await fetchAllAccountsForAdmin();

        expect(accounts).toHaveLength(1);
        expect(accounts[0]).toMatchObject({
            accountId: 'account-1',
            totalSessions: 0,
            lastActiveDate: null,
            suspended: true,
        });
    });

    it('returns an empty list when member fetch fails', async () => {
        developerSupabaseMocks.errors.family_members = new Error('members unavailable');

        const accounts = await fetchAllAccountsForAdmin();

        expect(accounts).toEqual([]);
    });
});
