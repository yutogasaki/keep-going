import localforage from 'localforage';
import { supabase } from './supabase';
import type { SessionRecord, CustomExercise } from './db';
import { getAllSessions, getCustomExercises, saveSessionDirect, saveCustomExerciseDirect, clearHistoryDB, clearCustomExercisesDB } from './db';
import { getCustomGroups, type MenuGroup, saveCustomGroupDirect, clearGroupsDB } from '../data/menuGroups';
import type { UserProfileStore } from '../store/useAppStore';
import {
    type AppSettingsInput,
    toAppSettingsUpsertPayload,
    toCustomExerciseUpsertPayload,
    toFamilyMemberUpsertPayload,
    toLocalCustomExercise,
    toLocalCustomMenuGroup,
    toLocalSessionRecord,
    toLocalUserFromCloudFamily,
    toMenuGroupUpsertPayload,
    toSessionUpsertPayload,
} from './sync/mappers';

// ─── Store accessor (avoids circular import) ────────
// Set by useAppStore.ts at module init time
let _getStoreState: (() => { users: UserProfileStore[];[key: string]: any }) | null = null;
let _setStoreState: ((partial: Record<string, any>) => void) | null = null;

export function registerStoreAccessor(
    getState: () => any,
    setState: (partial: Record<string, any>) => void,
) {
    _getStoreState = getState;
    _setStoreState = setState;
}

// ─── Auth state (set by AuthContext) ─────────────────
let _accountId: string | null = null;
let _isPulling = false;

export function setAccountId(id: string | null) {
    _accountId = id;
}

export function getAccountId(): string | null {
    return _accountId;
}

export function isPulling(): boolean {
    return _isPulling;
}

// ─── Offline sync queue ──────────────────────────────
interface SyncQueueEntry {
    id: string;
    table: string;
    operation: 'upsert' | 'delete';
    payload: Record<string, unknown>;
    createdAt: string;
}

const syncQueueDB = localforage.createInstance({ name: 'keepgoing', storeName: 'sync_queue' });

async function enqueue(entry: Omit<SyncQueueEntry, 'id' | 'createdAt'>): Promise<void> {
    const id = crypto.randomUUID();
    await syncQueueDB.setItem(id, {
        ...entry,
        id,
        createdAt: new Date().toISOString(),
    });
}

export async function processQueue(): Promise<void> {
    if (!supabase || !_accountId) return;

    const entries: SyncQueueEntry[] = [];
    await syncQueueDB.iterate<SyncQueueEntry, void>((value) => {
        entries.push(value);
    });

    // Process in chronological order
    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const entry of entries) {
        try {
            if (entry.operation === 'upsert') {
                const { error } = await supabase.from(entry.table as any).upsert(entry.payload as any);
                if (error) throw error;
            } else if (entry.operation === 'delete') {
                let query = supabase.from(entry.table as any).delete();
                for (const [key, value] of Object.entries(entry.payload)) {
                    query = query.eq(key, value as any);
                }
                const { error } = await query;
                if (error) throw error;
            }
            await syncQueueDB.removeItem(entry.id);
        } catch (err) {
            console.warn(`[sync] Failed to process queue entry ${entry.id}:`, err);
            // Leave in queue for retry
            break;
        }
    }
}

// ─── Push helpers (called after local writes) ────────
function isOnline(): boolean {
    return navigator.onLine;
}

