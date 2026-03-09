import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../supabase-types';

const teacherSupabaseMocks = vi.hoisted(() => ({
    rangeCalls: [] as Array<{ table: string; from: number; to: number }>,
    familyMembers: [] as Database['public']['Tables']['family_members']['Row'][],
    sessions: [] as Database['public']['Tables']['sessions']['Row'][],
    appSettings: [] as Database['public']['Tables']['app_settings']['Row'][],
    errors: {
        family_members: null as unknown,
        sessions: null as unknown,
        app_settings: null as unknown,
    },
}));

vi.mock('../supabase', () => {
    const applyOrders = (
        rows: Array<Record<string, unknown>>,
        orders: Array<{ column: string; ascending: boolean }>,
    ) => {
        return [...rows].sort((left, right) => {
            for (const order of orders) {
                const leftValue = left[order.column];
                const rightValue = right[order.column];
                if (leftValue === rightValue) continue;
                if (leftValue == null) return order.ascending ? -1 : 1;
                if (rightValue == null) return order.ascending ? 1 : -1;
                if (leftValue < rightValue) return order.ascending ? -1 : 1;
                if (leftValue > rightValue) return order.ascending ? 1 : -1;
            }
            return 0;
        });
    };

    return {
        supabase: {
            from(table: 'family_members' | 'sessions' | 'app_settings') {
                const orders: Array<{ column: string; ascending: boolean }> = [];

                return {
                    select() {
                        return this;
                    },
                    order(column: string, { ascending }: { ascending: boolean }) {
                        orders.push({ column, ascending });
                        return this;
                    },
                    range(from: number, to: number) {
                        teacherSupabaseMocks.rangeCalls.push({ table, from, to });

                        const error = teacherSupabaseMocks.errors[table];
                        if (error) {
                            return Promise.resolve({ data: null, error });
                        }

                        const source = table === 'family_members'
                            ? teacherSupabaseMocks.familyMembers
                            : table === 'sessions'
                                ? teacherSupabaseMocks.sessions
                                : teacherSupabaseMocks.appSettings;

                        const ordered = applyOrders(source as Array<Record<string, unknown>>, orders);
                        return Promise.resolve({
                            data: ordered.slice(from, to + 1),
                            error: null,
                        });
                    },
                };
            },
        },
    };
});

import { fetchAllStudents } from '../teacher';

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

function createSession(
    id: string,
    accountId: string,
    date: string,
): Database['public']['Tables']['sessions']['Row'] {
    return {
        id,
        account_id: accountId,
        date,
        started_at: `${date}T10:00:00Z`,
        total_seconds: 60,
        exercise_ids: ['S01'],
        skipped_ids: [],
        user_ids: [],
        created_at: `${date}T10:00:00Z`,
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
    teacherSupabaseMocks.rangeCalls = [];
    teacherSupabaseMocks.familyMembers = [];
    teacherSupabaseMocks.sessions = [];
    teacherSupabaseMocks.appSettings = [];
    teacherSupabaseMocks.errors.family_members = null;
    teacherSupabaseMocks.errors.sessions = null;
    teacherSupabaseMocks.errors.app_settings = null;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00+09:00'));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('fetchAllStudents', () => {
    it('paginates family members and app settings beyond the default page size', async () => {
        teacherSupabaseMocks.familyMembers = Array.from({ length: 1001 }, (_, index) =>
            createFamilyMember(`member-${index}`, `account-${index}`));
        teacherSupabaseMocks.appSettings = Array.from({ length: 1001 }, (_, index) =>
            createAppSettings(`account-${index}`, false));

        const students = await fetchAllStudents();

        expect(students).toHaveLength(1001);
        expect(
            teacherSupabaseMocks.rangeCalls.filter((call) => call.table === 'family_members'),
        ).toEqual([
            { table: 'family_members', from: 0, to: 999 },
            { table: 'family_members', from: 1000, to: 1999 },
        ]);
        expect(
            teacherSupabaseMocks.rangeCalls.filter((call) => call.table === 'app_settings'),
        ).toEqual([
            { table: 'app_settings', from: 0, to: 999 },
            { table: 'app_settings', from: 1000, to: 1999 },
        ]);
    });

    it('paginates sessions and filters suspended accounts from the result', async () => {
        teacherSupabaseMocks.familyMembers = [
            createFamilyMember('member-active', 'active-account'),
            createFamilyMember('member-suspended', 'suspended-account'),
        ];
        teacherSupabaseMocks.sessions = Array.from({ length: 1001 }, (_, index) =>
            createSession(`session-${index}`, 'active-account', index < 1000 ? '2026-03-07' : '2026-03-06'));
        teacherSupabaseMocks.sessions.push(
            createSession('session-suspended', 'suspended-account', '2026-03-07'),
        );
        teacherSupabaseMocks.appSettings = [
            createAppSettings('active-account', false),
            createAppSettings('suspended-account', true),
        ];

        const students = await fetchAllStudents();

        expect(students).toHaveLength(1);
        expect(students[0].accountId).toBe('active-account');
        expect(students[0].totalSessions).toBe(1001);
        expect(students[0].sessions).toHaveLength(100);
        expect(students[0].lastActiveDate).toBe('2026-03-07');
        expect(
            teacherSupabaseMocks.rangeCalls.filter((call) => call.table === 'sessions'),
        ).toEqual([
            { table: 'sessions', from: 0, to: 999 },
            { table: 'sessions', from: 1000, to: 1999 },
        ]);
    });

    it('merges the current account local members and sessions so recent training appears immediately', async () => {
        teacherSupabaseMocks.familyMembers = [
            createFamilyMember('member-active', 'active-account'),
        ];
        teacherSupabaseMocks.sessions = [
            createSession('session-remote', 'active-account', '2026-03-06'),
        ];
        teacherSupabaseMocks.appSettings = [
            createAppSettings('active-account', false),
        ];

        const students = await fetchAllStudents({
            currentAccountId: 'active-account',
            localMembers: [
                {
                    id: 'member-active',
                    name: 'local-member',
                    classLevel: '初級',
                    avatarUrl: 'https://example.com/avatar.png',
                },
            ],
            localSessions: [
                {
                    id: 'session-local',
                    date: '2026-03-07',
                    startedAt: '2026-03-07T12:00:00Z',
                    totalSeconds: 180,
                    userIds: ['member-active'],
                },
            ],
        });

        expect(students).toHaveLength(1);
        expect(students[0]).toMatchObject({
            accountId: 'active-account',
            totalSessions: 2,
            lastActiveDate: '2026-03-07',
            streak: 2,
        });
        expect(students[0].members[0]).toMatchObject({
            id: 'member-active',
            name: 'local-member',
            avatarUrl: 'https://example.com/avatar.png',
        });
        expect(students[0].sessions[0]).toMatchObject({
            id: 'session-local',
            date: '2026-03-07',
            totalSeconds: 180,
            userIds: ['member-active'],
        });
    });
});
