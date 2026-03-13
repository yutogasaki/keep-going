import { supabase } from './supabase';
import { formatDateKey } from './db';
import { calculateStreak } from './teacher';
import type { StudentMember, StudentSession } from './teacher';
import type { Database } from './supabase-types';

// ─── Types ───────────────────────────────────────────

export interface AdminMemberSummary extends StudentMember {
    createdAt: string | null;
}

export interface AdminAccountSummary {
    accountId: string;
    members: AdminMemberSummary[];
    sessions: StudentSession[];
    streak: number;
    totalSessions: number;
    lastActiveDate: string | null;
    registeredAt: string | null; // earliest family_member created_at
    suspended: boolean;
}

type AdminFamilyMemberRow = Pick<
    Database['public']['Tables']['family_members']['Row'],
    'id' | 'account_id' | 'name' | 'class_level' | 'avatar_url' | 'created_at'
>;

type AdminSessionRow = Pick<
    Database['public']['Tables']['sessions']['Row'],
    'id' | 'account_id' | 'date' | 'started_at' | 'total_seconds' | 'user_ids'
>;

type AdminAppSettingsRow = Pick<
    Database['public']['Tables']['app_settings']['Row'],
    'account_id' | 'suspended'
>;

function buildAdminAccountSummary(
    accountId: string,
    members: AdminFamilyMemberRow[],
    sessions: AdminSessionRow[],
    suspendedMap: Map<string, boolean>,
): AdminAccountSummary {
    const streak = calculateStreak(sessions);
    const lastActiveDate = sessions.length > 0 ? sessions[0].date : null;
    const createdDates = members
        .map((member) => member.created_at)
        .filter(Boolean)
        .sort();
    const registeredAt = createdDates[0] ?? null;

    return {
        accountId,
        members: members.map((member) => ({
            id: member.id,
            name: member.name,
            classLevel: member.class_level,
            avatarUrl: member.avatar_url || undefined,
            createdAt: member.created_at ?? null,
        })),
        sessions: sessions.slice(0, 50).map((session) => ({
            id: session.id,
            date: session.date,
            startedAt: session.started_at,
            totalSeconds: session.total_seconds,
            userIds: session.user_ids ?? [],
        })),
        streak,
        totalSessions: sessions.length,
        lastActiveDate,
        registeredAt,
        suspended: suspendedMap.get(accountId) ?? false,
    };
}

// ─── Fetch all accounts (developer only) ─────────────

export async function fetchAllAccountsForAdmin(): Promise<AdminAccountSummary[]> {
    if (!supabase) return [];

    const [membersResult, sessionsResult, settingsResult] = await Promise.allSettled([
        supabase.from('family_members').select('id, account_id, name, class_level, avatar_url, created_at'),
        supabase
            .from('sessions')
            .select('id, account_id, date, started_at, total_seconds, user_ids')
            .order('date', { ascending: false })
            .limit(10000),
        supabase.from('app_settings').select('account_id, suspended'),
    ]);

    if (membersResult.status === 'rejected') {
        console.error('[developer] fetch failed:', membersResult.reason, sessionsResult.status === 'rejected' ? sessionsResult.reason : null);
        return [];
    }

    if (sessionsResult.status === 'rejected') {
        console.warn('[developer] sessions fetch failed, falling back to member-only accounts:', sessionsResult.reason);
    }

    if (settingsResult.status === 'rejected') {
        console.warn('[developer] settings fetch failed, assuming accounts are active:', settingsResult.reason);
    }

    const members = membersResult.value.data ?? [];
    const sessions = sessionsResult.status === 'fulfilled' ? sessionsResult.value.data ?? [] : [];
    const settings = settingsResult.status === 'fulfilled' ? settingsResult.value.data ?? [] : [];
    const suspendedMap = new Map(settings.map((setting: AdminAppSettingsRow) => [setting.account_id, setting.suspended ?? false]));

    // Group by account_id
    const accountIds = new Set(members.map((member) => member.account_id));
    const results: AdminAccountSummary[] = [];

    for (const accountId of accountIds) {
        const accountMembers = members.filter((member) => member.account_id === accountId);
        const accountSessions = sessions.filter((session) => session.account_id === accountId);

        results.push(buildAdminAccountSummary(accountId, accountMembers, accountSessions, suspendedMap));
    }

    // Sort: most recently active first
    results.sort((a, b) => {
        const aDate = a.lastActiveDate ?? '';
        const bDate = b.lastActiveDate ?? '';
        return bDate.localeCompare(aDate);
    });

    return results;
}

// ─── Suspend / unsuspend account ─────────────────────

export async function suspendAccount(accountId: string, suspended: boolean): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('suspend_account', {
        target_account_id: accountId,
        is_suspended: suspended,
    });
    if (error) throw error;
}

// ─── Delete account data ─────────────────────────────

export async function deleteAccountData(accountId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('delete_account_data', {
        target_account_id: accountId,
    });
    if (error) throw error;
}

// ─── Delete individual family member (developer only) ──

export async function developerDeleteFamilyMember(memberId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await supabase.rpc('teacher_delete_family_member', {
        target_member_id: memberId,
    });
    if (error) throw error;
}

// ─── Stats helpers ───────────────────────────────────

export function computeStats(accounts: AdminAccountSummary[]) {
    const now = new Date();
    const adjusted = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    // 30 days ago
    const thirtyDaysAgo = new Date(adjusted);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = formatDateKey(thirtyDaysAgo);

    // 7 days ago
    const sevenDaysAgo = new Date(adjusted);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = formatDateKey(sevenDaysAgo);

    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(
        a => a.lastActiveDate && a.lastActiveDate >= thirtyDaysAgoStr
    ).length;
    const totalMembers = accounts.reduce((sum, a) => sum + a.members.length, 0);
    const suspendedAccounts = accounts.filter(a => a.suspended).length;

    const weekSessions = accounts.reduce((sum, a) =>
        sum + a.sessions.filter(s => s.date >= sevenDaysAgoStr).length, 0
    );

    return { totalAccounts, activeAccounts, totalMembers, suspendedAccounts, weekSessions };
}
