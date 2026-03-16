import { EXERCISES } from '../data/exercises';
import {
    buildMenuGroupItemsFromExerciseIds,
    type MenuGroupItem,
} from '../data/menuGroups';
import {
    createSessionPlannedItemFromExercise,
    type SessionPlannedItem,
} from './sessionPlan';
import type { PublicMenu, PublicMenuRow } from './publicMenuTypes';

type MenuIdentity = {
    name: string;
    exerciseIds: string[];
    items?: MenuGroupItem[];
};
type PublicMenuLike = Pick<PublicMenu, 'exerciseIds' | 'items' | 'customExerciseData'>;

export interface PublicMenuDisplayItem {
    id: string;
    kind: MenuGroupItem['kind'];
    name: string;
    emoji: string;
    sec: number;
}

export function getPublicMenuItems(menu: { exerciseIds: string[]; items?: MenuGroupItem[] }): MenuGroupItem[] {
    if (Array.isArray(menu.items) && menu.items.length > 0) {
        return menu.items;
    }

    return buildMenuGroupItemsFromExerciseIds(menu.exerciseIds);
}

function serializeMenuItemIdentity(item: MenuGroupItem): string {
    if (item.kind === 'inline_only') {
        return `inline:${item.name}|${item.sec}|${item.emoji}|${item.placement}|${item.internal}`;
    }

    return `exercise:${item.exerciseId}`;
}

function resolveExerciseRef(menu: PublicMenuLike, exerciseId: string) {
    return EXERCISES.find((exercise) => exercise.id === exerciseId)
        ?? menu.customExerciseData.find((exercise) => exercise.id === exerciseId);
}

export function resolvePublicMenuDisplayItems(menu: PublicMenuLike): PublicMenuDisplayItem[] {
    return getPublicMenuItems(menu).reduce<PublicMenuDisplayItem[]>((result, item) => {
        if (item.kind === 'inline_only') {
            result.push({
                id: item.id,
                kind: item.kind,
                name: item.name,
                emoji: item.emoji,
                sec: item.sec,
            });
            return result;
        }

        const exercise = resolveExerciseRef(menu, item.exerciseId);
        if (!exercise) {
            return result;
        }

        result.push({
            id: item.id,
            kind: item.kind,
            name: exercise.name,
            emoji: exercise.emoji,
            sec: exercise.sec,
        });
        return result;
    }, []);
}

export function resolvePublicMenuToSessionPlannedItems(menu: PublicMenuLike): SessionPlannedItem[] {
    return getPublicMenuItems(menu).flatMap((item) => {
        if (item.kind === 'inline_only') {
            return [{
                id: item.id,
                kind: item.kind,
                name: item.name,
                sec: item.sec,
                emoji: item.emoji,
                placement: item.placement,
                internal: item.internal,
                reading: item.reading,
                description: item.description,
            }];
        }

        const exercise = resolveExerciseRef(menu, item.exerciseId);
        if (!exercise) {
            return [];
        }

        return [createSessionPlannedItemFromExercise(exercise, {
            id: item.id,
            kind: item.kind,
        })];
    });
}

export function getPublicMenuDiscoverableExercises(menu: PublicMenuLike): PublicMenu['customExerciseData'] {
    const referencedIds = new Set(
        getPublicMenuItems(menu)
            .filter((item): item is Extract<MenuGroupItem, { kind: 'exercise_ref' }> => item.kind === 'exercise_ref')
            .map((item) => item.exerciseId),
    );

    return menu.customExerciseData.filter((exercise) => referencedIds.has(exercise.id));
}

export function getPublicMenuItemCount(menu: Pick<PublicMenu, 'exerciseIds' | 'items'>): number {
    return getPublicMenuItems(menu).length;
}

export function hasInlinePublicMenuItems(menu: Pick<PublicMenu, 'exerciseIds' | 'items'>): boolean {
    return getPublicMenuItems(menu).some((item) => item.kind === 'inline_only');
}

export function createPublicMenuDedupKey(menu: MenuIdentity): string {
    return `${menu.name}|${getPublicMenuItems(menu).map(serializeMenuItemIdentity).join(',')}`;
}

export function dedupeMenusByIdentity(menus: PublicMenu[]): PublicMenu[] {
    const seenKeys = new Set<string>();

    return menus.filter((menu) => {
        const key = createPublicMenuDedupKey(menu);
        if (seenKeys.has(key)) {
            return false;
        }
        seenKeys.add(key);
        return true;
    });
}

export function pickRecommendedMenus(
    popular: PublicMenu[],
    newest: PublicMenu[],
    now = Date.now(),
): PublicMenu[] {
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    const trending = popular.filter((menu) => menu.createdAt >= oneWeekAgo);
    const result: PublicMenu[] = [];
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();

    const addOne = (list: PublicMenu[]) => {
        for (const menu of list) {
            const key = createPublicMenuDedupKey(menu);
            if (seenIds.has(menu.id) || seenKeys.has(key)) {
                continue;
            }
            result.push(menu);
            seenIds.add(menu.id);
            seenKeys.add(key);
            return;
        }
    };

    addOne(trending);
    addOne(newest);
    addOne(popular);

    for (const list of [trending, newest, popular]) {
        if (result.length >= 3) {
            break;
        }
        for (const menu of list) {
            const key = createPublicMenuDedupKey(menu);
            if (seenIds.has(menu.id) || seenKeys.has(key)) {
                continue;
            }
            result.push(menu);
            seenIds.add(menu.id);
            seenKeys.add(key);
            if (result.length >= 3) {
                break;
            }
        }
    }

    return result;
}

export function buildPublicMenuExercisePreview(menu: PublicMenuLike, limit = 3): string {
    const displayItems = resolvePublicMenuDisplayItems(menu);
    const names = displayItems.slice(0, limit).map((item) => item.name);
    const remaining = displayItems.length - limit;

    return `${names.join('、')}${remaining > 0 ? `、+${remaining}` : ''}`;
}

export function getPublicMenuMinutes(menu: PublicMenuLike): number {
    const totalSec = resolvePublicMenuDisplayItems(menu).reduce(
        (sum, item) => sum + item.sec,
        0,
    );

    return Math.ceil(totalSec / 60);
}

export function mapPublicMenu(row: PublicMenuRow): PublicMenu {
    return {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        description: row.description ?? '',
        exerciseIds: row.exercise_ids,
        items: (row.menu_items as PublicMenu['items']) ?? buildMenuGroupItemsFromExerciseIds(row.exercise_ids),
        customExerciseData: (row.custom_exercise_data as PublicMenu['customExerciseData']) ?? [],
        authorName: row.author_name,
        accountId: row.account_id,
        downloadCount: row.download_count,
        sourceMenuGroupId: row.source_menu_group_id ?? null,
        createdAt: row.created_at,
    };
}
