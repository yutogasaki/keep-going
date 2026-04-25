import { getMenuGroupItems, type MenuGroup } from '../data/menuGroups';
import { findPublishedMenuMatch } from './publicContentMatches';
import { fetchMyPublishedMenus } from './publicMenuBrowse';
import {
    cleanupUnusedPublishedCustomExercises,
    ensurePublishedCustomExercises,
    fetchPublishedMenuCustomExerciseData,
    getMenuCustomExerciseData,
    getRemovedCustomExerciseData,
} from './publicMenuPublishCustomExercises';
import type { CustomExerciseData } from './publicMenuTypes';
import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync/authState';

export const PUBLIC_MENU_UNSUPPORTED_EXERCISE_ERROR = 'PUBLIC_MENU_UNSUPPORTED_EXERCISE';

interface PublishMenuOptions {
    existingPublicMenuId?: string;
}

export async function publishMenu(
    menu: MenuGroup,
    authorName: string,
    options: PublishMenuOptions = {},
): Promise<void> {
    if (!supabase) {
        return;
    }

    const accountId = getAccountId();
    if (!accountId) {
        return;
    }

    const menuItems = getMenuGroupItems(menu);
    const { customExerciseData, unsupportedExerciseIds } = await getMenuCustomExerciseData(menu);
    if (unsupportedExerciseIds.length > 0) {
        throw new Error(PUBLIC_MENU_UNSUPPORTED_EXERCISE_ERROR);
    }

    await ensurePublishedCustomExercises(customExerciseData, authorName);
    const myPublishedMenus = options.existingPublicMenuId ? null : await fetchMyPublishedMenus({ throwOnError: true });
    const existingMenuId =
        options.existingPublicMenuId ?? findPublishedMenuMatch(menu, myPublishedMenus ?? [])?.id ?? null;
    const previousCustomExerciseData = existingMenuId
        ? await fetchPublishedMenuCustomExerciseData(existingMenuId, accountId)
        : [];
    const payload: PublicMenuInsert = {
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exercise_ids: menuItems.map((item) => (item.kind === 'exercise_ref' ? item.exerciseId : item.id)),
        menu_items: menuItems,
        custom_exercise_data: customExerciseData,
        author_name: authorName,
        account_id: accountId,
        source_menu_group_id: menu.id,
    };

    const { error } = existingMenuId
        ? await supabase.from('public_menus').update(payload).eq('id', existingMenuId).eq('account_id', accountId)
        : await supabase.from('public_menus').insert(payload);

    if (error) {
        throw error;
    }

    const removedCustomExerciseData = getRemovedCustomExerciseData(previousCustomExerciseData, customExerciseData);
    await cleanupUnusedPublishedCustomExercises(removedCustomExerciseData);
}

export async function unpublishMenu(id: string): Promise<void> {
    if (!supabase) {
        return;
    }

    const accountId = getAccountId();
    if (!accountId) {
        return;
    }

    const { data: menuRow } = await supabase
        .from('public_menus')
        .select('*')
        .eq('id', id)
        .eq('account_id', accountId)
        .single();

    const { error } = await supabase.from('public_menus').delete().eq('id', id).eq('account_id', accountId);

    if (error) {
        throw error;
    }

    const customData = (menuRow?.custom_exercise_data as CustomExerciseData[]) ?? [];
    if (customData.length === 0) {
        return;
    }

    try {
        await cleanupUnusedPublishedCustomExercises(customData);
    } catch (error) {
        console.warn('[unpublishMenu] auto-unpublish exercises failed:', error);
    }
}

export async function linkPublishedMenuToSource(publicMenuId: string, sourceMenuGroupId: string): Promise<void> {
    if (!supabase) {
        return;
    }

    const accountId = getAccountId();
    if (!accountId) {
        return;
    }

    const { error } = await supabase
        .from('public_menus')
        .update({ source_menu_group_id: sourceMenuGroupId })
        .eq('id', publicMenuId)
        .eq('account_id', accountId);

    if (error) {
        throw error;
    }
}

type PublicMenuInsert = Database['public']['Tables']['public_menus']['Insert'];
