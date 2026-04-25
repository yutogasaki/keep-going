import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publishMenu } from '../publicMenuPublish';
import { getCustomExercises } from '../db';
import { fetchMyPublishedMenus } from '../publicMenuBrowse';
import {
    fetchMyPublishedExercises,
    publishExercise,
    unpublishExercise,
} from '../publicExercises';
import {
    createCustomExercise,
    createMenuGroup,
    createPublicExercise,
    createPublicMenu,
    createPublicMenusSupabaseMock,
} from './publicMenuPublish.fixtures';

const { supabaseFromMock } = vi.hoisted(() => ({
    supabaseFromMock: vi.fn(),
}));

vi.mock('../supabase', () => ({
    supabase: {
        from: supabaseFromMock,
    },
}));

vi.mock('../sync/authState', () => ({
    getAccountId: vi.fn(() => 'account-1'),
}));

vi.mock('../db', () => ({
    getCustomExercises: vi.fn(),
}));

vi.mock('../publicMenuBrowse', () => ({
    fetchMyPublishedMenus: vi.fn(),
}));

vi.mock('../publicExercises', () => ({
    fetchMyPublishedExercises: vi.fn(),
    publishExercise: vi.fn(),
    unpublishExercise: vi.fn(),
}));

const mockedGetCustomExercises = vi.mocked(getCustomExercises);
const mockedFetchMyPublishedMenus = vi.mocked(fetchMyPublishedMenus);
const mockedFetchMyPublishedExercises = vi.mocked(fetchMyPublishedExercises);
const mockedPublishExercise = vi.mocked(publishExercise);
const mockedUnpublishExercise = vi.mocked(unpublishExercise);

beforeEach(() => {
    vi.clearAllMocks();
    mockedGetCustomExercises.mockResolvedValue([]);
    mockedFetchMyPublishedMenus.mockResolvedValue([]);
    mockedFetchMyPublishedExercises.mockResolvedValue([]);
    mockedPublishExercise.mockResolvedValue(undefined);
    mockedUnpublishExercise.mockResolvedValue(undefined);
});

