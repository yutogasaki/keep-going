import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync';
import { saveCustomExercise, type CustomExercise } from './db';

type PublicExerciseRow = Database['public']['Tables']['public_exercises']['Row'];

export interface PublicExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    hasSplit: boolean;
    description: string | null;
    authorName: string;
    accountId: string;
    downloadCount: number;
    createdAt: string;
}

// ─── Publish an exercise ────────────────────────────

export async function publishExercise(exercise: CustomExercise, authorName: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase.from('public_exercises').insert({
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        has_split: exercise.hasSplit ?? false,
        description: exercise.description ?? null,
        author_name: authorName,
        account_id: accountId,
    });

    if (error) throw error;
}

// ─── Fetch popular exercises ────────────────────────

export async function fetchPopularExercises(limit = 20): Promise<PublicExercise[]> {
    if (!supabase) return [];

    // Try RPC first (filters out suspended accounts), fallback to direct query
    const { data, error } = await supabase
        .rpc('fetch_active_public_exercises', { sort_by: 'download_count', max_count: limit });

    if (!error && data) {
        return data.map(mapPublicExercise);
    }

    // Fallback: direct query (RPC not yet deployed)
    const { data: fallback, error: fallbackErr } = await supabase
        .from('public_exercises')
        .select('*')
        .order('download_count', { ascending: false })
        .limit(limit);

    if (fallbackErr) {
        console.warn('[publicExercises] fetchPopularExercises failed:', fallbackErr);
        return [];
    }

    return (fallback ?? []).map(mapPublicExercise);
}

// ─── Fetch my published exercises ───────────────────

export async function fetchMyPublishedExercises(): Promise<PublicExercise[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('public_exercises')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[publicExercises] fetchMyPublishedExercises failed:', error);
        return [];
    }

    return (data ?? []).map(mapPublicExercise);
}

// ─── Import (download) a public exercise ────────────

export async function importExercise(pub: PublicExercise): Promise<void> {
    const localEx: CustomExercise = {
        id: `imported-ex-${pub.id}`,
        name: pub.name,
        sec: pub.sec,
        emoji: pub.emoji,
        hasSplit: pub.hasSplit,
        description: pub.description ?? undefined,
    };

    await saveCustomExercise(localEx);

    // Download count (fire-and-forget)
    tryIncrementDownload(pub.id);
}

async function tryIncrementDownload(exerciseId: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    try {
        await supabase.rpc('try_increment_exercise_download_count', {
            target_exercise_id: exerciseId,
            downloader_account_id: accountId,
        });
    } catch {
        // ignore - download count is best-effort
    }
}

// ─── Unpublish ──────────────────────────────────────

export async function unpublishExercise(id: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase
        .from('public_exercises')
        .delete()
        .eq('id', id)
        .eq('account_id', accountId);

    if (error) throw error;
}

// ─── Mapper ─────────────────────────────────────────

function mapPublicExercise(row: PublicExerciseRow): PublicExercise {
    return {
        id: row.id,
        name: row.name,
        sec: row.sec,
        emoji: row.emoji,
        hasSplit: row.has_split ?? false,
        description: row.description ?? null,
        authorName: row.author_name,
        accountId: row.account_id,
        downloadCount: row.download_count,
        createdAt: row.created_at,
    };
}
