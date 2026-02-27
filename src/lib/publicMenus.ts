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

    const { data, error } = await supabase
        .from('public_menus')
        .select('*')
        .order('download_count', { ascending: false })
        .limit(limit);

    if (error) {
        console.warn('[publicMenus] fetchPopularMenus failed:', error);
        return [];
    }

    return (data ?? []).map(mapPublicMenu);
}

// ─── Fetch recommended menus (algorithm: trending + newest + popular) ──

export async function fetchRecommendedMenus(): Promise<PublicMenu[]> {
    if (!supabase) return [];

    // Fetch 3 categories in parallel
    const [trendingRes, newestRes, popularRes] = await Promise.all([
        // Trending: recently created with high downloads
        supabase.from('public_menus').select('*')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('download_count', { ascending: false })
            .limit(5),
        // Newest
        supabase.from('public_menus').select('*')
            .order('created_at', { ascending: false })
            .limit(5),
        // All-time popular
        supabase.from('public_menus').select('*')
            .order('download_count', { ascending: false })
            .limit(5),
    ]);

    const trending = (trendingRes.data ?? []).map(mapPublicMenu);
    const newest = (newestRes.data ?? []).map(mapPublicMenu);
    const popular = (popularRes.data ?? []).map(mapPublicMenu);

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
