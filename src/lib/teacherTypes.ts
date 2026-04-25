import type { SessionMenuSource } from '@/store/use-app-store/types';
import type { Database } from './supabase-types';
import type { SessionRecord } from './db';

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
    exerciseIds: string[];
    plannedExerciseIds?: string[];
    skippedIds: string[];
    userIds: string[];
    sourceMenuId?: string | null;
    sourceMenuSource?: SessionMenuSource | null;
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

export interface LocalStudentSessionSnapshot extends Pick<
    SessionRecord,
    'id' | 'date' | 'startedAt' | 'totalSeconds' | 'exerciseIds' | 'plannedExerciseIds' | 'skippedIds'
> {
    userIds?: string[];
    sourceMenuId?: string | null;
    sourceMenuSource?: SessionMenuSource | null;
}

export type TeacherFamilyMemberRow = Pick<
    Database['public']['Tables']['family_members']['Row'],
    'id' | 'account_id' | 'name' | 'class_level' | 'avatar_url'
>;

export type TeacherSessionRow = Pick<
    Database['public']['Tables']['sessions']['Row'],
    | 'id'
    | 'account_id'
    | 'date'
    | 'started_at'
    | 'total_seconds'
    | 'exercise_ids'
    | 'planned_exercise_ids'
    | 'skipped_ids'
    | 'user_ids'
    | 'source_menu_id'
    | 'source_menu_source'
>;

export type TeacherAppSettingsRow = Pick<
    Database['public']['Tables']['app_settings']['Row'],
    'account_id' | 'suspended'
>;

export interface FetchAllStudentsOptions {
    currentAccountId?: string | null;
    localMembers?: LocalStudentMemberSnapshot[];
    localSessions?: LocalStudentSessionSnapshot[];
    forceRefresh?: boolean;
}

export interface TeacherRemoteSnapshot {
    members: TeacherFamilyMemberRow[];
    sessions: TeacherSessionRow[];
    settings: TeacherAppSettingsRow[];
    fetchedAt: number;
}
