import localforage from 'localforage';
import { getAccountId } from './sync/authState';
import { deleteCustomExerciseRemote, pushCustomExercise as syncPushCustomExercise, pushSession as syncPushSession } from './sync/push';
import { normalizeSessionRecord, type SessionCountMap } from './sessionRecords';
import { useSyncStatus } from '../store/useSyncStatus';
import { normalizeExercisePlacement, type ExercisePlacement } from '../data/exercisePlacement';
import type { SessionMenuSource } from '../store/use-app-store/types';

function onSyncError(error: unknown): void {
    console.warn('[sync]', error);
    useSyncStatus.getState().reportFailure(String(error));
}

// Session history record
export interface SessionRecord {
    id: string;
    date: string;        // YYYY-MM-DD
    startedAt: string;   // ISO timestamp
    totalSeconds: number;
    exerciseIds: string[];
    plannedExerciseIds?: string[];
    skippedIds: string[]; // internal only
    exerciseCounts?: SessionCountMap;
    skippedCounts?: SessionCountMap;
    userIds?: string[];   // For multi-user support
    sourceMenuId?: string | null;
    sourceMenuSource?: SessionMenuSource | null;
    sourceMenuName?: string | null;
}

// Custom Exercises
export interface CustomExercise {
    id: string;      // typically starts with 'custom-ex-'
    name: string;
    sec: number;     // e.g. 30, 60
    emoji: string;
    placement: ExercisePlacement;
    hasSplit?: boolean;
    description?: string;
    creatorId?: string; // If undefined, it's a family shared exercise
}

// DB instances
const historyDB = localforage.createInstance({ name: 'keepgoing', storeName: 'history' });
const customExercisesDB = localforage.createInstance({ name: 'keepgoing', storeName: 'custom_exercises' });

export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseDateKey(dateKey: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);

    return new Date(year, month, day);
}

function normalizeCustomExercise(exercise: CustomExercise | (Omit<CustomExercise, 'placement'> & { placement?: ExercisePlacement })): CustomExercise {
    return {
        ...exercise,
        placement: normalizeExercisePlacement(exercise.placement),
    };
}

export function shiftDateKey(dateKey: string, offsetDays: number): string {
    const base = parseDateKey(dateKey);
    if (!base) return dateKey;
    base.setDate(base.getDate() + offsetDays);
    return formatDateKey(base);
}

// "Today" is defined as 3:00 AM to next 3:00 AM (per spec)
export function getTodayKey(): string {
    const now = new Date();
    // subtract 3 hours to match the app's day-boundary rule
    const adjusted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    return formatDateKey(adjusted);
}

export function getDateKeyOffset(offsetDays: number): string {
    const now = new Date();
    const adjusted = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    adjusted.setDate(adjusted.getDate() + offsetDays);
    return formatDateKey(adjusted);
}

// Accepts any object with a date field (works for SessionRecord and teacher's StudentSession)
export function calculateStreak(sessions: { date: string }[]): number {
    if (sessions.length === 0) return 0;

    // Get unique dates sorted descending
    const dates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();

    const today = getTodayKey();
    const yesterday = getDateKeyOffset(-1);

    if (dates[0] !== today && dates[0] !== yesterday) {
        return 0; // Streak broken
    }

    let streak = 0;
    let currentDate = dates[0] === today ? today : yesterday;

    // Count consecutive days backwards
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

// History operations
export async function saveSession(record: SessionRecord): Promise<void> {
    const normalized = normalizeSessionRecord(record);
    await historyDB.setItem(normalized.id, normalized);
    // Dual-write to Supabase if logged in
    if (getAccountId()) {
        syncPushSession(normalized).catch(onSyncError);
    }
    // Notify listeners (e.g. useHomeSessions) that a new session was saved
    window.dispatchEvent(new Event('sessionSaved'));
}

export async function getSessionsByDate(date: string): Promise<SessionRecord[]> {
    const sessions: SessionRecord[] = [];
    await historyDB.iterate<SessionRecord, void>((value) => {
        if (value.date === date) sessions.push(normalizeSessionRecord(value));
    });
    return sessions;
}

export async function getAllSessions(): Promise<SessionRecord[]> {
    const sessions: SessionRecord[] = [];
    await historyDB.iterate<SessionRecord, void>((value) => {
        sessions.push(normalizeSessionRecord(value));
    });
    return sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function getRecentDays(): Promise<Map<string, SessionRecord[]>> {
    const map = new Map<string, SessionRecord[]>();
    const all = await getAllSessions();

    for (const s of all) {
        const existing = map.get(s.date) || [];
        existing.push(s);
        map.set(s.date, existing);
    }

    return map;
}

export async function clearAllData(): Promise<void> {
    // Cloud: delete user's data from all Supabase tables
    await deleteCloudData();
    // IndexedDB: 'keepgoing' DB 全体を削除（history, custom_exercises, menuGroups, sync_queue）
    await localforage.dropInstance({ name: 'keepgoing' });
    // localStorage: Zustand persist store + sync account
    localStorage.removeItem('keepgoing-app-state');
    localStorage.removeItem('keepgoing_synced_account');
}

const CLOUD_TABLES_TO_CLEAR = [
    'personal_challenges',
    'challenge_enrollments',
    'challenge_completions',
    'exercise_downloads',
    'public_exercises',
    'menu_downloads',
    'public_menus',
    'app_settings',
    'menu_groups',
    'custom_exercises',
    'sessions',
    'family_members',
] as const;

async function deleteCloudData(): Promise<void> {
    const { supabase } = await import('./supabase');
    const accountId = getAccountId();
    if (!supabase || !accountId) return;

    for (const table of CLOUD_TABLES_TO_CLEAR) {
        const { error } = await supabase.from(table).delete().eq('account_id', accountId);
        if (error) {
            console.warn(`[reset] Failed to delete ${table}:`, error.message);
        }
    }
}

// Custom Exercise operations
export async function saveCustomExercise(ex: CustomExercise): Promise<void> {
    const normalized = normalizeCustomExercise(ex);
    await customExercisesDB.setItem(normalized.id, normalized);
    if (getAccountId()) {
        syncPushCustomExercise(normalized).catch(onSyncError);
    }
}

export async function getCustomExercises(): Promise<CustomExercise[]> {
    try {
        const exs: CustomExercise[] = [];
        await customExercisesDB.iterate<CustomExercise, void>((value) => {
            if (value && typeof value === 'object') {
                exs.push(normalizeCustomExercise(value));
            }
        });
        return exs.sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB, 'ja');
        });
    } catch (err) {
        console.warn('Failed to get custom exercises', err);
        return [];
    }
}

export async function deleteCustomExercise(id: string): Promise<void> {
    await customExercisesDB.removeItem(id);
    if (getAccountId()) {
        deleteCustomExerciseRemote(id).catch(onSyncError);
    }
}

// ─── Direct Write helpers (for cloud restore, bypass sync push) ──
export async function saveSessionDirect(record: SessionRecord): Promise<void> {
    const normalized = normalizeSessionRecord(record);
    await historyDB.setItem(normalized.id, normalized);
}

export async function saveCustomExerciseDirect(ex: CustomExercise): Promise<void> {
    const normalized = normalizeCustomExercise(ex);
    await customExercisesDB.setItem(normalized.id, normalized);
}

export async function clearHistoryDB(): Promise<void> {
    await historyDB.clear();
}

export async function clearCustomExercisesDB(): Promise<void> {
    await customExercisesDB.clear();
}
