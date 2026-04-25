import { supabase } from './supabase';
import { calculateStreak } from './db';
import { buildStudentSummary, mergeRowsById, sortTeacherSessions } from './teacherSummary';
import type {
    FetchAllStudentsOptions,
    StudentSummary,
    TeacherAppSettingsRow,
    TeacherFamilyMemberRow,
    TeacherRemoteSnapshot,
    TeacherSessionRow,
} from './teacherTypes';

// Re-export so existing callers (TeacherDashboard, AccountCard) don't need to change imports
export { calculateStreak };
export type {
    FetchAllStudentsOptions,
    LocalStudentMemberSnapshot,
    LocalStudentSessionSnapshot,
    StudentMember,
    StudentSession,
    StudentSummary,
} from './teacherTypes';

// ─── Fetch all students ──────────────────────────────

const TEACHER_FETCH_PAGE_SIZE = 1000;
const TEACHER_REMOTE_CACHE_TTL = 60_000;

let cachedTeacherRemoteSnapshot: TeacherRemoteSnapshot | null = null;
let teacherRemoteSnapshotPromise: Promise<TeacherRemoteSnapshot> | null = null;

export function invalidateTeacherRemoteSnapshotCache(): void {
    cachedTeacherRemoteSnapshot = null;
    teacherRemoteSnapshotPromise = null;
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
            .range(from, to),
    );
}

async function fetchTeacherSessions(): Promise<TeacherSessionRow[]> {
    const client = supabase;
    if (!client) return [];

    return fetchAllPages((from, to) =>
        client
            .from('sessions')
            .select(
                'id, account_id, date, started_at, total_seconds, exercise_ids, planned_exercise_ids, skipped_ids, user_ids, source_menu_id, source_menu_source',
            )
            .order('date', { ascending: false })
            .order('started_at', { ascending: false })
            .range(from, to),
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
            .range(from, to),
    );
}

async function fetchTeacherRemoteSnapshot(forceRefresh = false): Promise<TeacherRemoteSnapshot> {
    if (!supabase) {
        return {
            members: [],
            sessions: [],
            settings: [],
            fetchedAt: Date.now(),
        };
    }

    if (
        !forceRefresh &&
        cachedTeacherRemoteSnapshot &&
        Date.now() - cachedTeacherRemoteSnapshot.fetchedAt < TEACHER_REMOTE_CACHE_TTL
    ) {
        return cachedTeacherRemoteSnapshot;
    }

    if (!forceRefresh && teacherRemoteSnapshotPromise) {
        return teacherRemoteSnapshotPromise;
    }

    teacherRemoteSnapshotPromise = (async () => {
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

            if (cachedTeacherRemoteSnapshot) {
                return cachedTeacherRemoteSnapshot;
            }

            throw new Error('Failed to fetch teacher dashboard data');
        }

        if (settingsResult.status === 'rejected') {
            console.warn('[teacher] Failed to load suspended account settings:', settingsResult.reason);
        }

        const nextSnapshot: TeacherRemoteSnapshot = {
            members: membersResult.value,
            sessions: sessionsResult.value,
            settings: settingsResult.status === 'fulfilled' ? settingsResult.value : [],
            fetchedAt: Date.now(),
        };

        cachedTeacherRemoteSnapshot = nextSnapshot;
        return nextSnapshot;
    })();

    try {
        return await teacherRemoteSnapshotPromise;
    } finally {
        teacherRemoteSnapshotPromise = null;
    }
}

export async function fetchAllStudents(options: FetchAllStudentsOptions = {}): Promise<StudentSummary[]> {
    if (!supabase) return [];
    const remoteSnapshot = await fetchTeacherRemoteSnapshot(options.forceRefresh ?? false);
    const members = remoteSnapshot.members;
    const sessions = remoteSnapshot.sessions;
    const settings = remoteSnapshot.settings;

    // Filter out suspended accounts
    const suspendedIds = new Set(settings.filter((setting) => setting.suspended).map((setting) => setting.account_id));

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
        const localMembers = (options.localMembers ?? []).map<TeacherFamilyMemberRow>((member) => ({
            id: member.id,
            account_id: currentAccountId,
            name: member.name,
            class_level: member.classLevel,
            avatar_url: member.avatarUrl ?? null,
        }));
        const localSessions = (options.localSessions ?? []).map<TeacherSessionRow>((session) => ({
            id: session.id,
            account_id: currentAccountId,
            date: session.date,
            started_at: session.startedAt,
            total_seconds: session.totalSeconds,
            exercise_ids: session.exerciseIds ?? [],
            planned_exercise_ids: session.plannedExerciseIds ?? [],
            skipped_ids: session.skippedIds ?? [],
            user_ids: session.userIds ?? [],
            source_menu_id: session.sourceMenuId ?? null,
            source_menu_source: session.sourceMenuSource ?? null,
        }));

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    const { error } = await (supabase.rpc as Function)('teacher_delete_family_member', {
        target_member_id: memberId,
    });
    if (error) throw error;
}
