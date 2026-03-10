import { describe, expect, it } from 'vitest';
import {
    getTeacherContentDisplayModeLabel,
    isTeacherContentNew,
    isTeacherContentVisible,
    normalizeTeacherContentDisplayMode,
    pickTeacherContentHighlights,
    sortTeacherContentByRecommendation,
} from '../teacherExerciseMetadata';

describe('teacherExerciseMetadata', () => {
    it('hides teacher_only content from non-teacher classes and respects class_limited', () => {
        expect(isTeacherContentVisible('teacher_only', [], '初級')).toBe(false);
        expect(isTeacherContentVisible('teacher_only', [], '先生')).toBe(true);
        expect(isTeacherContentVisible('class_limited', ['中級'], '初級')).toBe(false);
        expect(isTeacherContentVisible('class_limited', ['中級'], '中級')).toBe(true);
    });

    it('sorts recommended items first and then by recommendedOrder', () => {
        const sorted = sortTeacherContentByRecommendation([
            { name: 'B', recommended: false, recommendedOrder: null },
            { name: 'C', recommended: true, recommendedOrder: 3 },
            { name: 'A', recommended: true, recommendedOrder: 1 },
            { name: 'D', recommended: true, recommendedOrder: null },
        ]);

        expect(sorted.map((item) => item.name)).toEqual(['A', 'C', 'D', 'B']);
    });

    it('normalizes display modes and exposes short labels', () => {
        expect(normalizeTeacherContentDisplayMode('standard_inline')).toBe('standard_inline');
        expect(normalizeTeacherContentDisplayMode('unexpected')).toBe('teacher_section');
        expect(getTeacherContentDisplayModeLabel('standard_inline')).toBe('標準欄');
        expect(getTeacherContentDisplayModeLabel('teacher_section')).toBe('先生欄');
    });

    it('treats items created within 14 days as new', () => {
        const now = new Date('2026-03-10T00:00:00Z').getTime();

        expect(isTeacherContentNew('2026-02-24T00:00:00Z', now)).toBe(true);
        expect(isTeacherContentNew('2026-02-23T23:59:59Z', now)).toBe(false);
    });

    it('picks home highlights by newness first and then recommendation order', () => {
        const now = new Date('2026-03-10T00:00:00Z').getTime();
        const picked = pickTeacherContentHighlights([
            {
                name: '古いおすすめ',
                createdAt: '2026-02-01T00:00:00Z',
                recommended: true,
                recommendedOrder: 1,
            },
            {
                name: '新しい通常',
                createdAt: '2026-03-09T00:00:00Z',
                recommended: false,
                recommendedOrder: null,
            },
            {
                name: '新しいおすすめ',
                createdAt: '2026-03-08T00:00:00Z',
                recommended: true,
                recommendedOrder: 2,
            },
            {
                name: '古い通常',
                createdAt: '2026-02-01T00:00:00Z',
                recommended: false,
                recommendedOrder: null,
            },
        ], 3, now);

        expect(picked.map((item) => item.name)).toEqual([
            '新しいおすすめ',
            '新しい通常',
            '古いおすすめ',
        ]);
    });
});
