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
