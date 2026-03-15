import { describe, expect, it } from 'vitest';
import { buildMenuGroupItemsFromExerciseIds } from '../../data/menuGroups';
import type { PublicExercise } from '../../lib/publicExercises';
import type { PublicMenu } from '../../lib/publicMenuTypes';
import { pickHomeAmbientCue } from './homeAmbientUtils';

function makeMenu(overrides: Partial<PublicMenu> = {}): PublicMenu {
    const exerciseIds = overrides.exerciseIds ?? ['S01'];

    return {
        id: 'menu-1',
        name: 'みんなのメニュー',
        emoji: '🌸',
        description: '',
        exerciseIds,
        items: overrides.items ?? buildMenuGroupItemsFromExerciseIds(exerciseIds),
        customExerciseData: [],
        authorName: 'だれか',
        accountId: 'account-1',
        downloadCount: 0,
        createdAt: '2026-03-10T00:00:00.000Z',
        ...overrides,
    };
}

function makeExercise(overrides: Partial<PublicExercise> = {}): PublicExercise {
    return {
        id: 'exercise-1',
        name: 'かえるさん',
        sec: 30,
        emoji: '👑',
        placement: 'stretch',
        hasSplit: false,
        description: null,
        authorName: 'だれか',
        accountId: 'account-1',
        downloadCount: 0,
        createdAt: '2026-03-10T00:00:00.000Z',
        ...overrides,
    };
}

describe('pickHomeAmbientCue', () => {
    it('prioritizes newly added public menus', () => {
        expect(pickHomeAmbientCue([makeMenu()], [], new Date('2026-03-11T00:00:00.000Z').getTime()))
            .toEqual({ kind: 'public_menu_new' });
    });

    it('falls back to menus with custom exercises', () => {
        expect(pickHomeAmbientCue([
            makeMenu({
                createdAt: '2026-02-01T00:00:00.000Z',
                exerciseIds: ['custom-1'],
                customExerciseData: [{
                    id: 'custom-1',
                    name: 'じぶんのしゅもく',
                    emoji: '🦋',
                    sec: 20,
                    placement: 'stretch',
                }],
            }),
        ], [], new Date('2026-03-11T00:00:00.000Z').getTime()))
            .toEqual({ kind: 'public_menu_custom' });
    });

    it('uses public exercise discovery when menu cues are unavailable', () => {
        expect(pickHomeAmbientCue([
            makeMenu({ createdAt: '2026-02-01T00:00:00.000Z' }),
        ], [makeExercise()], new Date('2026-03-11T00:00:00.000Z').getTime()))
            .toEqual({ kind: 'public_exercise' });
    });

    it('returns null when there is no ambient discovery signal', () => {
        expect(pickHomeAmbientCue([
            makeMenu({ createdAt: '2026-02-01T00:00:00.000Z' }),
        ], [], new Date('2026-03-11T00:00:00.000Z').getTime()))
            .toBeNull();
    });
});
