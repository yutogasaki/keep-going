import { describe, expect, it } from 'vitest';
import type { MenuGroupItem } from '../../../data/menuGroups';
import { getMenuItemRenderKey } from './MenuItemsCard';

describe('MenuItemsCard', () => {
    it('creates unique render keys using item.id (not index-dependent)', () => {
        const items: MenuGroupItem[] = [
            { id: 'ref-aaa', kind: 'exercise_ref', exerciseId: 'S01' },
            { id: 'ref-bbb', kind: 'exercise_ref', exerciseId: 'S01' },
            { id: 'ref-ccc', kind: 'exercise_ref', exerciseId: 'S02' },
        ];

        const keys = items.map((item, index) => getMenuItemRenderKey(item, index));

        expect(keys).toEqual(['ref-aaa', 'ref-bbb', 'ref-ccc']);
        expect(new Set(keys).size).toBe(items.length);
    });

    it('keys remain stable when items are reordered', () => {
        const items: MenuGroupItem[] = [
            { id: 'ref-aaa', kind: 'exercise_ref', exerciseId: 'S01' },
            { id: 'ref-bbb', kind: 'exercise_ref', exerciseId: 'S01' },
        ];

        const keysBefore = items.map((item, index) => getMenuItemRenderKey(item, index));

        // Simulate reorder (swap)
        const reordered = [items[1], items[0]];
        const keysAfter = reordered.map((item, index) => getMenuItemRenderKey(item, index));

        // Keys should follow the items, not the indices
        expect(keysAfter).toEqual(['ref-bbb', 'ref-aaa']);
        expect(keysAfter[0]).toBe(keysBefore[1]);
        expect(keysAfter[1]).toBe(keysBefore[0]);
    });
});
