import { supabase } from './supabase';
import { formatDateKey, shiftDateKey } from './db';

// ─── Types ───────────────────────────────────────────

export interface StudentMember {
    id: string;
    name: string;
    classLevel: string;
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

// ─── Fetch all students ──────────────────────────────

export async function fetchAllStudents(): Promise<StudentSummary[]> {
    if (!supabase) return [];

    const [membersRes, sessionsRes] = await Promise.all([
        supabase.from('family_members').select('id, account_id, name, class_level'),
        supabase
            .from('sessions')
            .select('id, account_id, date, started_at, total_seconds, user_ids')
            .order('date', { ascending: false })
            .limit(5000),
    ]);

    if (membersRes.error || sessionsRes.error) {
        console.error('[teacher] fetch failed:', membersRes.error, sessionsRes.error);
        return [];
    }

    const members = membersRes.data ?? [];
    const sessions = sessionsRes.data ?? [];

    // Group by account_id
    const accountIds = new Set(members.map(m => m.account_id));
    const results: StudentSummary[] = [];

    for (const accountId of accountIds) {
        const acctMembers = members.filter(m => m.account_id === accountId);
        const acctSessions = sessions.filter(s => s.account_id === accountId);

        const streak = calculateStreak(acctSessions);
        const lastActiveDate = acctSessions.length > 0 ? acctSessions[0].date : null;

        results.push({
            accountId,
            members: acctMembers.map(m => ({
                id: m.id,
                name: m.name,
                classLevel: m.class_level,
            })),
            sessions: acctSessions.slice(0, 100).map(s => ({
                id: s.id,
                date: s.date,
                startedAt: s.started_at,
                totalSeconds: s.total_seconds,
                userIds: (s.user_ids as string[]) ?? [],
            })),
            streak,
            totalSessions: acctSessions.length,
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

// ─── Streak calculation (uses shared utilities from db.ts) ────

export function calculateStreak(sessions: { date: string }[]): number {
    if (sessions.length === 0) return 0;

    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();

    // 3AM day boundary
    const now = new Date();
    const adjusted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = formatDateKey(adjusted);
    const yesterday = shiftDateKey(today, -1);

    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 0;
    let currentDate = dates[0] === today ? today : yesterday;

    for (const date of dates) {
        if (date === currentDate) {
            streak++;
            currentDate = shiftDateKey(currentDate, -1);
        } else if (date < currentDate) {
            break;
        }
    }

    return streak;
}
