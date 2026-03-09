import { describe, expect, it } from 'vitest';
import {
    isTeacherContentVisible,
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
});
