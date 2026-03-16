// CRUD operations for custom menu groups (localforage + Supabase sync)
// Preset data and types remain in src/data/menuGroups.ts
import localforage from 'localforage';
import type { MenuGroup } from '../data/menuGroups';
import { getAccountId } from './sync/authState';
import { deleteMenuGroupRemote, pushMenuGroup } from './sync/push';
import { useSyncStatus } from '../store/useSyncStatus';
import { dispatchCustomContentUpdated } from './customContentEvents';

function onSyncError(error: unknown): void {
    console.warn('[sync]', error);
    useSyncStatus.getState().reportFailure(String(error));
}

const groupsDB = localforage.createInstance({ name: 'keepgoing', storeName: 'menuGroups' });

export async function getCustomGroups(): Promise<MenuGroup[]> {
    const groups: MenuGroup[] = [];
    await groupsDB.iterate<MenuGroup, void>((value) => {
        groups.push(value);
    });
    return groups.sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveCustomGroup(group: MenuGroup): Promise<void> {
    const saved = { ...group, isPreset: false };
    await groupsDB.setItem(group.id, saved);
    dispatchCustomContentUpdated();
    if (getAccountId()) {
        pushMenuGroup(saved).catch(onSyncError);
    }
}

export async function deleteCustomGroup(id: string): Promise<void> {
    await groupsDB.removeItem(id);
    dispatchCustomContentUpdated();
    if (getAccountId()) {
        deleteMenuGroupRemote(id).catch(onSyncError);
    }
}

// ─── Direct Write helpers (for cloud restore, bypass sync push) ──
export async function saveCustomGroupDirect(group: MenuGroup): Promise<void> {
    await groupsDB.setItem(group.id, { ...group, isPreset: false });
}

export async function clearGroupsDB(): Promise<void> {
    await groupsDB.clear();
}
