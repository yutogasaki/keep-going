import { describe, expect, it } from 'vitest';
import { buildWeeklyActivityScale } from './weeklyActivityChartScale';

describe('buildWeeklyActivityScale', () => {
    it('scales active days by the actual active min and max instead of total students', () => {
        const scale = buildWeeklyActivityScale([0, 18, 20, 21, 23, 25, 0]);

        expect(scale.label).toBe('18-25人');
        expect(scale.getHeightPercent(18)).toBe(28);
        expect(scale.getHeightPercent(25)).toBe(96);
        expect(scale.getHeightPercent(0)).toBe(8);
        expect(scale.getHeightPercent(21)).toBeGreaterThan(scale.getHeightPercent(20));
    });

    it('keeps equal active counts visually stable', () => {
        const scale = buildWeeklyActivityScale([0, 4, 4, 0, 4, 0, 4]);

        expect(scale.label).toBe('4人');
        expect(scale.getHeightPercent(4)).toBe(72);
        expect(scale.getHeightPercent(0)).toBe(8);
    });

    it('handles a week with no activity', () => {
        const scale = buildWeeklyActivityScale([0, 0, 0, 0, 0, 0, 0]);

        expect(scale.label).toBe('0人');
        expect(scale.getHeightPercent(0)).toBe(8);
    });
});
