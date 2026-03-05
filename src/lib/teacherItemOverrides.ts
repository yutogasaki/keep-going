import { supabase } from './supabase';

export interface TeacherItemOverride {
    id: string;
    itemId: string;
    itemType: 'exercise' | 'menu_group';
    nameOverride: string | null;
    descriptionOverride: string | null;
    emojiOverride: string | null;
    secOverride: number | null;
    hasSplitOverride: boolean | null;
    exerciseIdsOverride: string[] | null;
    createdBy: string;
}

// ─── Cache ───────────────────────────────────────────

let cached: TeacherItemOverride[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function invalidateOverridesCache(): void {
    cached = null;
}

// ─── Fetch ───────────────────────────────────────────

export async function fetchAllTeacherItemOverrides(forceRefresh = false): Promise<TeacherItemOverride[]> {
    if (!supabase) return [];
    if (!forceRefresh && cached && Date.now() - cacheTimestamp < CACHE_TTL) {
        return cached;
    }

    const { data, error } = await supabase
        .from('teacher_item_overrides')
        .select('*');

    if (error) {
        console.warn('[teacherItemOverrides] fetch failed:', error);
        return cached ?? [];
    }

    cached = (data ?? []).map(mapOverride);
    cacheTimestamp = Date.now();
    return cached;
}

// ─── Upsert ─────────────────────────────────────────

export async function upsertTeacherItemOverride(
    itemId: string,
    itemType: 'exercise' | 'menu_group',
    overrides: {
        nameOverride?: string | null;
        descriptionOverride?: string | null;
        emojiOverride?: string | null;
        secOverride?: number | null;
        hasSplitOverride?: boolean | null;
        exerciseIdsOverride?: string[] | null;
    },
    createdBy: string,
): Promise<void> {
    if (!supabase) return;

    const name = overrides.nameOverride?.trim() || null;
    const desc = overrides.descriptionOverride?.trim() || null;
    const emoji = overrides.emojiOverride || null;
    const sec = overrides.secOverride ?? null;
    const hasSplit = overrides.hasSplitOverride ?? null;
    const exerciseIds = overrides.exerciseIdsOverride ?? null;

    // If all overrides are null, delete the override row
    // Note: exerciseIds can be an empty array (valid override), so check with !== null
    const hasAny = name || desc || emoji || sec !== null || hasSplit !== null || exerciseIds !== null;
    if (!hasAny) {
        await supabase
            .from('teacher_item_overrides')
            .delete()
            .eq('item_id', itemId)
            .eq('item_type', itemType);
    } else {
        const { error } = await supabase
            .from('teacher_item_overrides')
            .upsert({
                item_id: itemId,
                item_type: itemType,
                name_override: name,
                description_override: desc,
                emoji_override: emoji,
                sec_override: sec,
                has_split_override: hasSplit,
                exercise_ids_override: exerciseIds,
                created_by: createdBy,
            }, { onConflict: 'item_id,item_type' });

        if (error) throw error;
    }

    invalidateOverridesCache();
}

// ─── Mapper ─────────────────────────────────────────

function mapOverride(row: any): TeacherItemOverride {
    return {
        id: row.id,
        itemId: row.item_id,
        itemType: row.item_type,
        nameOverride: row.name_override,
        descriptionOverride: row.description_override,
        emojiOverride: row.emoji_override ?? null,
        secOverride: row.sec_override ?? null,
        hasSplitOverride: row.has_split_override ?? null,
        exerciseIdsOverride: row.exercise_ids_override ?? null,
        createdBy: row.created_by,
    };
}
