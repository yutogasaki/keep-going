import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildMenuGroupItemsFromExerciseIds, type MenuGroup } from '../../data/menuGroups';
import type { CustomExercise } from '../db';
import type { PublicExercise } from '../publicExercises';
import type { PublicMenu } from '../publicMenuTypes';
import { publishMenu } from '../publicMenuPublish';
import { getCustomExercises } from '../db';
import { fetchMyPublishedMenus } from '../publicMenuBrowse';
import {
    fetchMyPublishedExercises,
    publishExercise,
    unpublishExercise,
} from '../publicExercises';

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

function createCustomExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return {
        id: overrides.id ?? 'custom-ex-1',
        name: overrides.name ?? 'おひるやすみ',
        sec: overrides.sec ?? 45,
        emoji: overrides.emoji ?? '🛋️',
        placement: overrides.placement ?? 'rest',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description,
        creatorId: overrides.creatorId,
    };
}

function createMenuGroup(overrides: Partial<MenuGroup> & Pick<MenuGroup, 'id' | 'name' | 'exerciseIds'>): MenuGroup {
    return {
        id: overrides.id,
        name: overrides.name,
        emoji: overrides.emoji ?? '🌸',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds,
        items: overrides.items ?? buildMenuGroupItemsFromExerciseIds(overrides.exerciseIds),
        isPreset: overrides.isPreset ?? false,
        creatorId: overrides.creatorId,
        origin: overrides.origin,
        visibility: overrides.visibility,
        focusTags: overrides.focusTags,
        recommended: overrides.recommended,
        recommendedOrder: overrides.recommendedOrder,
        displayMode: overrides.displayMode,
    };
}

function createPublicMenu(overrides: Partial<PublicMenu> & Pick<PublicMenu, 'id' | 'name' | 'exerciseIds'>): PublicMenu {
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
        createdAt: overrides.createdAt ?? '2026-03-17T00:00:00.000Z',
    };
}

function createPublicExercise(overrides: Partial<PublicExercise> & Pick<PublicExercise, 'id' | 'name'>): PublicExercise {
    return {
        id: overrides.id,
        name: overrides.name,
        sec: overrides.sec ?? 45,
        emoji: overrides.emoji ?? '🛋️',
        placement: overrides.placement ?? 'rest',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description ?? null,
        authorName: overrides.authorName ?? 'teacher',
        accountId: overrides.accountId ?? 'account-1',
        downloadCount: overrides.downloadCount ?? 0,
        sourceCustomExerciseId: overrides.sourceCustomExerciseId ?? null,
        preserveWithoutMenu: overrides.preserveWithoutMenu ?? false,
        createdAt: overrides.createdAt ?? '2026-03-17T00:00:00.000Z',
    };
}

function createPublicMenusSupabaseMock(previousCustomExerciseData: PublicMenu['customExerciseData']) {
    const updatePayloads: unknown[] = [];

    supabaseFromMock.mockImplementation((table: string) => {
        if (table !== 'public_menus') {
            throw new Error(`Unexpected table: ${table}`);
        }

        return {
            select: vi.fn(() => {
                const selectChain = {
                    eq: vi.fn(() => selectChain),
                    single: vi.fn(async () => ({
                        data: {
                            custom_exercise_data: previousCustomExerciseData,
                        },
                        error: null,
                    })),
                };
                return selectChain;
            }),
            update: vi.fn((payload: unknown) => {
                updatePayloads.push(payload);
                let eqCount = 0;
                const updateChain = {
                    eq: vi.fn(() => {
                        eqCount += 1;
                        if (eqCount >= 2) {
                            return Promise.resolve({ error: null });
                        }
                        return updateChain;
                    }),
                };
                return updateChain;
            }),
            insert: vi.fn(async () => ({ error: null })),
        };
    });

    return { updatePayloads };
}

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
        const { updatePayloads } = createPublicMenusSupabaseMock([
            keptExercise,
            removedExercise,
        ]);
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

        createPublicMenusSupabaseMock([removedExercise]);
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
});
