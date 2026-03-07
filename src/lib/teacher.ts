import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { calculateStreak } from './db';

// Re-export so existing callers (TeacherDashboard, AccountCard) don't need to change imports
export { calculateStreak };

// ─── Types ───────────────────────────────────────────

export interface StudentMember {
    id: string;
    name: string;
    classLevel: string;
    avatarUrl?: string;
}

export interface StudentSession {
    id: string;
    date: string;
    startedAt: string;
    totalSeconds: number;
    userIds: string[];
}

export interface StudentSummary {
    accountId: string;
    members: StudentMember[];
    sessions: StudentSession[];
    streak: number;
    totalSessions: number;
    lastActiveDate: string | null;
}

// ─── Teacher check (hardcoded email) ─────────────────

const TEACHER_EMAILS = [
    'yu.togasaki@gmail.com',
    'ayami.ballet.studio@gmail.com',
];

export function checkIsTeacher(email: string | undefined): boolean {
    return !!email && TEACHER_EMAILS.includes(email);
}

// ─── Developer check ─────────────────────────────────

const DEVELOPER_EMAILS = ['yu.togasaki@gmail.com'];

export function checkIsDeveloper(email: string | undefined): boolean {
    return !!email && DEVELOPER_EMAILS.includes(email);
}

// ─── Fetch all students ──────────────────────────────

const TEACHER_FETCH_PAGE_SIZE = 1000;

type TeacherFamilyMemberRow = Pick<
    Database['public']['Tables']['family_members']['Row'],
    'id' | 'account_id' | 'name' | 'class_level' | 'avatar_url'
>;

type TeacherSessionRow = Pick<
    Database['public']['Tables']['sessions']['Row'],
    'id' | 'account_id' | 'date' | 'started_at' | 'total_seconds' | 'user_ids'
>;

type TeacherAppSettingsRow = Pick<
    Database['public']['Tables']['app_settings']['Row'],
    'account_id' | 'suspended'
>;

async function fetchAllPages<T>(
    fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
    const rows: T[] = [];

    for (let from = 0; ; from += TEACHER_FETCH_PAGE_SIZE) {
        const to = from + TEACHER_FETCH_PAGE_SIZE - 1;
        const { data, error } = await fetchPage(from, to);
        if (error) throw error;

        const page = data ?? [];
        rows.push(...page);

        if (page.length < TEACHER_FETCH_PAGE_SIZE) {
            return rows;
        }
    }
}

async function fetchTeacherMembers(): Promise<TeacherFamilyMemberRow[]> {
    const client = supabase;
    if (!client) return [];

    return fetchAllPages((from, to) =>
        client
            .from('family_members')
            .select('id, account_id, name, class_level, avatar_url')
            .order('account_id', { ascending: true })
            .order('id', { ascending: true })
            .range(from, to)
    );
}

async function fetchTeacherSessions(): Promise<TeacherSessionRow[]> {
    const client = supabase;
    if (!client) return [];

    return fetchAllPages((from, to) =>
        client
            .from('sessions')
            .select('id, account_id, date, started_at, total_seconds, user_ids')
            .order('date', { ascending: false })
            .order('started_at', { ascending: false })
            .range(from, to)
    );
}

async function fetchTeacherAppSettings(): Promise<TeacherAppSettingsRow[]> {
    const client = supabase;
    if (!client) return [];

    return fetchAllPages((from, to) =>
        client
            .from('app_settings')
            .select('account_id, suspended')
            .order('account_id', { ascending: true })
            .range(from, to)
    );
}

export async function fetchAllStudents(): Promise<StudentSummary[]> {
    if (!supabase) return [];

    const [membersResult, sessionsResult, settingsResult] = await Promise.allSettled([
        fetchTeacherMembers(),
        fetchTeacherSessions(),
        fetchTeacherAppSettings(),
    ]);

    if (membersResult.status === 'rejected' || sessionsResult.status === 'rejected') {
        console.error(
            '[teacher] fetch failed:',
            membersResult.status === 'rejected' ? membersResult.reason : null,
            sessionsResult.status === 'rejected' ? sessionsResult.reason : null,
        );
        return [];
    }

    if (settingsResult.status === 'rejected') {
        console.warn('[teacher] Failed to load suspended account settings:', settingsResult.reason);
    }

    const members = membersResult.value;
    const sessions = sessionsResult.value;
    const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : [];

    // Filter out suspended accounts
    const suspendedIds = new Set(
        settings.filter((setting) => setting.suspended).map((setting) => setting.account_id)
    );

    const membersByAccount = new Map<string, TeacherFamilyMemberRow[]>();
    for (const member of members) {
        if (suspendedIds.has(member.account_id)) continue;

        const existing = membersByAccount.get(member.account_id);
        if (existing) {
            existing.push(member);
        } else {
            membersByAccount.set(member.account_id, [member]);
        }
    }

    const sessionsByAccount = new Map<string, TeacherSessionRow[]>();
    for (const session of sessions) {
        if (suspendedIds.has(session.account_id)) continue;

        const existing = sessionsByAccount.get(session.account_id);
        if (existing) {
            existing.push(session);
        } else {
            sessionsByAccount.set(session.account_id, [session]);
        }
    }

    const results: StudentSummary[] = [];

    for (const [accountId, accountMembers] of membersByAccount.entries()) {
        const accountSessions = sessionsByAccount.get(accountId) ?? [];

        const streak = calculateStreak(accountSessions);
        const lastActiveDate = accountSessions.length > 0 ? accountSessions[0].date : null;

        results.push({
            accountId,
            members: accountMembers.map((member) => ({
                id: member.id,
                name: member.name,
                classLevel: member.class_level,
                avatarUrl: member.avatar_url || undefined,
            })),
            sessions: accountSessions.slice(0, 100).map((session) => ({
                id: session.id,
                date: session.date,
                startedAt: session.started_at,
                totalSeconds: session.total_seconds,
                userIds: session.user_ids ?? [],
            })),
            streak,
            totalSessions: accountSessions.length,
            lastActiveDate,
        });
    }

    // Sort: active students first
    results.sort((a, b) => {
        const aDate = a.lastActiveDate ?? '';
        const bDate = b.lastActiveDate ?? '';
        return bDate.localeCompare(aDate);
    });

    return results;
}

// ─── Teacher: delete a family member (cleanup) ─────

export async function teacherDeleteFamilyMember(memberId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const { error } = await (supabase.rpc as Function)('teacher_delete_family_member', {
        target_member_id: memberId,
    });
    if (error) throw error;
}
