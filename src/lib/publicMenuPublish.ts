import {
    getMenuGroupItems,
    type MenuGroup,
    type MenuGroupItem,
} from '../data/menuGroups';
import { EXERCISES } from '../data/exercises';
import { getCustomExercises, type CustomExercise } from './db';
import { findPublishedExerciseMatch, findPublishedMenuMatch } from './publicContentMatches';
import { createPublicExerciseDedupKey } from './publicExerciseUtils';
import { fetchMyPublishedMenus } from './publicMenuBrowse';
import {
    fetchMyPublishedExercises,
    publishExercise,
    unpublishExercise,
} from './publicExercises';
import type { CustomExerciseData } from './publicMenuTypes';
import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { getAccountId } from './sync/authState';

const builtInExerciseIds = new Set(EXERCISES.map((exercise) => exercise.id));
export const PUBLIC_MENU_UNSUPPORTED_EXERCISE_ERROR = 'PUBLIC_MENU_UNSUPPORTED_EXERCISE';

interface MenuPublishExerciseDataResult {
    customExerciseData: CustomExerciseData[];
    unsupportedExerciseIds: string[];
}

interface PublishMenuOptions {
    existingPublicMenuId?: string;
}

interface PublishedMenuCustomExerciseRow {
    custom_exercise_data: unknown[] | null;
}

async function getMenuCustomExerciseData(menu: MenuGroup): Promise<MenuPublishExerciseDataResult> {
    const uniqueCustomIds = [...new Set(
        getMenuGroupItems(menu)
            .filter((item): item is Extract<MenuGroupItem, { kind: 'exercise_ref' }> => item.kind === 'exercise_ref')
            .map((item) => item.exerciseId)
            .filter((id) => !builtInExerciseIds.has(id)),
    )];
    if (uniqueCustomIds.length === 0) {
        return {
            customExerciseData: [],
            unsupportedExerciseIds: [],
        };
    }

    const allCustomExercises = await getCustomExercises();
    const customExerciseById = new Map(allCustomExercises.map((exercise) => [exercise.id, exercise]));
    const unsupportedExerciseIds: string[] = [];
    const customExerciseData: CustomExerciseData[] = [];

    for (const id of uniqueCustomIds) {
        const exercise = customExerciseById.get(id);
        if (!exercise) {
            unsupportedExerciseIds.push(id);
            continue;
        }

        customExerciseData.push({
            id: exercise.id,
            name: exercise.name,
            sec: exercise.sec,
            emoji: exercise.emoji,
            placement: exercise.placement,
            hasSplit: exercise.hasSplit,
        });
    }

    return {
        customExerciseData,
        unsupportedExerciseIds,
    };
}

async function ensurePublishedCustomExercises(
    customExerciseData: CustomExerciseData[],
    authorName: string,
): Promise<void> {
    if (customExerciseData.length === 0) {
        return;
    }

    for (const exercise of customExerciseData) {
        await publishExercise(
            {
                id: exercise.id,
                name: exercise.name,
                sec: exercise.sec,
                emoji: exercise.emoji,
                placement: exercise.placement,
                hasSplit: exercise.hasSplit,
            },
            authorName,
            {
                sourceCustomExerciseId: exercise.id,
                preserveWithoutMenu: false,
            },
        );
    }
}

async function fetchPublishedMenuCustomExerciseData(
    publicMenuId: string,
    accountId: string,
): Promise<CustomExerciseData[]> {
    if (!supabase) {
        return [];
    }

    const { data, error } = await supabase
        .from('public_menus')
        .select('custom_exercise_data')
        .eq('id', publicMenuId)
        .eq('account_id', accountId)
        .single<PublishedMenuCustomExerciseRow>();

    if (error) {
        console.warn('[publishMenu] failed to load previous custom exercise snapshot:', error);
        return [];
    }

    return (data?.custom_exercise_data as CustomExerciseData[] | null) ?? [];
}

