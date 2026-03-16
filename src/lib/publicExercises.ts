import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync/authState';
import { saveCustomExercise, type CustomExercise } from './db';
import { normalizeExercisePlacement, type ExercisePlacement } from '../data/exercisePlacement';
import { dedupeExercisesByIdentity, pickRecommendedExercises } from './publicExerciseUtils';

type PublicExerciseRow = Database['public']['Tables']['public_exercises']['Row'];
type PublicExerciseSort = 'download_count' | 'created_at';

export interface PublicExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    hasSplit: boolean;
    description: string | null;
    authorName: string;
    accountId: string;
    downloadCount: number;
    sourceCustomExerciseId: string | null;
    preserveWithoutMenu: boolean;
    createdAt: string;
}

interface PublishExerciseOptions {
    sourceCustomExerciseId?: string | null;
    preserveWithoutMenu?: boolean;
}

export function getImportedPublicExerciseId(publicExerciseId: string): string {
    return `imported-ex-${publicExerciseId}`;
}

async function fetchActiveExercises(
    sortBy: PublicExerciseSort,
    limit: number,
): Promise<PublicExercise[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .rpc('fetch_active_public_exercises', { sort_by: sortBy, max_count: limit });

    if (!error && data) {
        return data.map(mapPublicExercise);
    }

    const { data: fallback, error: fallbackErr } = await supabase
        .from('public_exercises')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(limit);

    if (fallbackErr) {
        console.warn(`[publicExercises] fetchActiveExercises(${sortBy}) failed:`, fallbackErr);
        return [];
    }

    return (fallback ?? []).map(mapPublicExercise);
}

// ─── Publish an exercise ────────────────────────────

export async function publishExercise(
    exercise: CustomExercise,
    authorName: string,
    options: PublishExerciseOptions = {},
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const sourceCustomExerciseId = options.sourceCustomExerciseId ?? exercise.id;
    const preserveWithoutMenu = options.preserveWithoutMenu ?? true;
    const existing = await findOwnedPublishedExercise(accountId, exercise, sourceCustomExerciseId);

    const payload = {
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        placement: exercise.placement,
        has_split: exercise.hasSplit ?? false,
        description: exercise.description ?? null,
        author_name: authorName,
        account_id: accountId,
        source_custom_exercise_id: sourceCustomExerciseId,
        preserve_without_menu: existing?.preserveWithoutMenu ?? preserveWithoutMenu,
    };

    if (existing) {
        const { error } = await supabase
            .from('public_exercises')
            .update({
                ...payload,
                preserve_without_menu: existing.preserveWithoutMenu || preserveWithoutMenu,
            })
            .eq('id', existing.id)
            .eq('account_id', accountId);

        if (error) throw error;
        return;
    }

    const { error } = await supabase.from('public_exercises').insert(payload);
    if (error) throw error;
}

// ─── Fetch public exercises ─────────────────────────

export async function fetchPopularExercises(limit = 20): Promise<PublicExercise[]> {
    return dedupeExercisesByIdentity(await fetchActiveExercises('download_count', limit));
}

export async function fetchRecommendedExercises(): Promise<PublicExercise[]> {
    const [popular, newest] = await Promise.all([
        fetchActiveExercises('download_count', 10),
        fetchActiveExercises('created_at', 5),
    ]);

    return pickRecommendedExercises(popular, newest);
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
        id: getImportedPublicExerciseId(pub.id),
        name: pub.name,
        sec: pub.sec,
        emoji: pub.emoji,
        placement: pub.placement,
        hasSplit: pub.hasSplit,
        description: pub.description ?? undefined,
    };

    await saveCustomExercise(localEx);

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

export async function linkPublishedExerciseToSource(
    publicExerciseId: string,
    sourceCustomExerciseId: string,
    options: Pick<PublishExerciseOptions, 'preserveWithoutMenu'> = {},
): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const updates: Database['public']['Tables']['public_exercises']['Update'] = {
        source_custom_exercise_id: sourceCustomExerciseId,
    };
    if (options.preserveWithoutMenu !== undefined) {
        updates.preserve_without_menu = options.preserveWithoutMenu;
    }

    const { error } = await supabase
        .from('public_exercises')
        .update(updates)
        .eq('id', publicExerciseId)
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
        placement: normalizeExercisePlacement(row.placement),
        hasSplit: row.has_split ?? false,
        description: row.description ?? null,
        authorName: row.author_name,
        accountId: row.account_id,
        downloadCount: row.download_count,
        sourceCustomExerciseId: row.source_custom_exercise_id ?? null,
        preserveWithoutMenu: row.preserve_without_menu ?? true,
        createdAt: row.created_at,
    };
}

async function findOwnedPublishedExercise(
    accountId: string,
    exercise: CustomExercise,
    sourceCustomExerciseId: string | null,
): Promise<PublicExercise | null> {
    const myPublished = await fetchMyPublishedExercises();
    const bySource = sourceCustomExerciseId
        ? myPublished.find((published) => published.sourceCustomExerciseId === sourceCustomExerciseId)
        : undefined;
    if (bySource) {
        return bySource;
    }

    const identityKey = `${exercise.name}|${exercise.emoji}|${exercise.sec}|${exercise.placement}|${exercise.hasSplit ? '1' : '0'}`;
    return myPublished.find((published) => (
        published.accountId === accountId
        && `${published.name}|${published.emoji}|${published.sec}|${published.placement}|${published.hasSplit ? '1' : '0'}`
            === identityKey
    )) ?? null;
}
