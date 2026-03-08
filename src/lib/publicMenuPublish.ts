import type { MenuGroup } from '../data/menuGroups';
import { EXERCISES } from '../data/exercises';
import { getCustomExercises, type CustomExercise } from './db';
import { fetchMyPublishedExercises, publishExercise, unpublishExercise } from './publicExercises';
import type { CustomExerciseData } from './publicMenuTypes';
import { supabase } from './supabase';
import { getAccountId } from './sync/authState';

const builtInExerciseIds = new Set(EXERCISES.map((exercise) => exercise.id));

function matchesExerciseDefinition(
    left: Pick<CustomExerciseData, 'name' | 'emoji' | 'sec' | 'placement'>,
    right: Pick<CustomExerciseData, 'name' | 'emoji' | 'sec' | 'placement'>,
): boolean {
    return left.name === right.name
        && left.emoji === right.emoji
        && left.sec === right.sec
        && left.placement === right.placement;
}

async function getMenuCustomExerciseData(menu: MenuGroup): Promise<CustomExerciseData[]> {
    const uniqueCustomIds = [...new Set(menu.exerciseIds.filter((id) => !builtInExerciseIds.has(id)))];
    if (uniqueCustomIds.length === 0) {
        return [];
    }

    const allCustomExercises = await getCustomExercises();

    return uniqueCustomIds
        .map((id) => allCustomExercises.find((exercise) => exercise.id === id))
        .filter((exercise): exercise is CustomExercise => Boolean(exercise))
        .map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sec: exercise.sec,
            emoji: exercise.emoji,
            placement: exercise.placement,
            hasSplit: exercise.hasSplit,
        }));
}

async function ensurePublishedCustomExercises(
    customExerciseData: CustomExerciseData[],
    authorName: string,
): Promise<void> {
    if (customExerciseData.length === 0) {
        return;
    }

    const myPublished = await fetchMyPublishedExercises();

    for (const exercise of customExerciseData) {
        const alreadyPublished = myPublished.find((published) => matchesExerciseDefinition(exercise, published));
        if (alreadyPublished) {
            continue;
        }
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
        );
    }
}

export async function publishMenu(menu: MenuGroup, authorName: string): Promise<void> {
    if (!supabase) {
        return;
    }

    const accountId = getAccountId();
    if (!accountId) {
        return;
    }

    const customExerciseData = await getMenuCustomExerciseData(menu);
    await ensurePublishedCustomExercises(customExerciseData, authorName);

    const { error } = await supabase.from('public_menus').insert({
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exercise_ids: menu.exerciseIds,
        custom_exercise_data: customExerciseData,
        author_name: authorName,
        account_id: accountId,
    });

    if (error) {
        throw error;
    }
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
        const myPublished = await fetchMyPublishedExercises();
        for (const exercise of customData) {
            const published = myPublished.find((candidate) => matchesExerciseDefinition(exercise, candidate));
            if (published) {
                await unpublishExercise(published.id);
            }
        }
    } catch (error) {
        console.warn('[unpublishMenu] auto-unpublish exercises failed:', error);
    }
}

