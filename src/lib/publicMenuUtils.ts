import type { PublicMenu, PublicMenuRow } from './publicMenuTypes';

export function createPublicMenuDedupKey(
    menu: Pick<PublicMenu, 'name' | 'exerciseIds'>,
): string {
    return `${menu.name}|${menu.exerciseIds.join(',')}`;
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

export function mapPublicMenu(row: PublicMenuRow): PublicMenu {
    return {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        description: row.description ?? '',
        exerciseIds: row.exercise_ids,
        customExerciseData: (row.custom_exercise_data as PublicMenu['customExerciseData']) ?? [],
        authorName: row.author_name,
        accountId: row.account_id,
        downloadCount: row.download_count,
        createdAt: row.created_at,
    };
}
