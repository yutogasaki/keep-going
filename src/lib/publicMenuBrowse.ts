import { supabase } from './supabase';
import { getAccountId } from './sync/authState';
import type { PublicMenu } from './publicMenuTypes';
import { mapPublicMenu, pickRecommendedMenus } from './publicMenuUtils';

type PublicMenuSort = 'download_count' | 'created_at';
interface FetchMyPublishedMenusOptions {
    throwOnError?: boolean;
}

async function fetchActiveMenus(
    sortBy: PublicMenuSort,
    limit: number,
): Promise<PublicMenu[]> {
    if (!supabase) {
        return [];
    }

    const { data, error } = await supabase.rpc('fetch_active_public_menus', {
        sort_by: sortBy,
        max_count: limit,
    });

    if (!error && data) {
        return data.map(mapPublicMenu);
    }

    const { data: fallback, error: fallbackError } = await supabase
        .from('public_menus')
        .select('*')
        .order(sortBy, { ascending: false })
        .limit(limit);

    if (fallbackError) {
        console.warn(`[publicMenus] fetchActiveMenus(${sortBy}) failed:`, fallbackError);
        return [];
    }

    return (fallback ?? []).map(mapPublicMenu);
}

export async function fetchPopularMenus(limit = 10): Promise<PublicMenu[]> {
    return fetchActiveMenus('download_count', limit);
}

export async function fetchRecommendedMenus(): Promise<PublicMenu[]> {
    const [popular, newest] = await Promise.all([
        fetchActiveMenus('download_count', 10),
        fetchActiveMenus('created_at', 5),
    ]);

    return pickRecommendedMenus(popular, newest);
}

export async function fetchMyPublishedMenus(
    options: FetchMyPublishedMenusOptions = {},
): Promise<PublicMenu[]> {
    if (!supabase) {
        return [];
    }

    const accountId = getAccountId();
    if (!accountId) {
        return [];
    }

    const { data, error } = await supabase
        .from('public_menus')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false });

    if (error) {
        if (options.throwOnError) {
            throw error;
        }
        console.warn('[publicMenus] fetchMyPublishedMenus failed:', error);
        return [];
    }

    return (data ?? []).map(mapPublicMenu);
}