describe('publicMenuPublish', () => {
    it('unpublishes custom public exercises removed by a menu update when no menu still references them', async () => {
        const keptExercise = createCustomExercise({
            id: 'custom-ex-1',
            name: 'のびる',
            sec: 30,
            emoji: '🧘',
            placement: 'stretch',
        });
        const removedExercise = createCustomExercise({
            id: 'custom-ex-2',
            name: 'きゅうけい',
            sec: 45,
            emoji: '🛋️',
            placement: 'rest',
        });
        const { updatePayloads } = createPublicMenusSupabaseMock([keptExercise, removedExercise], supabaseFromMock);
        mockedGetCustomExercises.mockResolvedValue([keptExercise]);
        mockedFetchMyPublishedMenus.mockResolvedValue([
            createPublicMenu({
                id: 'public-menu-1',
                name: '更新後メニュー',
                exerciseIds: ['custom-ex-1'],
                customExerciseData: [keptExercise],
                sourceMenuGroupId: 'group-1',
            }),
        ]);
        mockedFetchMyPublishedExercises.mockResolvedValue([
            createPublicExercise({
                id: 'public-ex-2',
                name: removedExercise.name,
                sec: removedExercise.sec,
                emoji: removedExercise.emoji,
                placement: removedExercise.placement,
                hasSplit: removedExercise.hasSplit ?? false,
                sourceCustomExerciseId: removedExercise.id,
                preserveWithoutMenu: false,
            }),
        ]);

        await publishMenu(
            createMenuGroup({
                id: 'group-1',
                name: '更新後メニュー',
                exerciseIds: ['custom-ex-1'],
            }),
            'みお',
            { existingPublicMenuId: 'public-menu-1' },
        );

        expect(mockedPublishExercise).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'custom-ex-1',
                name: 'のびる',
            }),
            'みお',
            expect.objectContaining({
                sourceCustomExerciseId: 'custom-ex-1',
                preserveWithoutMenu: false,
            }),
        );
        expect(updatePayloads).toHaveLength(1);
        expect(updatePayloads[0]).toEqual(expect.objectContaining({
            custom_exercise_data: [expect.objectContaining({ id: 'custom-ex-1' })],
            source_menu_group_id: 'group-1',
        }));
        expect(mockedUnpublishExercise).toHaveBeenCalledWith('public-ex-2');
    });

    it('keeps a removed public exercise when another published menu still references the same visible exercise', async () => {
        const removedExercise = createCustomExercise({
            id: 'custom-ex-2',
            name: 'きゅうけい',
            sec: 45,
            emoji: '🛋️',
            placement: 'rest',
        });
        const matchingExerciseFromOtherMenu = createCustomExercise({
            id: 'custom-ex-3',
            name: 'きゅうけい',
            sec: 45,
            emoji: '🛋️',
            placement: 'rest',
        });

        createPublicMenusSupabaseMock([removedExercise], supabaseFromMock);
        mockedFetchMyPublishedMenus.mockResolvedValue([
            createPublicMenu({
                id: 'public-menu-1',
                name: '更新後メニュー',
                exerciseIds: [],
                items: [],
                customExerciseData: [],
                sourceMenuGroupId: 'group-1',
            }),
            createPublicMenu({
                id: 'public-menu-2',
                name: '別メニュー',
                exerciseIds: ['custom-ex-3'],
                customExerciseData: [matchingExerciseFromOtherMenu],
                sourceMenuGroupId: 'group-2',
            }),
        ]);
        mockedFetchMyPublishedExercises.mockResolvedValue([
            createPublicExercise({
                id: 'public-ex-shared',
                name: matchingExerciseFromOtherMenu.name,
                sec: matchingExerciseFromOtherMenu.sec,
                emoji: matchingExerciseFromOtherMenu.emoji,
                placement: matchingExerciseFromOtherMenu.placement,
                hasSplit: matchingExerciseFromOtherMenu.hasSplit ?? false,
                sourceCustomExerciseId: matchingExerciseFromOtherMenu.id,
                preserveWithoutMenu: false,
            }),
        ]);

        await publishMenu(
            createMenuGroup({
                id: 'group-1',
                name: '更新後メニュー',
                exerciseIds: [],
                items: [],
            }),
            'みお',
            { existingPublicMenuId: 'public-menu-1' },
        );

        expect(mockedPublishExercise).not.toHaveBeenCalled();
        expect(mockedUnpublishExercise).not.toHaveBeenCalled();
    });

    it('fails closed when published menu lookup fails during cleanup', async () => {
        const removedExercise = createCustomExercise({
            id: 'custom-ex-2',
            name: 'きゅうけい',
            sec: 45,
            emoji: '🛋️',
            placement: 'rest',
        });

        createPublicMenusSupabaseMock([removedExercise], supabaseFromMock);
        mockedFetchMyPublishedMenus.mockRejectedValue(new Error('published menus unavailable'));
        mockedFetchMyPublishedExercises.mockResolvedValue([
            createPublicExercise({
                id: 'public-ex-2',
                name: removedExercise.name,
                sec: removedExercise.sec,
                emoji: removedExercise.emoji,
                placement: removedExercise.placement,
                hasSplit: removedExercise.hasSplit ?? false,
                sourceCustomExerciseId: removedExercise.id,
                preserveWithoutMenu: false,
            }),
        ]);

        await expect(
            publishMenu(
                createMenuGroup({
                    id: 'group-1',
                    name: '更新後メニュー',
                    exerciseIds: [],
                    items: [],
                }),
                'みお',
                { existingPublicMenuId: 'public-menu-1' },
            ),
        ).rejects.toThrow('published menus unavailable');

        expect(mockedUnpublishExercise).not.toHaveBeenCalled();
    });
});
