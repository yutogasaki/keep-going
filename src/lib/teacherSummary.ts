import { calculateStreak } from './db';
import type { StudentSummary, TeacherFamilyMemberRow, TeacherSessionRow } from './teacherTypes';
import type { SessionMenuSource } from '@/store/use-app-store/types';

function normalizeSessionMenuSource(value: string | null | undefined): SessionMenuSource | null {
    return value === 'preset' || value === 'teacher' || value === 'custom' || value === 'public' ? value : null;
}

export function sortTeacherSessions<T extends Pick<TeacherSessionRow, 'date' | 'started_at'>>(sessions: T[]): T[] {
    return [...sessions].sort((left, right) => {
        const dateCompare = right.date.localeCompare(left.date);
        if (dateCompare !== 0) {
            return dateCompare;
        }
        return right.started_at.localeCompare(left.started_at);
    });
}

export function mergeRowsById<T extends { id: string }>(remoteRows: T[], localRows: T[]): T[] {
    const merged = new Map(remoteRows.map((row) => [row.id, row]));
    for (const row of localRows) {
        merged.set(row.id, row);
    }
    return [...merged.values()];
}

export function buildStudentSummary(
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
            exerciseIds: session.exercise_ids ?? [],
            plannedExerciseIds: session.planned_exercise_ids ?? [],
            skippedIds: session.skipped_ids ?? [],
            userIds: session.user_ids ?? [],
            sourceMenuId: session.source_menu_id ?? null,
            sourceMenuSource: normalizeSessionMenuSource(session.source_menu_source),
        })),
        streak,
        totalSessions: sortedSessions.length,
        lastActiveDate,
    };
}
