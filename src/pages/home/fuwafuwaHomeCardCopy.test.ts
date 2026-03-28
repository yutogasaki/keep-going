import { describe, expect, it } from 'vitest';
import {
    getFamilyEventSpeech,
    getSoftProgress,
    getSoftProgressShort,
    getStageLabel,
    getUserEventSpeech,
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

    it('uses visit recency for family afterglow speech', () => {
        expect(getFamilyEventSpeech(
            3,
            0,
            100,
            null,
            null,
            0,
            'recent',
            { kind: 'magic_delivery', contextKey: 'family:u1|u2|u3' },
        )?.lines).toEqual([
            'さっきの ぽかぽか',
            'まだ みんなの ところに のこってるよ',
        ]);
    });

    it('uses visit recency for user afterglow speech', () => {
        expect(getUserEventSpeech(
            0,
            100,
            2,
            4,
            null,
            null,
            0,
            12,
            { kind: 'magic_delivery', contextKey: 'solo:user-1' },
            false,
            'returning',
        )?.lines).toEqual([
            'また あえて',
            'ぽかぽかも もどってきたよ',
        ]);
    });
});