async function upsertWithQueue(
    table: string,
    payload: Record<string, unknown>,
    logLabel: string,
): Promise<void> {
    if (!supabase || !isOnline()) {
        await enqueue({ table, operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from(table as any).upsert(payload as any);
    if (error) {
        console.warn(`[sync] ${logLabel} failed, queuing:`, error);
        await enqueue({ table, operation: 'upsert', payload });
    }
}

async function deleteWithQueue(
    table: string,
    payload: Record<string, unknown>,
    logLabel: string,
): Promise<void> {
    if (!supabase || !isOnline()) {
        await enqueue({ table, operation: 'delete', payload });
        return;
    }

    let query = supabase.from(table as any).delete();
    for (const [key, value] of Object.entries(payload)) {
        query = query.eq(key, value as any);
    }
    const { error } = await query;
    if (error) {
        console.warn(`[sync] ${logLabel} failed, queuing:`, error);
        await enqueue({ table, operation: 'delete', payload });
    }
}

export async function pushSession(record: SessionRecord): Promise<void> {
    if (!_accountId) return;
    const payload = toSessionUpsertPayload(record, _accountId);
    await upsertWithQueue('sessions', payload, 'pushSession');
}

export async function pushFamilyMember(user: UserProfileStore): Promise<void> {
    if (!_accountId) return;
    const payload = toFamilyMemberUpsertPayload(user, _accountId);
    await upsertWithQueue('family_members', payload, 'pushFamilyMember');
}

export async function deleteFamilyMember(userId: string): Promise<void> {
    if (!_accountId) return;

    const payload = { id: userId, account_id: _accountId };
    await deleteWithQueue('family_members', payload, 'deleteFamilyMember');
}

export async function pushCustomExercise(ex: CustomExercise): Promise<void> {
    if (!_accountId) return;
    const payload = toCustomExerciseUpsertPayload(ex, _accountId);
    await upsertWithQueue('custom_exercises', payload, 'pushCustomExercise');
}

export async function deleteCustomExerciseRemote(exId: string): Promise<void> {
    if (!_accountId) return;

    const payload = { id: exId, account_id: _accountId };
    await deleteWithQueue('custom_exercises', payload, 'deleteCustomExerciseRemote');
}

export async function pushMenuGroup(group: MenuGroup): Promise<void> {
    if (!_accountId) return;
    const payload = toMenuGroupUpsertPayload(group, _accountId);
    await upsertWithQueue('menu_groups', payload, 'pushMenuGroup');
}

export async function deleteMenuGroupRemote(groupId: string): Promise<void> {
    if (!_accountId) return;

    const payload = { id: groupId, account_id: _accountId };
    await deleteWithQueue('menu_groups', payload, 'deleteMenuGroupRemote');
}

export async function pushAppSettings(settings: AppSettingsInput): Promise<void> {
    if (!_accountId) return;
    const payload = toAppSettingsUpsertPayload(settings, _accountId);
    await upsertWithQueue('app_settings', payload, 'pushAppSettings');
}

// ─── Initial sync (upload all local data) ────────────
export async function initialSync(
    users: UserProfileStore[],
    settings: AppSettingsInput
): Promise<void> {
    if (!supabase || !_accountId) return;

    console.log('[sync] Starting initial sync...');

    // 1. Push family members
    for (const user of users) {
        await pushFamilyMember(user);
    }

    // 2. Push all sessions
    const sessions = await getAllSessions();
    for (const session of sessions) {
        await pushSession(session);
    }

    // 3. Push custom exercises
    const exercises = await getCustomExercises();
    for (const ex of exercises) {
        await pushCustomExercise(ex);
    }

    // 4. Push custom menu groups
    const groups = await getCustomGroups();
    for (const group of groups) {
        if (!group.isPreset) {
            await pushMenuGroup(group);
        }
    }

    // 5. Push settings
    await pushAppSettings(settings);

    // 6. Process any queued items
    await processQueue();

    console.log('[sync] Initial sync complete.');
}

// ─── Online listener ─────────────────────────────────
export function setupOnlineListener(): () => void {
    const handler = () => {
        if (navigator.onLine && _accountId) {
            processQueue().catch(console.warn);
        }
    };
    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
}

// ─── Sync queue management ──────────────────────────
export async function clearSyncQueue(): Promise<void> {
    await syncQueueDB.clear();
}

// ─── Data detection ─────────────────────────────────
export async function hasCloudData(accountId: string): Promise<boolean> {
    if (!supabase) return false;
    const { count, error } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', accountId);
    if (error) {
        console.warn('[sync] hasCloudData check failed:', error);
        return false;
    }
    return (count ?? 0) > 0;
}

export async function hasLocalData(): Promise<boolean> {
    if (_getStoreState) {
        const state = _getStoreState();
        if (state.users.length > 0) return true;
    }
    // Also check IndexedDB for orphaned sessions
    const sessions = await getAllSessions();
    return sessions.length > 0;
}

export type ConflictScenario =
    | 'no_conflict_push'   // local data exists, no cloud data -> push
    | 'no_conflict_pull'   // no local data, cloud data exists -> pull
    | 'conflict'           // both exist -> user must choose
    | 'nothing';           // neither exists

export async function detectConflict(accountId: string): Promise<ConflictScenario> {
    const [local, cloud] = await Promise.all([
        hasLocalData(),
        hasCloudData(accountId),
    ]);

    if (local && cloud) return 'conflict';
    if (local && !cloud) return 'no_conflict_push';
    if (!local && cloud) return 'no_conflict_pull';
    return 'nothing';
}

// ─── Pull (cloud → local restore) ───────────────────
export interface PullResult {
    success: boolean;
    error?: string;
    hadData: boolean;
}

export async function pullAllData(accountId: string): Promise<PullResult> {
    if (!supabase) return { success: false, error: 'Supabase not configured', hadData: false };

    _isPulling = true;
    try {
        console.log('[sync] Starting pull...');

        // 1. Fetch all cloud data in parallel (verify all succeed before writing locally)
        const [familyRes, sessionsRes, exercisesRes, groupsRes, settingsRes] = await Promise.all([
            supabase.from('family_members').select('*').eq('account_id', accountId),
            supabase.from('sessions').select('*').eq('account_id', accountId),
            supabase.from('custom_exercises').select('*').eq('account_id', accountId),
            supabase.from('menu_groups').select('*').eq('account_id', accountId),
            supabase.from('app_settings').select('*').eq('account_id', accountId).maybeSingle(),
        ]);

        if (familyRes.error) throw new Error(`family_members: ${familyRes.error.message}`);
        if (sessionsRes.error) throw new Error(`sessions: ${sessionsRes.error.message}`);
        if (exercisesRes.error) throw new Error(`custom_exercises: ${exercisesRes.error.message}`);
        if (groupsRes.error) throw new Error(`menu_groups: ${groupsRes.error.message}`);

        const families = familyRes.data ?? [];
        if (families.length === 0) {
            return { success: true, hadData: false };
        }

        // 2. Map cloud data to local types
        const localUsers = _getStoreState?.().users ?? [];
        const users: UserProfileStore[] = families.map((family) => {
            const localUser = localUsers.find((targetUser) => targetUser.id === family.id);
            return toLocalUserFromCloudFamily(family, localUser);
        });

        const sessions: SessionRecord[] = (sessionsRes.data ?? []).map(toLocalSessionRecord);
        const exercises: CustomExercise[] = (exercisesRes.data ?? []).map(toLocalCustomExercise);
        const groups: MenuGroup[] = (groupsRes.data ?? [])
            .filter((group: any) => !group.is_preset)
            .map(toLocalCustomMenuGroup);

        const cloudSettings = settingsRes.data;

        // 3. Write everything locally (clear + write pattern)
        await clearHistoryDB();
        for (const session of sessions) {
            await saveSessionDirect(session);
        }

        await clearCustomExercisesDB();
        for (const ex of exercises) {
            await saveCustomExerciseDirect(ex);
        }

        await clearGroupsDB();
        for (const group of groups) {
            await saveCustomGroupDirect(group);
        }

        // 4. Write to Zustand (triggers persist to localStorage automatically)
        if (!_setStoreState) throw new Error('Store accessor not registered');
        const localState = _getStoreState?.() ?? {};
        // Merge settings: use cloud values if available, otherwise preserve local values
        _setStoreState({
            users,
            sessionUserIds: [users[0]?.id].filter(Boolean),
            onboardingCompleted: cloudSettings?.onboarding_completed ?? (localState as any).onboardingCompleted ?? true,
            soundVolume: cloudSettings?.sound_volume ?? (localState as any).soundVolume ?? 1.0,
            ttsEnabled: cloudSettings?.tts_enabled ?? (localState as any).ttsEnabled ?? true,
            bgmEnabled: cloudSettings?.bgm_enabled ?? (localState as any).bgmEnabled ?? true,
            hapticEnabled: cloudSettings?.haptic_enabled ?? (localState as any).hapticEnabled ?? true,
            notificationsEnabled: cloudSettings?.notifications_enabled ?? (localState as any).notificationsEnabled ?? false,
            notificationTime: cloudSettings?.notification_time ?? (localState as any).notificationTime ?? '21:00',
        });

        console.log('[sync] Pull complete.');
        return { success: true, hadData: true };
    } catch (err) {
        console.error('[sync] pullAllData failed:', err);
        return { success: false, error: String(err), hadData: false };
    } finally {
        _isPulling = false;
    }
}

// ─── Merge append-only data (union by ID, no data loss) ──
export async function mergeAppendData(accountId: string): Promise<void> {
    if (!supabase || !accountId) return;

    // 1. Sessions: bidirectional merge in single fetch
    const localSessions = await getAllSessions();
    const { data: cloudSessions } = await supabase
            .from('sessions')
            .select('*')
            .eq('account_id', accountId);

    const cloudSessionIds = new Set((cloudSessions ?? []).map((s: any) => s.id));
    const localSessionIds = new Set(localSessions.map(s => s.id));

    // Push local-only to cloud
    for (const session of localSessions) {
        if (!cloudSessionIds.has(session.id)) {
            await pushSession(session);
        }
    }

    // Pull cloud-only to local
    for (const cs of cloudSessions ?? []) {
        if (!localSessionIds.has(cs.id)) {
            await saveSessionDirect(toLocalSessionRecord(cs));
        }
    }

    // 2. Custom exercises: merge by ID
    const localExercises = await getCustomExercises();
    const { data: cloudExercises } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('account_id', accountId);
    if (cloudExercises) {
        const localExIds = new Set(localExercises.map(e => e.id));
        for (const ce of cloudExercises) {
            if (!localExIds.has(ce.id)) {
                await saveCustomExerciseDirect(toLocalCustomExercise(ce));
            }
        }
    }

    // 3. Menu groups: merge by ID (non-preset only)
    const localGroups = await getCustomGroups();
    const { data: cloudGroups } = await supabase
        .from('menu_groups')
        .select('*')
        .eq('account_id', accountId);
    if (cloudGroups) {
        const localGroupIds = new Set(localGroups.map(g => g.id));
        for (const cg of cloudGroups) {
            if (!cg.is_preset && !localGroupIds.has(cg.id)) {
                await saveCustomGroupDirect(toLocalCustomMenuGroup(cg));
            }
        }
    }
}
