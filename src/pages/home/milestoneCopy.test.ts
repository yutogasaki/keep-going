import { describe, expect, it } from 'vitest';
import {
    getMilestoneAmbientBadge,
    getMilestoneAriaLabel,
    getMilestoneEmoji,
    getMilestoneSpeechLines,
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

    it('returns milestone speech lines for modal handoff', () => {
        expect(getMilestoneSpeechLines('egg', 0)).toEqual(['あたらしい たまごが', 'きたよ']);
        expect(getMilestoneSpeechLines('egg', 1)).toEqual(['これから いっしょに', 'そだっていくよ']);
        expect(getMilestoneSpeechLines('egg', 2)).toEqual(['また あいに', 'きてくれたら うれしいな']);

        expect(getMilestoneSpeechLines('fairy', 0)).toEqual(['ついに', 'うまれたよ！']);
        expect(getMilestoneSpeechLines('fairy', 2)).toEqual(['これからも', 'いっしょに いたいな']);

        expect(getMilestoneSpeechLines('adult', 0)).toEqual(['りっぱに', 'そだったよ！']);
        expect(getMilestoneSpeechLines('adult', 1)).toEqual(['ここまで つづけてきたの', 'すごいね']);
        expect(getMilestoneSpeechLines('adult', 2)).toEqual(['これからも', 'いっしょに いたいな']);
    });
});
