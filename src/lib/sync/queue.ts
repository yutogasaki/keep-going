import localforage from 'localforage';
import { supabase } from '../supabase';
import { getAccountId } from './authState';

interface SyncQueueEntry {
    id: string;
    table: string;
    operation: 'upsert' | 'delete';
    payload: Record<string, unknown>;
    createdAt: string;
}

const syncQueueDB = localforage.createInstance({ name: 'keepgoing', storeName: 'sync_queue' });

export async function enqueueSyncEntry(entry: Omit<SyncQueueEntry, 'id' | 'createdAt'>): Promise<void> {
    const id = crypto.randomUUID();
    await syncQueueDB.setItem(id, {
        ...entry,
        id,
        createdAt: new Date().toISOString(),
    });
}

export async function processQueue(): Promise<void> {
    if (!supabase || !getAccountId()) {
        return;
    }

    const entries: SyncQueueEntry[] = [];
    await syncQueueDB.iterate<SyncQueueEntry, void>((value) => {
        entries.push(value);
    });

    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    for (const entry of entries) {
        try {
            if (entry.operation === 'upsert') {
                const { error } = await supabase.from(entry.table as any).upsert(entry.payload as any);
                if (error) throw error;
            } else {
                let query = supabase.from(entry.table as any).delete();
                for (const [key, value] of Object.entries(entry.payload)) {
                    query = query.eq(key, value as any);
                }
                const { error } = await query;
                if (error) throw error;
            }

            await syncQueueDB.removeItem(entry.id);
        } catch (error) {
            console.warn(`[sync] Failed to process queue entry ${entry.id}:`, error);
            break;
        }
    }
}

export async function clearSyncQueue(): Promise<void> {
    await syncQueueDB.clear();
}
