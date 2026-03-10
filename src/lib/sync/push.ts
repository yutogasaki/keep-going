import { supabase } from '../supabase';
import type { TableName } from '../supabase-types';
import type { CustomExercise, SessionRecord } from '../db';
import type { MenuGroup } from '../../data/menuGroups';
import type { UserProfileStore } from '../../store/useAppStore';
import {
    type AppSettingsInput,
    toAppSettingsUpsertPayload,
    toCustomExerciseUpsertPayload,
    toFamilyMemberUpsertPayload,
    toMenuGroupUpsertPayload,
    toSessionUpsertPayload,
} from './mappers';
import { getAccountId } from './authState';
import { enqueueSyncEntry } from './queue';

function isOnline(): boolean {
    return navigator.onLine;
}

async function upsertWithQueue(
    table: string,
    payload: Record<string, unknown>,
    logLabel: string,
): Promise<void> {
    if (!supabase || !isOnline()) {
        await enqueueSyncEntry({ table, operation: 'upsert', payload });
        return;
    }

    const { error } = await supabase.from(table as TableName).upsert(payload as never);
    if (error) {
        console.warn(`[sync] ${logLabel} failed, queuing:`, error);
        await enqueueSyncEntry({ table, operation: 'upsert', payload });
    }
}

async function deleteWithQueue(
    table: string,
    payload: Record<string, unknown>,
    logLabel: string,
): Promise<void> {
    if (!supabase || !isOnline()) {
        await enqueueSyncEntry({ table, operation: 'delete', payload });
        return;
    }

    let query = supabase.from(table as TableName).delete();
    for (const [key, value] of Object.entries(payload)) {
        query = query.eq(key, value as string);
    }

    const { error } = await query;
    if (error) {
        console.warn(`[sync] ${logLabel} failed, queuing:`, error);
        await enqueueSyncEntry({ table, operation: 'delete', payload });
    }
}

export async function pushSession(record: SessionRecord): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] pushSession skipped: no accountId');
        return;
    }

    const payload = toSessionUpsertPayload(record, accountId);
    await upsertWithQueue('sessions', payload, 'pushSession');
}

export async function pushFamilyMember(user: UserProfileStore): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] pushFamilyMember skipped: no accountId');
        return;
    }

    const payload = toFamilyMemberUpsertPayload(user, accountId);
    await upsertWithQueue('family_members', payload, 'pushFamilyMember');
}

export async function deleteFamilyMember(userId: string): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] deleteFamilyMember skipped: no accountId');
        return;
    }

    const payload = { id: userId, account_id: accountId };
    await deleteWithQueue('family_members', payload, 'deleteFamilyMember');
}

export async function pushCustomExercise(exercise: CustomExercise): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] pushCustomExercise skipped: no accountId');
        return;
    }

    const payload = toCustomExerciseUpsertPayload(exercise, accountId);
    await upsertWithQueue('custom_exercises', payload, 'pushCustomExercise');
}

export async function deleteCustomExerciseRemote(exerciseId: string): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] deleteCustomExerciseRemote skipped: no accountId');
        return;
    }

    const payload = { id: exerciseId, account_id: accountId };
    await deleteWithQueue('custom_exercises', payload, 'deleteCustomExerciseRemote');
}

export async function pushMenuGroup(group: MenuGroup): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] pushMenuGroup skipped: no accountId');
        return;
    }

    const payload = toMenuGroupUpsertPayload(group, accountId);
    await upsertWithQueue('menu_groups', payload, 'pushMenuGroup');
}

export async function deleteMenuGroupRemote(groupId: string): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] deleteMenuGroupRemote skipped: no accountId');
        return;
    }

    const payload = { id: groupId, account_id: accountId };
    await deleteWithQueue('menu_groups', payload, 'deleteMenuGroupRemote');
}

export async function pushAppSettings(settings: AppSettingsInput): Promise<void> {
    const accountId = getAccountId();
    if (!accountId) {
        console.warn('[sync] pushAppSettings skipped: no accountId');
        return;
    }

    const payload = toAppSettingsUpsertPayload(settings, accountId);
    await upsertWithQueue('app_settings', payload, 'pushAppSettings');
}
