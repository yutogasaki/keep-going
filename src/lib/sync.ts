import localforage from 'localforage';
import { supabase } from './supabase';
import type { SessionRecord, CustomExercise } from './db';
import { getAllSessions, getCustomExercises, saveSessionDirect, saveCustomExerciseDirect, clearHistoryDB, clearCustomExercisesDB } from './db';
import { getCustomGroups, type MenuGroup, saveCustomGroupDirect, clearGroupsDB } from '../data/menuGroups';
import type { UserProfileStore, PastFuwafuwaRecord } from '../store/useAppStore';
import type { ClassLevel } from '../data/exercises';

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

export async function pushSession(record: SessionRecord): Promise<void> {
    if (!_accountId) return;

    const payload = {
        id: record.id,
        account_id: _accountId,
        date: record.date,
        started_at: record.startedAt,
        total_seconds: record.totalSeconds,
        exercise_ids: record.exerciseIds,
        skipped_ids: record.skippedIds,
        user_ids: record.userIds ?? [],
    };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'sessions', operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from('sessions').upsert(payload);
    if (error) {
        console.warn('[sync] pushSession failed, queuing:', error);
        await enqueue({ table: 'sessions', operation: 'upsert', payload });
    }
}

export async function pushFamilyMember(user: UserProfileStore): Promise<void> {
    if (!_accountId) return;

    const payload = {
        id: user.id,
        account_id: _accountId,
        name: user.name,
        class_level: user.classLevel,
        fuwafuwa_birth_date: user.fuwafuwaBirthDate,
        fuwafuwa_type: user.fuwafuwaType,
        fuwafuwa_cycle_count: user.fuwafuwaCycleCount,
        fuwafuwa_name: user.fuwafuwaName,
        past_fuwafuwas: user.pastFuwafuwas,
        notified_fuwafuwa_stages: user.notifiedFuwafuwaStages,
        daily_target_minutes: user.dailyTargetMinutes,
        excluded_exercises: user.excludedExercises,
        required_exercises: user.requiredExercises,
        consumed_magic_date: user.consumedMagicDate ?? null,
        consumed_magic_seconds: user.consumedMagicSeconds ?? 0,
        avatar_url: user.avatarUrl ?? null,
        chibifuwas: user.chibifuwas ?? [],
    };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'family_members', operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from('family_members').upsert(payload);
    if (error) {
        console.warn('[sync] pushFamilyMember failed, queuing:', error);
        await enqueue({ table: 'family_members', operation: 'upsert', payload });
    }
}

export async function deleteFamilyMember(userId: string): Promise<void> {
    if (!_accountId) return;

    const payload = { id: userId, account_id: _accountId };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'family_members', operation: 'delete', payload });
        return;
    }

    const { error } = await supabase.from('family_members').delete().eq('id', userId).eq('account_id', _accountId);
    if (error) {
        console.warn('[sync] deleteFamilyMember failed, queuing:', error);
        await enqueue({ table: 'family_members', operation: 'delete', payload });
    }
}

export async function pushCustomExercise(ex: CustomExercise): Promise<void> {
    if (!_accountId) return;

    const payload = {
        id: ex.id,
        account_id: _accountId,
        name: ex.name,
        sec: ex.sec,
        emoji: ex.emoji,
        has_split: ex.hasSplit ?? false,
        creator_id: ex.creatorId ?? null,
    };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'custom_exercises', operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from('custom_exercises').upsert(payload);
    if (error) {
        console.warn('[sync] pushCustomExercise failed, queuing:', error);
        await enqueue({ table: 'custom_exercises', operation: 'upsert', payload });
    }
}

export async function deleteCustomExerciseRemote(exId: string): Promise<void> {
    if (!_accountId) return;

    const payload = { id: exId, account_id: _accountId };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'custom_exercises', operation: 'delete', payload });
        return;
    }

    const { error } = await supabase.from('custom_exercises').delete().eq('id', exId).eq('account_id', _accountId);
    if (error) {
        console.warn('[sync] deleteCustomExerciseRemote failed, queuing:', error);
        await enqueue({ table: 'custom_exercises', operation: 'delete', payload });
    }
}

export async function pushMenuGroup(group: MenuGroup): Promise<void> {
    if (!_accountId) return;

    const payload = {
        id: group.id,
        account_id: _accountId,
        name: group.name,
        emoji: group.emoji,
        description: group.description,
        exercise_ids: group.exerciseIds,
        is_preset: group.isPreset,
        creator_id: group.creatorId ?? null,
    };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'menu_groups', operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from('menu_groups').upsert(payload);
    if (error) {
        console.warn('[sync] pushMenuGroup failed, queuing:', error);
        await enqueue({ table: 'menu_groups', operation: 'upsert', payload });
    }
}

export async function deleteMenuGroupRemote(groupId: string): Promise<void> {
    if (!_accountId) return;

    const payload = { id: groupId, account_id: _accountId };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'menu_groups', operation: 'delete', payload });
        return;
    }

    const { error } = await supabase.from('menu_groups').delete().eq('id', groupId).eq('account_id', _accountId);
    if (error) {
        console.warn('[sync] deleteMenuGroupRemote failed, queuing:', error);
        await enqueue({ table: 'menu_groups', operation: 'delete', payload });
    }
}

