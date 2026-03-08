import { describe, expect, it } from 'vitest';
import { buildGroupCardSummary, resolveGroupExercise } from '../groupCardUtils';
import type { MenuGroup } from '../../../../data/menuGroups';

describe('groupCardUtils', () => {
    it('prefers built-in exercises and falls back to the custom exercise map', () => {
        expect(resolveGroupExercise('S01')).toMatchObject({
            id: 'S01',
            name: '開脚',
        });

        expect(resolveGroupExercise('custom-1', new Map([
            ['custom-1', {
                name: 'みぎて のばし',
                emoji: '🖐️',
                sec: 20,
                placement: 'stretch',
            }],
        ]))).toEqual({
            id: 'custom-1',
            name: 'みぎて のばし',
            emoji: '🖐️',
            sec: 20,
            placement: 'stretch',
        });
    });

    it('counts only non-rest exercises toward total minutes and exercise count', () => {
        const group: MenuGroup = {
            id: 'group-1',
            name: 'テストメニュー',
            emoji: '🌟',
            description: 'test',
            exerciseIds: ['S01', 'R01', 'custom-1'],
        };

        const summary = buildGroupCardSummary(group, new Map([
            ['custom-1', {
                name: 'カスタム',
                emoji: '✨',
                sec: 25,
                placement: 'core',
            }],
        ]));

        expect(summary.exerciseCount).toBe(2);
        expect(summary.minutes).toBe(1);
        expect(summary.exercises.map((exercise) => exercise.id)).toEqual(['S01', 'R01', 'custom-1']);
    });

    it('drops unknown exercise ids from the detail list', () => {
        const group: MenuGroup = {
            id: 'group-2',
            name: 'missing check',
            emoji: '🧪',
            description: null,
            exerciseIds: ['missing-id'],
        };

        const summary = buildGroupCardSummary(group);

        expect(summary).toEqual({
            exercises: [],
            minutes: 0,
            exerciseCount: 0,
        });
    });
});
