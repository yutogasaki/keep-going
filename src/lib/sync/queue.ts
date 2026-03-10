import localforage from 'localforage';
import { supabase } from '../supabase';
import type { TableName } from '../supabase-types';
import { getAccountId } from './authState';

interface SyncQueueEntry {
    id: string;
    table: string;
    operation: 'upsert' | 'delete';
    payload: Record<string, unknown>;
    createdAt: string;
    retryCount?: number;
}

const MAX_RETRIES = 5;
let processing = false;

const syncQueueDB = localforage.createInstance({ name: 'keepgoing', storeName: 'sync_queue' });

export async function enqueueSyncEntry(entry: Omit<SyncQueueEntry, 'id' | 'createdAt'>): Promise<void> {
    const id = crypto.randomUUID();
    await syncQueueDB.setItem(id, {
        ...entry,
        id,
        createdAt: new Date().toISOString(),
    });
}

export async function processQueue(): Promise<{ failed: number; dropped: number }> {
    if (!supabase || !getAccountId()) {
        return { failed: 0, dropped: 0 };
    }

    // Guard against concurrent queue processing (e.g. flaky network triggering multiple 'online' events)
    if (processing) {
        return { failed: 0, dropped: 0 };
    }
    processing = true;

    const entries: SyncQueueEntry[] = [];
    await syncQueueDB.iterate<SyncQueueEntry, void>((value) => {
        entries.push(value);
    });

    entries.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    let failed = 0;
    let dropped = 0;

    try {
        for (const entry of entries) {
            try {
                if (entry.operation === 'upsert') {
                    const { error } = await supabase.from(entry.table as TableName).upsert(entry.payload as never);
                    if (error) throw error;
                } else {
                    let query = supabase.from(entry.table as TableName).delete();
                    for (const [key, value] of Object.entries(entry.payload)) {
                        query = query.eq(key, value as string);
                    }
                    const { error } = await query;
                    if (error) throw error;
                }

                await syncQueueDB.removeItem(entry.id);
            } catch (error) {
                const retryCount = (entry.retryCount ?? 0) + 1;
                if (retryCount >= MAX_RETRIES) {
                    console.warn(`[sync] Dropping queue entry ${entry.id} (${entry.table}/${entry.operation}) after ${MAX_RETRIES} retries:`, error);
                    await syncQueueDB.removeItem(entry.id);
                    dropped++;
                } else {
                    await syncQueueDB.setItem(entry.id, { ...entry, retryCount });
                }
                failed++;
            }
        }
    } finally {
        processing = false;
    }

    return { failed, dropped };
}

export async function clearSyncQueue(): Promise<void> {
    await syncQueueDB.clear();
}
