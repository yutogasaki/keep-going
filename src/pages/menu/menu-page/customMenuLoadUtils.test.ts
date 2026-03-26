import { describe, expect, it } from 'vitest';
import type { MenuGroup } from '../../../data/menuGroups';
import type { CustomExercise } from '../../../lib/db';
import {
    filterVisibleCustomExercises,
    filterVisibleCustomGroups,
} from './customMenuLoadUtils';

function makeGroup(overrides: Partial<MenuGroup> = {}): MenuGroup {
    return {
        id: 'group-1',
        name: 'じぶんメニュー',
        emoji: '🌟',
        description: 'テスト用メニュー',
        exerciseIds: ['S01'],
        isPreset: false,
        creatorId: 'user-1',
        ...overrides,
    };
}

function makeExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return {
        id: 'custom-ex-1',
        name: 'じぶん種目',
        sec: 30,
        emoji: '🩰',
        placement: 'stretch',
        creatorId: 'user-1',
        ...overrides,
    };
}

describe('customMenuLoadUtils', () => {
    it('shows all custom groups in together mode', () => {
        expect(filterVisibleCustomGroups([
            makeGroup({ id: 'mine', creatorId: 'user-1' }),
            makeGroup({ id: 'family', creatorId: undefined }),
            makeGroup({ id: 'other', creatorId: 'user-2' }),
        ], 'user-1', true).map((group) => group.id)).toEqual(['mine', 'family', 'other']);
    });

    it('filters custom groups to the current user outside together mode', () => {
        expect(filterVisibleCustomGroups([
            makeGroup({ id: 'mine', creatorId: 'user-1' }),
            makeGroup({ id: 'family', creatorId: undefined }),
            makeGroup({ id: 'other', creatorId: 'user-2' }),
        ], 'user-1', false).map((group) => group.id)).toEqual(['mine', 'family']);
    });

    it('filters custom exercises to the current user outside together mode', () => {
        expect(filterVisibleCustomExercises([
            makeExercise({ id: 'mine', creatorId: 'user-1' }),
            makeExercise({ id: 'family', creatorId: undefined }),
            makeExercise({ id: 'other', creatorId: 'user-2' }),
        ], 'user-1', false).map((exercise) => exercise.id)).toEqual(['mine', 'family']);
    });
});
