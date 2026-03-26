import { describe, expect, it } from 'vitest';
import type { MenuGroupItem } from '../../../data/menuGroups';
import { moveMenuItems } from './menuItemOrder';

function createItems(): MenuGroupItem[] {
    return [
        { id: 'ref-1', kind: 'exercise_ref', exerciseId: 'S01' },
        { id: 'ref-2', kind: 'exercise_ref', exerciseId: 'S02' },
        { id: 'inline-1', kind: 'inline_only', name: 'メモ', sec: 15, emoji: '✨', placement: 'stretch', internal: 'single' },
    ];
}

describe('moveMenuItems', () => {
    it('moves an item to a new position', () => {
        const nextItems = moveMenuItems(createItems(), 2, 1);

        expect(nextItems.map((item) => item.id)).toEqual(['ref-1', 'inline-1', 'ref-2']);
    });

    it('returns the same array when the move is invalid', () => {
        const items = createItems();

        expect(moveMenuItems(items, -1, 1)).toBe(items);
        expect(moveMenuItems(items, 1, 1)).toBe(items);
        expect(moveMenuItems(items, 1, 99)).toBe(items);
    });
});