function getRemovedCustomExerciseData(
    previousCustomExerciseData: CustomExerciseData[],
    nextCustomExerciseData: CustomExerciseData[],
): CustomExerciseData[] {
    if (previousCustomExerciseData.length === 0) {
        return [];
    }

    const nextIds = new Set(nextCustomExerciseData.map((exercise) => exercise.id));
    return previousCustomExerciseData.filter((exercise) => !nextIds.has(exercise.id));
}

function isCustomExerciseReferencedByPublishedMenus(
    exercise: CustomExerciseData,
    publishedMenus: Awaited<ReturnType<typeof fetchMyPublishedMenus>>,
): boolean {
    const targetKey = createPublicExerciseDedupKey({
        name: exercise.name,
        emoji: exercise.emoji,
        sec: exercise.sec,
        placement: exercise.placement,
        hasSplit: exercise.hasSplit ?? false,
    });

    return publishedMenus.some((menu) =>
        menu.customExerciseData.some((candidate) => (
            candidate.id === exercise.id
            || createPublicExerciseDedupKey({
                name: candidate.name,
                emoji: candidate.emoji,
                sec: candidate.sec,
                placement: candidate.placement,
                hasSplit: candidate.hasSplit ?? false,
            }) === targetKey
        )),
    );
}

async function cleanupUnusedPublishedCustomExercises(
    customExerciseData: CustomExerciseData[],
): Promise<void> {
    if (customExerciseData.length === 0) {
        return;
    }

    const [myPublishedExercises, myPublishedMenus] = await Promise.all([
        fetchMyPublishedExercises({ throwOnError: true }),
        fetchMyPublishedMenus({ throwOnError: true }),
    ]);
    const handledPublishedExerciseIds = new Set<string>();

    for (const exercise of customExerciseData) {
        const published = findPublishedExerciseMatch(
            toCustomExercise(exercise),
            myPublishedExercises,
        );
        if (!published || published.preserveWithoutMenu || handledPublishedExerciseIds.has(published.id)) {
            continue;
        }

        if (isCustomExerciseReferencedByPublishedMenus(exercise, myPublishedMenus)) {
            continue;
        }

        handledPublishedExerciseIds.add(published.id);
        await unpublishExercise(published.id);
    }
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
    const myPublishedMenus = options.existingPublicMenuId
        ? null
        : await fetchMyPublishedMenus({ throwOnError: true });
    const existingMenuId = options.existingPublicMenuId
        ?? findPublishedMenuMatch(menu, myPublishedMenus ?? [])?.id
        ?? null;
    const previousCustomExerciseData = existingMenuId
        ? await fetchPublishedMenuCustomExerciseData(existingMenuId, accountId)
        : [];
    const payload: PublicMenuInsert = {
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exercise_ids: menuItems.map((item) => item.id),
        menu_items: menuItems,
        custom_exercise_data: customExerciseData,
        author_name: authorName,
        account_id: accountId,
        source_menu_group_id: menu.id,
    };

    const { error } = existingMenuId
        ? await supabase
            .from('public_menus')
            .update(payload)
            .eq('id', existingMenuId)
            .eq('account_id', accountId)
        : await supabase.from('public_menus').insert(payload);

    if (error) {
        throw error;
    }

    const removedCustomExerciseData = getRemovedCustomExerciseData(
        previousCustomExerciseData,
        customExerciseData,
    );
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

    const { error } = await supabase
        .from('public_menus')
        .delete()
        .eq('id', id)
        .eq('account_id', accountId);

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

export async function linkPublishedMenuToSource(
    publicMenuId: string,
    sourceMenuGroupId: string,
): Promise<void> {
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

function toCustomExercise(exercise: CustomExerciseData): CustomExercise {
    return {
        id: exercise.id,
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        placement: exercise.placement,
        hasSplit: exercise.hasSplit,
    };
}
