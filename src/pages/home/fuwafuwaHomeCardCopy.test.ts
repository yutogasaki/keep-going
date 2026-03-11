import { describe, expect, it } from 'vitest';
import {
    getFamilyMessage,
    getFamilySpeech,
    getSoftProgress,
    getSoftProgressShort,
    getStageLabel,
    getUserMessage,
    getUserSpeech,
} from './fuwafuwaHomeCardCopy';

describe('fuwafuwaHomeCardCopy', () => {
    it('returns stage labels for each growth phase', () => {
        expect(getStageLabel(1)).toBe('たまご');
        expect(getStageLabel(2)).toBe('ようせい');
        expect(getStageLabel(3)).toBe('おとな');
    });

    it('returns soft progress labels for family and short card states', () => {
        expect(getSoftProgress(95)).toBe('もうすこしで まんたん！');
        expect(getSoftProgressShort(35)).toBe('いいかんじ');
    });

    it('keeps lightweight fallback strings for legacy usage', () => {
        expect(getFamilyMessage(3, 0, 600)).toBe('3にんで ちからを あわせよう！');
        expect(getUserMessage(0, 600, 1, 0)).toBe('まほうは ここに たまっていくんだよ');
        expect(getUserMessage(590, 600, 2, 6)).toBe('もうすぐ おおきく なれそう！');
    });

    it('prioritizes full-magic action hints for solo speech', () => {
        expect(getUserSpeech(600, 600, 2, 6, null)).toEqual({
            id: 'user:magic_full',
            accent: 'primary',
            lines: ['わあ！ まほうが いっぱいだよ', 'ぽんって してみよう'],
        });
        expect(getUserSpeech(600, 600, 2, 6, null, 1)).toEqual({
            id: 'user:magic_full',
            accent: 'primary',
            lines: ['ぽんって さわると', 'ふわふわに おくれるよ'],
        });
    });

    it('surfaces announcement speech before regular progress copy', () => {
        expect(getUserSpeech(120, 600, 2, 6, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジが きたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        })).toEqual({
            id: 'challenge:challenge-1',
            accent: 'primary',
            lines: ['あたらしいチャレンジが きたよ', '前後開脚チャレンジ'],
            actionLabel: 'みてみる',
        });
    });

    it('deepens announcement speech when fuwafuwa is poked', () => {
        const announcement = {
            id: 'challenge:challenge-1',
            kind: 'challenge' as const,
            badgeLabel: 'チャレンジ' as const,
            title: 'あたらしいチャレンジが きたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        };

        expect(getUserSpeech(120, 600, 2, 6, announcement, 1)).toEqual({
            id: 'challenge:challenge-1',
            accent: 'primary',
            lines: ['きょうのきみに', 'あいそうだよ'],
            actionLabel: 'みてみる',
        });

        expect(getUserSpeech(120, 600, 2, 6, announcement, 2)).toEqual({
            id: 'challenge:challenge-1',
            accent: 'primary',
            lines: ['ちょっとだけ', 'のぞいてみる？'],
            actionLabel: 'みてみる',
        });
    });

    it('keeps mechanic hints low-pressure while poke depth advances', () => {
        expect(getUserSpeech(0, 600, 1, 0, null)).toEqual({
            id: 'user:mechanic_hint',
            accent: 'primary',
            lines: ['まほうは ここに', 'たまっていくんだよ'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, 1)).toEqual({
            id: 'user:mechanic_hint',
            accent: 'primary',
            lines: ['いっぱいになると', 'いいこと あるよ'],
        });
    });

    it('returns together-mode speech with info accent', () => {
        expect(getFamilySpeech(2, 300, 600, null)).toEqual({
            id: 'family:growing',
            accent: 'info',
            lines: ['みんなの まほう', 'たまってきたよ'],
        });
    });
});
