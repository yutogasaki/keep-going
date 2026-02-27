import { supabase } from './supabase';
import { getAccountId } from './sync';
import { saveCustomGroup, type MenuGroup } from '../data/menuGroups';

export interface PublicMenu {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
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

    const { error } = await supabase.from('public_menus').insert({
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exercise_ids: menu.exerciseIds,
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
    // Save as a local custom menu
    const localMenu: MenuGroup = {
        id: `imported-${publicMenu.id}`,
        name: publicMenu.name,
        emoji: publicMenu.emoji,
        description: `${publicMenu.authorName}さんのメニュー`,
        exerciseIds: publicMenu.exerciseIds,
        isPreset: false,
    };

    await saveCustomGroup(localMenu);

    // Increment download count via RPC
    if (supabase) {
        await (supabase.rpc('increment_download_count', { menu_id: publicMenu.id }) as unknown as Promise<unknown>).catch(console.warn);
    }
}

// ─── Unpublish ──────────────────────────────────────

export async function unpublishMenu(id: string): Promise<void> {
    if (!supabase) return;
    const accountId = getAccountId();
    if (!accountId) return;

    const { error } = await supabase
        .from('public_menus')
        .delete()
        .eq('id', id)
        .eq('account_id', accountId);

    if (error) throw error;
}

// ─── Mapper ─────────────────────────────────────────

function mapPublicMenu(row: any): PublicMenu {
    return {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        description: row.description,
        exerciseIds: row.exercise_ids as string[],
        authorName: row.author_name,
        accountId: row.account_id,
        downloadCount: row.download_count,
        createdAt: row.created_at,
    };
}
