import localforage from 'localforage';
import { supabase } from './supabase';
import type { SessionRecord, CustomExercise } from './db';
import { getAllSessions, getCustomExercises } from './db';
import { getCustomGroups, type MenuGroup } from '../data/menuGroups';
import type { UserProfileStore } from '../store/useAppStore';

// ─── Auth state (set by AuthContext) ─────────────────
let _accountId: string | null = null;

export function setAccountId(id: string | null) {
    _accountId = id;
}

export function getAccountId(): string | null {
    return _accountId;
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
                const { id: _id, ...filters } = entry.payload;
                let query = supabase.from(entry.table as any).delete();
                for (const [key, value] of Object.entries(filters)) {
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
