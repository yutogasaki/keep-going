import { supabase } from './supabase';

export interface TeacherItemOverride {
    id: string;
    itemId: string;
    itemType: 'exercise' | 'menu_group';
    nameOverride: string | null;
    descriptionOverride: string | null;
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
    nameOverride: string | null,
    descriptionOverride: string | null,
    createdBy: string,
): Promise<void> {
    if (!supabase) return;

    // If both are null/empty, delete the override row
    const hasName = nameOverride && nameOverride.trim().length > 0;
    const hasDesc = descriptionOverride && descriptionOverride.trim().length > 0;

    if (!hasName && !hasDesc) {
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
                name_override: hasName ? nameOverride!.trim() : null,
                description_override: hasDesc ? descriptionOverride!.trim() : null,
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
        createdBy: row.created_by,
    };
}
