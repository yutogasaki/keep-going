import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMenuGroupItemsFromExerciseIds } from '../../data/menuGroups';
import type { PublicMenu } from '../publicMenuTypes';
import { getImportedPublicMenuId, importMenu } from '../publicMenuImport';
import { saveCustomGroup } from '../customGroups';
import { saveCustomExercise } from '../db';

vi.mock('../customGroups', () => ({
    saveCustomGroup: vi.fn(),
}));

vi.mock('../db', () => ({
    saveCustomExercise: vi.fn(),
}));

vi.mock('../supabase', () => ({
    supabase: null,
}));

vi.mock('../sync/authState', () => ({
    getAccountId: vi.fn(() => null),
}));

const mockedSaveCustomGroup = vi.mocked(saveCustomGroup);
const mockedSaveCustomExercise = vi.mocked(saveCustomExercise);

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
        sourceMenuGroupId: overrides.sourceMenuGroupId ?? null,
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    mockedSaveCustomGroup.mockResolvedValue(undefined);
    mockedSaveCustomExercise.mockResolvedValue(undefined);
});

describe('publicMenuImport', () => {
    it('imports custom exercises and remaps the menu to stable imported ids', async () => {
        const publicMenu = createMenu({
            id: 'public-menu-1',
            name: 'フルコース',
            authorName: 'みお',
            exerciseIds: ['S01', 'remote-ex-1'],
            customExerciseData: [{
                id: 'remote-ex-1',
                name: 'おひるやすみ',
                sec: 45,
                emoji: '🛋️',
                placement: 'rest',
                hasSplit: false,
            }],
        });

        await importMenu(publicMenu);

        expect(mockedSaveCustomExercise).toHaveBeenCalledWith({
            id: 'imported-ex-public-menu-1-remote-ex-1',
            name: 'おひるやすみ',
            sec: 45,
            emoji: '🛋️',
            placement: 'rest',
            hasSplit: false,
        });
        expect(mockedSaveCustomGroup).toHaveBeenCalledWith(expect.objectContaining({
            id: getImportedPublicMenuId(publicMenu.id),
            name: 'フルコース',
            description: 'みおさんのメニュー',
            exerciseIds: ['S01', 'imported-ex-public-menu-1-remote-ex-1'],
            items: [
                {
                    id: 'S01',
                    kind: 'exercise_ref',
                    exerciseId: 'S01',
                },
                {
                    id: 'imported-ex-public-menu-1-remote-ex-1',
                    kind: 'exercise_ref',
                    exerciseId: 'imported-ex-public-menu-1-remote-ex-1',
                },
            ],
            isPreset: false,
        }));
    });

    it('reimports previously imported custom exercises with the latest public definition', async () => {
        const originalMenu = createMenu({
            id: 'public-menu-1',
            name: 'フルコース',
            exerciseIds: ['remote-ex-1'],
            customExerciseData: [{
                id: 'remote-ex-1',
                name: 'おひるやすみ',
                sec: 45,
                emoji: '🛋️',
                placement: 'rest',
                hasSplit: false,
            }],
        });
        const updatedMenu = createMenu({
            ...originalMenu,
            customExerciseData: [{
                id: 'remote-ex-1',
                name: 'ラッキー休けい',
                sec: 60,
                emoji: '🌟',
                placement: 'cooldown',
                hasSplit: true,
            }],
        });

        await importMenu(originalMenu);
        await importMenu(updatedMenu);

        expect(mockedSaveCustomExercise).toHaveBeenNthCalledWith(1, {
            id: 'imported-ex-public-menu-1-remote-ex-1',
            name: 'おひるやすみ',
            sec: 45,
            emoji: '🛋️',
            placement: 'rest',
            hasSplit: false,
        });
        expect(mockedSaveCustomExercise).toHaveBeenNthCalledWith(2, {
            id: 'imported-ex-public-menu-1-remote-ex-1',
            name: 'ラッキー休けい',
            sec: 60,
            emoji: '🌟',
            placement: 'cooldown',
            hasSplit: true,
        });
    });
});
