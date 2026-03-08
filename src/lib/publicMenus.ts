import { supabase } from './supabase';
import type { Database } from './supabase-types';
import type { MenuGroup } from '../data/menuGroups';
import { saveCustomGroup } from './customGroups';
import { getAccountId } from './sync';

type PublicMenuRow = Database['public']['Tables']['public_menus']['Row'];
import { getCustomExercises, saveCustomExercise, type CustomExercise } from './db';
import { EXERCISES } from '../data/exercises';
import { publishExercise, fetchMyPublishedExercises, unpublishExercise } from './publicExercises';

export interface CustomExerciseData {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: CustomExercise['placement'];
    hasSplit?: boolean;
}

export interface PublicMenu {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    customExerciseData: CustomExerciseData[];
    authorName: string;
    accountId: string;
    downloadCount: number;
    createdAt: string;
}

// ─── Publish a menu ─────────────────────────────────

export async function publishMenu(menu: MenuGroup, authorName: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    // 独自種目を抽出してデータを含める
    const customIds = menu.exerciseIds.filter(id => !EXERCISES.find(e => e.id === id));
    let customExerciseData: CustomExerciseData[] = [];
    if (customIds.length > 0) {
        const allCustom = await getCustomExercises();
        const uniqueIds = [...new Set(customIds)];
        customExerciseData = uniqueIds
            .map(id => allCustom.find(ex => ex.id === id))
            .filter((ex): ex is CustomExercise => !!ex)
            .map(ex => ({
                id: ex.id,
                name: ex.name,
                sec: ex.sec,
                emoji: ex.emoji,
                placement: ex.placement,
                hasSplit: ex.hasSplit,
            }));
    }

    // Auto-publish custom exercises (must succeed before menu publish)
    if (customExerciseData.length > 0) {
        const myPublished = await fetchMyPublishedExercises();
        for (const ex of customExerciseData) {
            const alreadyPublished = myPublished.find(
                p => p.name === ex.name && p.emoji === ex.emoji && p.sec === ex.sec && p.placement === ex.placement,
            );
            if (!alreadyPublished) {
                await publishExercise(
                    {
                        id: ex.id,
                        name: ex.name,
                        sec: ex.sec,
                        emoji: ex.emoji,
                        placement: ex.placement,
                        hasSplit: ex.hasSplit,
                    },
                    authorName,
                );
            }
        }
    }

    const { error } = await supabase.from('public_menus').insert({
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exercise_ids: menu.exerciseIds,
        custom_exercise_data: customExerciseData,
        author_name: authorName,
        account_id: accountId,
    });

    if (error) throw error;
}

// ─── Fetch popular menus ────────────────────────────

export async function fetchPopularMenus(limit = 10): Promise<PublicMenu[]> {
    if (!supabase) return [];

    // Try RPC first (filters out suspended accounts), fallback to direct query
    const { data, error } = await supabase
        .rpc('fetch_active_public_menus', { sort_by: 'download_count', max_count: limit });

    if (!error && data) {
        return data.map(mapPublicMenu);
    }

    // Fallback: direct query (RPC not yet deployed)
    const { data: fallback, error: fallbackErr } = await supabase
        .from('public_menus')
        .select('*')
        .order('download_count', { ascending: false })
        .limit(limit);

    if (fallbackErr) {
        console.warn('[publicMenus] fetchPopularMenus failed:', fallbackErr);
        return [];
    }

    return (fallback ?? []).map(mapPublicMenu);
}

// ─── Fetch recommended menus (algorithm: trending + newest + popular) ──

export async function fetchRecommendedMenus(): Promise<PublicMenu[]> {
    if (!supabase) return [];

    // Try RPC first, fallback to direct queries
    const [popularRes, newestRes] = await Promise.all([
        supabase.rpc('fetch_active_public_menus', { sort_by: 'download_count', max_count: 10 }),
        supabase.rpc('fetch_active_public_menus', { sort_by: 'created_at', max_count: 5 }),
    ]);

    let popular: PublicMenu[];
    let newest: PublicMenu[];

    if (!popularRes.error && popularRes.data) {
        popular = popularRes.data.map(mapPublicMenu);
        newest = (newestRes.data ?? []).map(mapPublicMenu);
    } else {
        // Fallback: direct queries (RPC not yet deployed)
        const [popFb, newFb] = await Promise.all([
            supabase.from('public_menus').select('*').order('download_count', { ascending: false }).limit(10),
            supabase.from('public_menus').select('*').order('created_at', { ascending: false }).limit(5),
        ]);
        popular = (popFb.data ?? []).map(mapPublicMenu);
        newest = (newFb.data ?? []).map(mapPublicMenu);
    }
    // Trending: filter popular list for recently created
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const trending = popular.filter(m => m.createdAt >= oneWeekAgo);

    // Pick one from each category, deduplicating
    const result: PublicMenu[] = [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    const addOne = (list: PublicMenu[]) => {
        for (const menu of list) {
            const key = `${menu.name}|${menu.exerciseIds.join(',')}`;
            if (!seenIds.has(menu.id) && !seenKeys.has(key)) {
                result.push(menu);
                seenIds.add(menu.id);
                seenKeys.add(key);
                return;
            }
        }
    };

    addOne(trending);
    addOne(newest);
    addOne(popular);

    // If we don't have 3 yet, fill from any remaining
    for (const list of [trending, newest, popular]) {
        if (result.length >= 3) break;
        for (const menu of list) {
            const key = `${menu.name}|${menu.exerciseIds.join(',')}`;
            if (!seenIds.has(menu.id) && !seenKeys.has(key)) {
                result.push(menu);
                seenIds.add(menu.id);
                seenKeys.add(key);
                if (result.length >= 3) break;
            }
        }
    }

    return result;
}

// ─── Fetch my published menus ───────────────────────

export async function fetchMyPublishedMenus(): Promise<PublicMenu[]> {
    if (!supabase) return [];
    const accountId = getAccountId();
    if (!accountId) return [];

    const { data, error } = await supabase
        .from('public_menus')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[publicMenus] fetchMyPublishedMenus failed:', error);
        return [];
    }

    return (data ?? []).map(mapPublicMenu);
}

