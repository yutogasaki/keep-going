import type { MenuGroupItem } from '../../../data/menuGroups';

export function moveMenuItems(
    items: MenuGroupItem[],
    fromIndex: number,
    toIndex: number,
): MenuGroupItem[] {
    if (
        fromIndex < 0
        || toIndex < 0
        || fromIndex >= items.length
        || toIndex >= items.length
        || fromIndex === toIndex
    ) {
        return items;
    }

    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
}
