import { describe, expect, it } from 'vitest';
import type { TeacherItemOverride } from '../../../lib/teacherItemOverrides';
import {
    applyStatusChange,
    buildBuiltInExerciseInitial,
    buildBuiltInMenuInitial,
    getMenuSettingStatusByClass,
    getUpdatedVisibleClassLevels,
    hasStatusByClassChanges,
} from './menuSettingsControllerHelpers';

function createOverride(overrides: Partial<TeacherItemOverride> & Pick<TeacherItemOverride, 'id' | 'itemId' | 'itemType'>): TeacherItemOverride {
    return {
        id: overrides.id,
        itemId: overrides.itemId,
        itemType: overrides.itemType,
        nameOverride: overrides.nameOverride ?? null,
        descriptionOverride: overrides.descriptionOverride ?? null,
        emojiOverride: overrides.emojiOverride ?? null,
        secOverride: overrides.secOverride ?? null,
        hasSplitOverride: overrides.hasSplitOverride ?? null,
        exerciseIdsOverride: overrides.exerciseIdsOverride ?? null,
        displayModeOverride: overrides.displayModeOverride ?? null,
        createdBy: overrides.createdBy ?? 'teacher@example.com',
    };
}

describe('menuSettingsControllerHelpers', () => {
    it('builds built-in exercise initial values with teacher overrides applied', () => {
        const initial = buildBuiltInExerciseInitial('S01', [
            createOverride({
                id: 'ov-ex-1',
                itemId: 'S01',
                itemType: 'exercise',
                nameOverride: '先生のS01',
                emojiOverride: '✨',
                secOverride: 45,
                descriptionOverride: '上書き説明',
                hasSplitOverride: true,
            }),
        ]);

        expect(initial).toMatchObject({
            id: 'S01',
            name: '先生のS01',
            emoji: '✨',
            sec: 45,
            description: '上書き説明',
            hasSplit: true,
        });
    });

    it('builds built-in menu initial values with teacher overrides applied', () => {
        const initial = buildBuiltInMenuInitial('preset-basic', [
            createOverride({
                id: 'ov-menu-1',
                itemId: 'preset-basic',
                itemType: 'menu_group',
                nameOverride: '先生の基本',
                emojiOverride: '📋',
                descriptionOverride: '上書きメニュー',
                exerciseIdsOverride: ['S01', 'S02'],
            }),
        ]);

        expect(initial).toMatchObject({
            id: 'preset-basic',
            name: '先生の基本',
            emoji: '📋',
            description: '上書きメニュー',
            exerciseIds: ['S01', 'S02'],
        });
    });

    it('derives per-class statuses with optional as default', () => {
        const statusByClass = getMenuSettingStatusByClass([
            {
                id: 'setting-1',
                itemId: 'S01',
                itemType: 'exercise',
                classLevel: '初級',
                status: 'required',
                createdBy: 'teacher@example.com',
            },
        ], 'S01', 'exercise');

        expect(statusByClass['初級']).toBe('required');
        expect(statusByClass['中級']).toBe('optional');
    });

    it('detects whether per-class statuses changed', () => {
        expect(hasStatusByClassChanges(
            { 初級: 'required', 中級: 'optional' },
            { 初級: 'required', 中級: 'optional' },
        )).toBe(false);

        expect(hasStatusByClassChanges(
            { 初級: 'hidden', 中級: 'optional' },
            { 初級: 'required', 中級: 'optional' },
        )).toBe(true);
    });

    it('applies a single class status change without losing other classes', () => {
        expect(applyStatusChange(
            { 初級: 'hidden', 中級: 'optional', 上級: 'excluded' },
            '中級',
            'hidden',
        )).toEqual({
            初級: 'hidden',
            中級: 'hidden',
            上級: 'excluded',
        });
    });

    it('derives updated visible class levels for quick card changes', () => {
        expect(getUpdatedVisibleClassLevels(
            ['初級'],
            { プレ: 'hidden', 初級: 'optional', 中級: 'hidden', 上級: 'hidden' },
            '中級',
            'optional',
        )).toEqual(['初級', '中級']);

        expect(getUpdatedVisibleClassLevels(
            ['初級', '中級'],
            { プレ: 'hidden', 初級: 'optional', 中級: 'optional', 上級: 'hidden' },
            '中級',
            'hidden',
        )).toEqual(['初級']);
    });
});
