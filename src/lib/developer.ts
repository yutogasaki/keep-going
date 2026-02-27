import { supabase } from './supabase';
import { formatDateKey } from './db';
import { calculateStreak } from './teacher';
import type { StudentMember, StudentSession } from './teacher';

// ─── Types ───────────────────────────────────────────

export interface AdminAccountSummary {
    accountId: string;
    members: StudentMember[];
    sessions: StudentSession[];
    streak: number;
    totalSessions: number;
    lastActiveDate: string | null;
    registeredAt: string | null; // earliest family_member created_at
    suspended: boolean;
}

// ─── Fetch all accounts (developer only) ─────────────

export async function fetchAllAccountsForAdmin(): Promise<AdminAccountSummary[]> {
    if (!supabase) return [];

    const [membersRes, sessionsRes, settingsRes] = await Promise.all([
        supabase.from('family_members').select('id, account_id, name, class_level, avatar_url, created_at'),
        supabase
            .from('sessions')
            .select('id, account_id, date, started_at, total_seconds, user_ids')
            .order('date', { ascending: false })
            .limit(10000),
        supabase.from('app_settings').select('account_id, suspended'),
    ]);

    if (membersRes.error || sessionsRes.error) {
        console.error('[developer] fetch failed:', membersRes.error, sessionsRes.error);
        return [];
    }

    const members = membersRes.data ?? [];
    const sessions = sessionsRes.data ?? [];
    const settings = settingsRes.data ?? [];

    const suspendedMap = new Map(settings.map(s => [s.account_id, s.suspended ?? false]));

    // Group by account_id
    const accountIds = new Set(members.map(m => m.account_id));
    const results: AdminAccountSummary[] = [];

    for (const accountId of accountIds) {
        const acctMembers = members.filter(m => m.account_id === accountId);
        const acctSessions = sessions.filter(s => s.account_id === accountId);

        const streak = calculateStreak(acctSessions);
        const lastActiveDate = acctSessions.length > 0 ? acctSessions[0].date : null;

        // Earliest created_at as registration date
        const createdDates = acctMembers
            .map(m => m.created_at)
            .filter(Boolean)
            .sort();
        const registeredAt = createdDates[0] ?? null;

        results.push({
            accountId,
            members: acctMembers.map(m => ({
                id: m.id,
                name: m.name,
                classLevel: m.class_level,
                avatarUrl: m.avatar_url || undefined,
            })),
            sessions: acctSessions.slice(0, 50).map(s => ({
                id: s.id,
                date: s.date,
                startedAt: s.started_at,
                totalSeconds: s.total_seconds,
                userIds: (s.user_ids as string[]) ?? [],
            })),
            streak,
            totalSessions: acctSessions.length,
            lastActiveDate,
            registeredAt,
            suspended: suspendedMap.get(accountId) ?? false,
        });
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
    const { error } = await (supabase.rpc as any)('suspend_account', {
        target_account_id: accountId,
        is_suspended: suspended,
    });
    if (error) throw error;
}

// ─── Delete account data ─────────────────────────────

export async function deleteAccountData(accountId: string): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');
    const { error } = await (supabase.rpc as any)('delete_account_data', {
        target_account_id: accountId,
    });
    if (error) throw error;
}

// ─── Stats helpers ───────────────────────────────────

export function computeStats(accounts: AdminAccountSummary[]) {
    const now = new Date();
    const adjusted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = formatDateKey(adjusted);

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