// ─── Import (download) a public menu ────────────────

export async function importMenu(publicMenu: PublicMenu): Promise<void> {
    // 1. 独自種目を保存（IDをリマップして衝突を回避）
    const builtInIds = new Set(EXERCISES.map(e => e.id));
    const idRemap = new Map<string, string>();

    if (publicMenu.customExerciseData?.length) {
        // 既存のカスタム種目を取得してIDの衝突を検出
        const existingCustom = await getCustomExercises();
        const existingIds = new Set(existingCustom.map(e => e.id));

        for (const ex of publicMenu.customExerciseData) {
            const importedId = `imported-ex-${publicMenu.id}-${ex.id}`;
            idRemap.set(ex.id, importedId);
            try {
                // 既にインポート済みならスキップ
                if (!existingIds.has(importedId)) {
                    await saveCustomExercise({
                        id: importedId,
                        name: ex.name,
                        sec: ex.sec,
                        emoji: ex.emoji,
                        placement: ex.placement ?? 'stretch',
                        hasSplit: ex.hasSplit,
                    });
                }
            } catch (e) {
                console.warn('[importMenu] custom exercise save skipped:', e);
            }
        }
    }

    // 2. メニューをローカルに保存（種目IDをリマップ）
    const remappedExerciseIds = publicMenu.exerciseIds.map(id => {
        if (builtInIds.has(id)) return id; // ビルトインはそのまま
        return idRemap.get(id) ?? id; // カスタム種目はリマップ
    });

    const localMenu: MenuGroup = {
        id: `imported-${publicMenu.id}`,
        name: publicMenu.name,
        emoji: publicMenu.emoji,
        description: `${publicMenu.authorName}さんのメニュー`,
        exerciseIds: remappedExerciseIds,
        isPreset: false,
    };
    try {
        await saveCustomGroup(localMenu);
    } catch (e) {
        console.error('[importMenu] saveCustomGroup failed:', e, 'menu:', localMenu.id);
        throw e;
    }

    // 3. ダウンロードカウント（完全にfire-and-forget: awaitしない）
    tryIncrementDownload(publicMenu.id);
}

// ダウンロードカウント: 重複防止RPCのみ使用、失敗は無視
async function tryIncrementDownload(menuId: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    try {
        // try_increment_download_count: menu_downloadsテーブルで重複チェック
        // - 初回: INSERT成功 → カウント+1 → true
        // - 2回目以降（削除後含む）: INSERT失敗(重複) → カウント変化なし → false
        // - RPC未デプロイ: エラー → 無視（カウントは増えない）
        await supabase.rpc('try_increment_download_count', {
            target_menu_id: menuId,
            downloader_account_id: accountId,
        });
    } catch {
        // ignore - download count is best-effort
    }
}

// ─── Unpublish ──────────────────────────────────────

export async function unpublishMenu(id: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    // 1. Get custom_exercise_data before deleting the menu
    const { data: menuRow } = await supabase
        .from('public_menus')
        .select('*')
        .eq('id', id)
        .eq('account_id', accountId)
        .single();

    // 2. Delete the menu
    const { error } = await supabase
        .from('public_menus')
        .delete()
        .eq('id', id)
        .eq('account_id', accountId);

    if (error) throw error;

    // 3. Auto-unpublish associated custom exercises
    const customData = (menuRow?.custom_exercise_data as CustomExerciseData[]) ?? [];
    if (customData.length > 0) {
        try {
            const myPublished = await fetchMyPublishedExercises();
            for (const ex of customData) {
                const pub = myPublished.find(
                    p => p.name === ex.name && p.emoji === ex.emoji && p.sec === ex.sec && p.placement === ex.placement,
                );
                if (pub) {
                    await unpublishExercise(pub.id);
                }
            }
        } catch (e) {
            console.warn('[unpublishMenu] auto-unpublish exercises failed:', e);
        }
    }
}

// ─── Mapper ─────────────────────────────────────────

function mapPublicMenu(row: PublicMenuRow): PublicMenu {
    return {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        description: row.description ?? '',
        exerciseIds: row.exercise_ids,
        customExerciseData: (row.custom_exercise_data as CustomExerciseData[]) ?? [],
        authorName: row.author_name,
        accountId: row.account_id,
        downloadCount: row.download_count,
        createdAt: row.created_at,
    };
}
