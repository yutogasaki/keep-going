import { supabase } from '../supabase';
import { getAllSessions } from '../db';
import { getRegisteredStoreState } from './storeAccess';

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
    const state = getRegisteredStoreState();
    if (state && state.users.length > 0) {
        return true;
    }

    const sessions = await getAllSessions();
    return sessions.length > 0;
}

export type ConflictScenario =
    | 'no_conflict_push'
    | 'no_conflict_pull'
    | 'conflict'
    | 'nothing';

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
