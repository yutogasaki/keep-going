import { describe, expect, it } from 'vitest';
import { buildMenuGroupItemsFromExerciseIds } from '../../data/menuGroups';
import type { PublicMenu } from '../publicMenuTypes';
import {
    createPublicMenuDedupKey,
    dedupeMenusByIdentity,
    pickRecommendedMenus,
} from '../publicMenuUtils';

function createMenu(overrides: Partial<PublicMenu> & Pick<PublicMenu, 'id' | 'name' | 'exerciseIds'>): PublicMenu {
    const exerciseIds = overrides.exerciseIds;

    return {
        id: overrides.id,
        name: overrides.name,
        emoji: overrides.emoji ?? '🌸',
        description: overrides.description ?? '',
        exerciseIds,
        items: overrides.items ?? buildMenuGroupItemsFromExerciseIds(exerciseIds),
        customExerciseData: overrides.customExerciseData ?? [],
        authorName: overrides.authorName ?? 'teacher',
        accountId: overrides.accountId ?? 'account-1',
        downloadCount: overrides.downloadCount ?? 0,
        createdAt: overrides.createdAt ?? '2026-03-08T00:00:00.000Z',
    };
}

describe('publicMenuUtils', () => {
    it('creates a stable dedupe key from menu identity', () => {
        const menu = createMenu({ id: 'menu-1', name: 'おはよう', exerciseIds: ['S01', 'S02'] });

        expect(createPublicMenuDedupKey(menu)).toBe('おはよう|exercise:S01,exercise:S02');
    });

    it('dedupes menus by name and exercise order while keeping the first match', () => {
        const first = createMenu({ id: 'menu-1', name: 'おはよう', exerciseIds: ['S01', 'S02'] });
        const duplicate = createMenu({ id: 'menu-2', name: 'おはよう', exerciseIds: ['S01', 'S02'] });
        const unique = createMenu({ id: 'menu-3', name: 'しっかり', exerciseIds: ['S03'] });

        expect(dedupeMenusByIdentity([first, duplicate, unique])).toEqual([first, unique]);
    });

    it('picks trending, newest, and popular menus without duplicate identities', () => {
        const now = Date.parse('2026-03-08T12:00:00.000Z');
        const trending = createMenu({
            id: 'menu-trending',
            name: 'トレンド',
            exerciseIds: ['S01'],
            createdAt: '2026-03-06T12:00:00.000Z',
            downloadCount: 30,
        });
        const newestDuplicate = createMenu({
            id: 'menu-newest-dup',
            name: 'トレンド',
            exerciseIds: ['S01'],
            createdAt: '2026-03-08T09:00:00.000Z',
            downloadCount: 5,
        });
        const newest = createMenu({
            id: 'menu-newest',
            name: 'あたらしい',
            exerciseIds: ['S02'],
            createdAt: '2026-03-08T10:00:00.000Z',
            downloadCount: 4,
        });
        const popular = createMenu({
            id: 'menu-popular',
            name: 'にんき',
            exerciseIds: ['S03'],
            createdAt: '2026-02-20T10:00:00.000Z',
            downloadCount: 50,
        });

        expect(
            pickRecommendedMenus(
                [trending, popular],
                [newestDuplicate, newest],
                now,
            ).map((menu) => menu.id),
        ).toEqual(['menu-trending', 'menu-newest', 'menu-popular']);
    });

    it('dedupes inline items by visible identity even if generated ids differ', () => {
        const first = createMenu({
            id: 'menu-1',
            name: 'フリー',
            exerciseIds: ['inline-a'],
            items: [{
                id: 'inline-a',
                kind: 'inline_only',
                name: 'おへやジャンプ',
                sec: 30,
                emoji: '✨',
                placement: 'stretch',
                internal: 'single',
            }],
        });
        const duplicate = createMenu({
            id: 'menu-2',
            name: 'フリー',
            exerciseIds: ['inline-b'],
            items: [{
                id: 'inline-b',
                kind: 'inline_only',
                name: 'おへやジャンプ',
                sec: 30,
                emoji: '✨',
                placement: 'stretch',
                internal: 'single',
            }],
        });

        expect(dedupeMenusByIdentity([first, duplicate])).toEqual([first]);
    });
});
