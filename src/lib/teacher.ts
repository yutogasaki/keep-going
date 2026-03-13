import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { calculateStreak, type SessionRecord } from './db';

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

export interface LocalStudentMemberSnapshot {
    id: string;
    name: string;
    classLevel: string;
    avatarUrl?: string;
}

export interface LocalStudentSessionSnapshot extends Pick<SessionRecord, 'id' | 'date' | 'startedAt' | 'totalSeconds'> {
    userIds?: string[];
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

interface FetchAllStudentsOptions {
    currentAccountId?: string | null;
    localMembers?: LocalStudentMemberSnapshot[];
    localSessions?: LocalStudentSessionSnapshot[];
}

function mapLocalMembersToTeacherRows(
    accountId: string,
    localMembers: LocalStudentMemberSnapshot[],
): TeacherFamilyMemberRow[] {
    return localMembers.map((member) => ({
        id: member.id,
        account_id: accountId,
        name: member.name,
        class_level: member.classLevel,
        avatar_url: member.avatarUrl ?? null,
    }));
}

function mapLocalSessionsToTeacherRows(
    accountId: string,
    localSessions: LocalStudentSessionSnapshot[],
): TeacherSessionRow[] {
    return localSessions.map((session) => ({
        id: session.id,
        account_id: accountId,
        date: session.date,
        started_at: session.startedAt,
        total_seconds: session.totalSeconds,
        user_ids: session.userIds ?? [],
    }));
}

function buildLocalStudentSummary(options: FetchAllStudentsOptions): StudentSummary | null {
    if (!options.currentAccountId) {
        return null;
    }

    const localMembers = mapLocalMembersToTeacherRows(options.currentAccountId, options.localMembers ?? []);
    if (localMembers.length === 0) {
        return null;
    }

    const localSessions = mapLocalSessionsToTeacherRows(options.currentAccountId, options.localSessions ?? []);
    return buildStudentSummary(options.currentAccountId, localMembers, localSessions);
}

function buildFallbackStudentSummaries(
    options: FetchAllStudentsOptions,
    suspendedIds: ReadonlySet<string> = new Set<string>(),
): StudentSummary[] {
    const localSummary = buildLocalStudentSummary(options);
    if (!localSummary || suspendedIds.has(localSummary.accountId)) {
        return [];
    }

    return [localSummary];
}

function sortTeacherSessions<T extends Pick<TeacherSessionRow, 'date' | 'started_at'>>(sessions: T[]): T[] {
    return [...sessions].sort((left, right) => {
        const dateCompare = right.date.localeCompare(left.date);
        if (dateCompare !== 0) {
            return dateCompare;
        }
        return right.started_at.localeCompare(left.started_at);
    });
}

function mergeRowsById<T extends { id: string }>(remoteRows: T[], localRows: T[]): T[] {
    const merged = new Map(remoteRows.map((row) => [row.id, row]));
    for (const row of localRows) {
        merged.set(row.id, row);
    }
    return [...merged.values()];
}

function buildStudentSummary(
    accountId: string,
    accountMembers: TeacherFamilyMemberRow[],
    accountSessions: TeacherSessionRow[],
): StudentSummary {
    const sortedSessions = sortTeacherSessions(accountSessions);
    const streak = calculateStreak(sortedSessions);
    const lastActiveDate = sortedSessions.length > 0 ? sortedSessions[0].date : null;

    return {
        accountId,
        members: accountMembers.map((member) => ({
            id: member.id,
            name: member.name,
            classLevel: member.class_level,
            avatarUrl: member.avatar_url || undefined,
        })),
        sessions: sortedSessions.slice(0, 100).map((session) => ({
            id: session.id,
            date: session.date,
            startedAt: session.started_at,
            totalSeconds: session.total_seconds,
            userIds: session.user_ids ?? [],
        })),
        streak,
        totalSessions: sortedSessions.length,
        lastActiveDate,
    };
}

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

export async function fetchAllStudents(options: FetchAllStudentsOptions = {}): Promise<StudentSummary[]> {
    if (!supabase) {
        return buildFallbackStudentSummaries(options);
    }

    const [membersResult, sessionsResult, settingsResult] = await Promise.allSettled([
        fetchTeacherMembers(),
        fetchTeacherSessions(),
        fetchTeacherAppSettings(),
    ]);

    const suspendedIds = new Set(
        settingsResult.status === 'fulfilled'
            ? settingsResult.value.filter((setting) => setting.suspended).map((setting) => setting.account_id)
            : [],
    );

    if (membersResult.status === 'rejected' || sessionsResult.status === 'rejected') {
        console.error(
            '[teacher] fetch failed:',
            membersResult.status === 'rejected' ? membersResult.reason : null,
            sessionsResult.status === 'rejected' ? sessionsResult.reason : null,
        );
        return buildFallbackStudentSummaries(options, suspendedIds);
    }

    if (settingsResult.status === 'rejected') {
        console.warn('[teacher] Failed to load suspended account settings:', settingsResult.reason);
    }

    const members = membersResult.value;
    const sessions = sessionsResult.value;
    const settings = settingsResult.status === 'fulfilled' ? settingsResult.value : [];

    // Filter out suspended accounts
    for (const setting of settings) {
        if (setting.suspended) {
            suspendedIds.add(setting.account_id);
        }
    }

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

    if (options.currentAccountId && !suspendedIds.has(options.currentAccountId)) {
        const currentAccountId = options.currentAccountId;
        const localMembers = mapLocalMembersToTeacherRows(currentAccountId, options.localMembers ?? []);
        const localSessions = mapLocalSessionsToTeacherRows(currentAccountId, options.localSessions ?? []);

        if (localMembers.length > 0) {
            membersByAccount.set(
                currentAccountId,
                mergeRowsById(membersByAccount.get(currentAccountId) ?? [], localMembers),
            );
        }

        if (localSessions.length > 0) {
            sessionsByAccount.set(
                currentAccountId,
                sortTeacherSessions(mergeRowsById(sessionsByAccount.get(currentAccountId) ?? [], localSessions)),
            );
        }
    }

    const results: StudentSummary[] = [];

    for (const [accountId, accountMembers] of membersByAccount.entries()) {
        results.push(buildStudentSummary(accountId, accountMembers, sessionsByAccount.get(accountId) ?? []));
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
    const args: Database['public']['Functions']['teacher_delete_family_member']['Args'] = {
        target_member_id: memberId,
    };
    const { error } = await supabase.rpc('teacher_delete_family_member', args);
    if (error) throw error;
}
