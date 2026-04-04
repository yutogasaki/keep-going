import { supabase } from './supabase';
import type { Database } from './supabase-types';

type TeacherMenuSettingRow = Database['public']['Tables']['teacher_menu_settings']['Row'];

export type MenuSettingStatus = 'required' | 'optional' | 'excluded' | 'hidden';
export type MenuSettingItemType = 'exercise' | 'menu_group';

export interface TeacherMenuSetting {
    id: string;
    itemId: string;
    itemType: MenuSettingItemType;
    classLevel: string;
    status: MenuSettingStatus;
    createdBy: string;
}

// ─── Cache ───────────────────────────────────────────

let cachedSettings: TeacherMenuSetting[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateSettingsCache(): void {
    cachedSettings = null;
}

// ─── Fetch ───────────────────────────────────────────

export async function fetchAllTeacherMenuSettings(forceRefresh = false): Promise<TeacherMenuSetting[]> {
    if (!supabase) return [];
    if (!forceRefresh && cachedSettings && Date.now() - cacheTimestamp < CACHE_TTL) {
        return cachedSettings;
    }

    const { data, error } = await supabase
        .from('teacher_menu_settings')
        .select('*');

    if (error) {
        console.warn('[teacherMenuSettings] fetch failed:', error);
        return cachedSettings ?? [];
    }

    cachedSettings = (data ?? []).map(mapSetting);
    cacheTimestamp = Date.now();
    return cachedSettings;
}

export async function fetchTeacherMenuSettingsForClass(classLevel: string, forceRefresh = false): Promise<TeacherMenuSetting[]> {
    const all = await fetchAllTeacherMenuSettings(forceRefresh);
    return all.filter(s => s.classLevel === classLevel);
}

// ─── Upsert / Delete ─────────────────────────────────

export async function upsertTeacherMenuSetting(
    itemId: string,
    itemType: MenuSettingItemType,
    classLevel: string,
    status: MenuSettingStatus,
    createdBy: string,
): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
        .from('teacher_menu_settings')
        .upsert({
            item_id: itemId,
            item_type: itemType,
            class_level: classLevel,
            status,
            created_by: createdBy,
        }, { onConflict: 'item_id,item_type,class_level' });

    if (error) throw error;

    invalidateSettingsCache();
}

// ─── Mapper ──────────────────────────────────────────

function mapSetting(row: TeacherMenuSettingRow): TeacherMenuSetting {
    return {
        id: row.id,
        itemId: row.item_id,
        itemType: row.item_type as MenuSettingItemType,
        classLevel: row.class_level,
        status: row.status as MenuSettingStatus,
        createdBy: row.created_by,
    };
}
