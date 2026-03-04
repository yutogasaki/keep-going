import localforage from 'localforage';
import { pushSession as syncPushSession, pushCustomExercise as syncPushCustomExercise, deleteCustomExerciseRemote, getAccountId } from './sync';

// Session history record
export interface SessionRecord {
    id: string;
    date: string;        // YYYY-MM-DD
    startedAt: string;   // ISO timestamp
    totalSeconds: number;
    exerciseIds: string[];
    skippedIds: string[]; // internal only
    userIds?: string[];   // For multi-user support
}

// User profile (Legacy, now moving to Zustand for simplicity/sync)
export interface UserProfile {
    classLevel: 'プレ' | '初級' | '中級' | '上級';
    displayName: string;
    createdAt: string;
}

// Custom Exercises
export interface CustomExercise {
    id: string;      // typically starts with 'custom-ex-'
    name: string;
    sec: number;     // e.g. 30, 60
    emoji: string;
    hasSplit?: boolean;
    description?: string;
    creatorId?: string; // If undefined, it's a family shared exercise
}

// DB instances
const historyDB = localforage.createInstance({ name: 'keepgoing', storeName: 'history' });
const profileDB = localforage.createInstance({ name: 'keepgoing', storeName: 'profile' });
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

export function calculateStreak(sessions: SessionRecord[]): number {
    if (sessions.length === 0) return 0;

    // Get unique dates sorted descending
    const dates = Array.from(new Set(sessions.map(s => s.date))).sort().reverse();

    let streak = 0;
    const today = getTodayKey();
    const yesterday = getDateKeyOffset(-1);

    if (dates[0] !== today && dates[0] !== yesterday) {
        return 0; // Streak broken
    }

    let currentDate = dates[0] === today ? today : yesterday;

    // Count consecutive days backwards
    for (const date of dates) {
        if (date === currentDate) {
            streak++;
            currentDate = shiftDateKey(currentDate, -1);
        } else {
            break;
        }
    }

    return streak;
}

// History operations
export async function saveSession(record: SessionRecord): Promise<void> {
    await historyDB.setItem(record.id, record);
    // Dual-write to Supabase if logged in
    if (getAccountId()) {
        syncPushSession(record).catch(console.warn);
    }
}

export async function getSessionsByDate(date: string): Promise<SessionRecord[]> {
    const sessions: SessionRecord[] = [];
    await historyDB.iterate<SessionRecord, void>((value) => {
        if (value.date === date) sessions.push(value);
    });
    return sessions;
}

export async function getAllSessions(): Promise<SessionRecord[]> {
    const sessions: SessionRecord[] = [];
    await historyDB.iterate<SessionRecord, void>((value) => {
        sessions.push(value);
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

// Profile operations
export async function saveProfile(profile: UserProfile): Promise<void> {
    await profileDB.setItem('profile', profile);
}

export async function getProfile(): Promise<UserProfile | null> {
    return await profileDB.getItem<UserProfile>('profile');
}

export async function clearAllData(): Promise<void> {
    await historyDB.clear();
    await profileDB.clear();
    await customExercisesDB.clear();
}

// Custom Exercise operations
export async function saveCustomExercise(ex: CustomExercise): Promise<void> {
    await customExercisesDB.setItem(ex.id, ex);
    if (getAccountId()) {
        syncPushCustomExercise(ex).catch(console.warn);
    }
}

export async function getCustomExercises(): Promise<CustomExercise[]> {
    try {
        const exs: CustomExercise[] = [];
        await customExercisesDB.iterate<CustomExercise, void>((value) => {
            if (value && typeof value === 'object') {
                exs.push(value);
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
        deleteCustomExerciseRemote(id).catch(console.warn);
    }
}

// ─── Direct Write helpers (for cloud restore, bypass sync push) ──
export async function saveSessionDirect(record: SessionRecord): Promise<void> {
    await historyDB.setItem(record.id, record);
}

export async function saveCustomExerciseDirect(ex: CustomExercise): Promise<void> {
    await customExercisesDB.setItem(ex.id, ex);
}

export async function clearHistoryDB(): Promise<void> {
    await historyDB.clear();
}

export async function clearCustomExercisesDB(): Promise<void> {
    await customExercisesDB.clear();
}
