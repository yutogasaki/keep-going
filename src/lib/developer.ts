import { supabase } from './supabase';
import { formatDateKey } from './db';
import { calculateStreak } from './teacher';
import type { StudentMember, StudentSession } from './teacher';
import type { SessionMenuSource } from '../store/use-app-store/types';

// ─── Types ───────────────────────────────────────────

export interface AdminMemberSummary extends StudentMember {
    createdAt: string | null;
    fuwafuwaType: number | null;
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

export interface AdminFuwafuwaTypeMemberSummary {
    memberId: string;
    accountId: string;
    name: string;
    classLevel: string;
}

export interface AdminFuwafuwaTypeStat {
    type: number | null;
    memberCount: number;
    accountCount: number;
    share: number;
    members: AdminFuwafuwaTypeMemberSummary[];
}

export interface AdminFuwafuwaTypeStatsSummary {
    totalMembers: number;
    typesInUse: number;
    topType: number | null;
    topTypeMemberCount: number;
    topTypeShare: number;
    unassignedMembers: number;
    stats: AdminFuwafuwaTypeStat[];
}

function normalizeSessionMenuSource(value: string | null | undefined): SessionMenuSource | null {
    return value === 'preset' || value === 'teacher' || value === 'custom' || value === 'public'
        ? value
        : null;
}

// ─── Fetch all accounts (developer only) ─────────────

export async function fetchAllAccountsForAdmin(): Promise<AdminAccountSummary[]> {
    if (!supabase) return [];

    const [membersRes, sessionsRes, settingsRes] = await Promise.all([
        supabase.from('family_members').select('id, account_id, name, class_level, avatar_url, created_at, fuwafuwa_type'),
        supabase
            .from('sessions')
            .select('id, account_id, date, started_at, total_seconds, exercise_ids, planned_exercise_ids, skipped_ids, user_ids, source_menu_id, source_menu_source')
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
                createdAt: m.created_at ?? null,
                fuwafuwaType: typeof m.fuwafuwa_type === 'number' && Number.isFinite(m.fuwafuwa_type)
                    ? m.fuwafuwa_type
                    : null,
            })),
            sessions: acctSessions.slice(0, 50).map(s => ({
                id: s.id,
                date: s.date,
                startedAt: s.started_at,
                totalSeconds: s.total_seconds,
                exerciseIds: s.exercise_ids ?? [],
                plannedExerciseIds: s.planned_exercise_ids ?? [],
                skippedIds: s.skipped_ids ?? [],
                userIds: (s.user_ids as string[]) ?? [],
                sourceMenuId: s.source_menu_id ?? null,
                sourceMenuSource: normalizeSessionMenuSource(s.source_menu_source),
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

export function computeFuwafuwaTypeStats(accounts: AdminAccountSummary[]): AdminFuwafuwaTypeStatsSummary {
    const groups = new Map<string, {
        type: number | null;
        members: AdminFuwafuwaTypeMemberSummary[];
        accountIds: Set<string>;
    }>();

    for (const account of accounts) {
        for (const member of account.members) {
            const normalizedType = typeof member.fuwafuwaType === 'number' && Number.isFinite(member.fuwafuwaType)
                ? member.fuwafuwaType
                : null;
            const key = normalizedType === null ? 'unassigned' : String(normalizedType);
            const existing = groups.get(key) ?? {
                type: normalizedType,
                members: [],
                accountIds: new Set<string>(),
            };

            existing.members.push({
                memberId: member.id,
                accountId: account.accountId,
                name: member.name,
                classLevel: member.classLevel,
            });
            existing.accountIds.add(account.accountId);
            groups.set(key, existing);
        }
    }

    const totalMembers = accounts.reduce((sum, account) => sum + account.members.length, 0);
    const stats = [...groups.values()]
        .map<AdminFuwafuwaTypeStat>((group) => ({
            type: group.type,
            memberCount: group.members.length,
            accountCount: group.accountIds.size,
            share: totalMembers > 0 ? group.members.length / totalMembers : 0,
            members: group.members,
        }))
        .sort((left, right) => {
            if (right.memberCount !== left.memberCount) {
                return right.memberCount - left.memberCount;
            }

            if (left.type === null && right.type !== null) {
                return 1;
            }
            if (left.type !== null && right.type === null) {
                return -1;
            }

            return (left.type ?? Number.MAX_SAFE_INTEGER) - (right.type ?? Number.MAX_SAFE_INTEGER);
        });

    const topStat = stats[0] ?? null;
    const unassignedMembers = stats.find((stat) => stat.type === null)?.memberCount ?? 0;

    return {
        totalMembers,
        typesInUse: stats.filter((stat) => stat.type !== null).length,
        topType: topStat?.type ?? null,
        topTypeMemberCount: topStat?.memberCount ?? 0,
        topTypeShare: totalMembers > 0 ? (topStat?.memberCount ?? 0) / totalMembers : 0,
        unassignedMembers,
        stats,
    };
}
