import { EXERCISES } from '../data/exercises';
import type { MenuGroup, MenuGroupItem } from '../data/menuGroups';
import { saveCustomGroup } from './customGroups';
import { getCustomExercises, saveCustomExercise } from './db';
import type { PublicMenu } from './publicMenuTypes';
import { supabase } from './supabase';
import { getAccountId } from './sync/authState';

const builtInExerciseIds = new Set(EXERCISES.map((exercise) => exercise.id));

function createImportedExerciseId(menuId: string, exerciseId: string): string {
    return `imported-ex-${menuId}-${exerciseId}`;
}

export function getImportedPublicMenuId(publicMenuId: string): string {
    return `imported-${publicMenuId}`;
}

async function persistImportedCustomExercises(publicMenu: PublicMenu): Promise<Map<string, string>> {
    const idRemap = new Map<string, string>();
    if (!publicMenu.customExerciseData.length) {
        return idRemap;
    }

    const existingCustomExercises = await getCustomExercises();
    const existingIds = new Set(existingCustomExercises.map((exercise) => exercise.id));

    for (const exercise of publicMenu.customExerciseData) {
        const importedId = createImportedExerciseId(publicMenu.id, exercise.id);
        idRemap.set(exercise.id, importedId);

        if (existingIds.has(importedId)) {
            continue;
        }

        try {
            await saveCustomExercise({
                id: importedId,
                name: exercise.name,
                sec: exercise.sec,
                emoji: exercise.emoji,
                placement: exercise.placement ?? 'stretch',
                hasSplit: exercise.hasSplit,
            });
        } catch (error) {
            console.warn('[importMenu] custom exercise save skipped:', error);
        }
    }

    return idRemap;
}

function createImportedMenu(
    publicMenu: PublicMenu,
    idRemap: Map<string, string>,
): MenuGroup {
    const remappedItems: MenuGroupItem[] = publicMenu.items.map((item) => {
        if (item.kind === 'inline_only') {
            return item;
        }

        if (builtInExerciseIds.has(item.exerciseId)) {
            return item;
        }

        const remappedId = idRemap.get(item.exerciseId) ?? item.exerciseId;
        return {
            ...item,
            id: remappedId,
            exerciseId: remappedId,
        };
    });

    return {
        id: getImportedPublicMenuId(publicMenu.id),
        name: publicMenu.name,
        emoji: publicMenu.emoji,
        description: `${publicMenu.authorName}さんのメニュー`,
        exerciseIds: remappedItems.map((item) => item.id),
        items: remappedItems,
        isPreset: false,
    };
}

async function tryIncrementDownload(menuId: string): Promise<void> {
    if (!supabase) {
        return;
    }

    const accountId = getAccountId();
    if (!accountId) {
        return;
    }

    try {
        await supabase.rpc('try_increment_download_count', {
            target_menu_id: menuId,
            downloader_account_id: accountId,
        });
    } catch {
        // ignore - download count is best-effort
    }
}

export async function importMenu(publicMenu: PublicMenu): Promise<void> {
    const idRemap = await persistImportedCustomExercises(publicMenu);
    const localMenu = createImportedMenu(publicMenu, idRemap);

    try {
        await saveCustomGroup(localMenu);
    } catch (error) {
        console.error('[importMenu] saveCustomGroup failed:', error, 'menu:', localMenu.id);
        throw error;
    }

    void tryIncrementDownload(publicMenu.id);
}