export async function pushAppSettings(settings: {
    onboardingCompleted: boolean;
    soundVolume: number;
    ttsEnabled: boolean;
    bgmEnabled: boolean;
    hapticEnabled: boolean;
    notificationsEnabled: boolean;
    notificationTime: string;
}): Promise<void> {
    if (!_accountId) return;

    const payload = {
        account_id: _accountId,
        onboarding_completed: settings.onboardingCompleted,
        sound_volume: settings.soundVolume,
        tts_enabled: settings.ttsEnabled,
        bgm_enabled: settings.bgmEnabled,
        haptic_enabled: settings.hapticEnabled,
        notifications_enabled: settings.notificationsEnabled,
        notification_time: settings.notificationTime,
    };

    if (!supabase || !isOnline()) {
        await enqueue({ table: 'app_settings', operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from('app_settings').upsert(payload);
    if (error) {
        console.warn('[sync] pushAppSettings failed, queuing:', error);
        await enqueue({ table: 'app_settings', operation: 'upsert', payload });
    }
}

// ─── Initial sync (upload all local data) ────────────
export async function initialSync(
    users: UserProfileStore[],
    settings: {
        onboardingCompleted: boolean;
        soundVolume: number;
        ttsEnabled: boolean;
        bgmEnabled: boolean;
        hapticEnabled: boolean;
        notificationsEnabled: boolean;
        notificationTime: string;
    }
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

        // 2. Map cloud data to local types (merge pastFuwafuwas/chibifuwas by ID to prevent data loss)
        const localUsers = _getStoreState?.().users ?? [];
        const users: UserProfileStore[] = families.map(fm => {
            const localUser = localUsers.find(u => u.id === fm.id);
            const cloudPast = (fm.past_fuwafuwas ?? []) as PastFuwafuwaRecord[];
            const localPast = localUser?.pastFuwafuwas ?? [];
            const mergedPast = [...cloudPast];
            const pastIds = new Set(cloudPast.map(p => p.id));
            for (const lp of localPast) {
                if (!pastIds.has(lp.id)) mergedPast.push(lp);
            }

            const cloudChibi = (fm.chibifuwas ?? []) as import('../store/useAppStore').ChibifuwaRecord[];
            const localChibi = localUser?.chibifuwas ?? [];
            const mergedChibi = [...cloudChibi];
            const chibiIds = new Set(cloudChibi.map(c => c.id));
            for (const lc of localChibi) {
                if (!chibiIds.has(lc.id)) mergedChibi.push(lc);
            }

            return {
                id: fm.id,
                name: fm.name,
                classLevel: fm.class_level as ClassLevel,
                fuwafuwaBirthDate: fm.fuwafuwa_birth_date,
                fuwafuwaType: fm.fuwafuwa_type,
                fuwafuwaCycleCount: fm.fuwafuwa_cycle_count,
                fuwafuwaName: fm.fuwafuwa_name,
                pastFuwafuwas: mergedPast,
                notifiedFuwafuwaStages: (fm.notified_fuwafuwa_stages ?? []) as number[],
                dailyTargetMinutes: fm.daily_target_minutes,
                excludedExercises: fm.excluded_exercises as string[],
                requiredExercises: fm.required_exercises as string[],
                consumedMagicDate: fm.consumed_magic_date ?? undefined,
                consumedMagicSeconds: fm.consumed_magic_seconds ?? 0,
                avatarUrl: fm.avatar_url ?? undefined,
                chibifuwas: mergedChibi,
            };
        });

        const sessions: SessionRecord[] = (sessionsRes.data ?? []).map(s => ({
            id: s.id,
            date: s.date,
            startedAt: s.started_at,
            totalSeconds: s.total_seconds,
            exerciseIds: s.exercise_ids as string[],
            skippedIds: s.skipped_ids as string[],
            userIds: s.user_ids as string[],
        }));

        const exercises: CustomExercise[] = (exercisesRes.data ?? []).map(ex => ({
            id: ex.id,
            name: ex.name,
            sec: ex.sec,
            emoji: ex.emoji,
            hasSplit: ex.has_split ?? false,
            creatorId: ex.creator_id ?? undefined,
        }));

        const groups: MenuGroup[] = (groupsRes.data ?? [])
            .filter((g: any) => !g.is_preset)
            .map((g: any) => ({
                id: g.id,
                name: g.name,
                emoji: g.emoji,
                description: g.description ?? '',
                exerciseIds: g.exercise_ids as string[],
                isPreset: false,
                creatorId: g.creator_id ?? undefined,
            }));

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
            await saveSessionDirect({
                id: cs.id,
                date: cs.date,
                startedAt: cs.started_at,
                totalSeconds: cs.total_seconds,
                exerciseIds: cs.exercise_ids as string[],
                skippedIds: cs.skipped_ids as string[],
                userIds: cs.user_ids as string[],
            });
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
                await saveCustomExerciseDirect({
                    id: ce.id,
                    name: ce.name,
                    sec: ce.sec,
                    emoji: ce.emoji,
                    hasSplit: ce.has_split ?? false,
                    creatorId: ce.creator_id ?? undefined,
                });
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
                await saveCustomGroupDirect({
                    id: cg.id,
                    name: cg.name,
                    emoji: cg.emoji,
                    description: cg.description ?? '',
                    exerciseIds: cg.exercise_ids as string[],
                    isPreset: false,
                    creatorId: cg.creator_id ?? undefined,
                });
            }
        }
    }
}
