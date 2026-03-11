import { describe, expect, it } from 'vitest';
import {
    getMilestoneAmbientBadge,
    getMilestoneAriaLabel,
    getMilestoneEmoji,
    getMilestoneTitle,
} from './milestoneCopy';

describe('milestoneCopy', () => {
    it('returns the expected titles for each milestone kind', () => {
        expect(getMilestoneTitle('egg')).toBe('たまごが やってきた！');
        expect(getMilestoneTitle('fairy')).toBe('たまごが かえった！');
        expect(getMilestoneTitle('adult')).toBe('おおきく そだったね！');
    });

    it('returns ambient badge text and aria labels for together cards', () => {
        expect(getMilestoneEmoji('egg')).toBe('🥚');
        expect(getMilestoneAmbientBadge('egg')).toBe('きたよ');
        expect(getMilestoneAriaLabel('egg')).toBe('たまごが やってきた');

        expect(getMilestoneEmoji('fairy')).toBe('🧚');
        expect(getMilestoneAmbientBadge('fairy')).toBe('うまれた');
        expect(getMilestoneAriaLabel('fairy')).toBe('たまごが かえった');

        expect(getMilestoneEmoji('adult')).toBe('🌟');
        expect(getMilestoneAmbientBadge('adult')).toBe('そだった');
        expect(getMilestoneAriaLabel('adult')).toBe('おおきく そだった');
    });
});
