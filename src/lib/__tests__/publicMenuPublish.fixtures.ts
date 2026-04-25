import { vi } from 'vitest';
import { buildMenuGroupItemsFromExerciseIds, type MenuGroup } from '../../data/menuGroups';
import type { CustomExercise } from '../db';
import type { PublicExercise } from '../publicExercises';
import type { PublicMenu } from '../publicMenuTypes';

export function createCustomExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
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

export function createMenuGroup(
    overrides: Partial<MenuGroup> & Pick<MenuGroup, 'id' | 'name' | 'exerciseIds'>,
): MenuGroup {
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

export function createPublicMenu(
    overrides: Partial<PublicMenu> & Pick<PublicMenu, 'id' | 'name' | 'exerciseIds'>,
): PublicMenu {
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

export function createPublicExercise(
    overrides: Partial<PublicExercise> & Pick<PublicExercise, 'id' | 'name'>,
): PublicExercise {
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

export function createPublicMenusSupabaseMock(
    previousCustomExerciseData: PublicMenu['customExerciseData'],
    supabaseFromMock: ReturnType<typeof vi.fn>,
) {
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
