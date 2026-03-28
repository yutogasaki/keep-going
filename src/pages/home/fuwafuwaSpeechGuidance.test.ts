import { describe, expect, it } from 'vitest';
import {
    getFamilyAfterglowLines,
    getFamilyGreetingLines,
    getUserAfterglowLines,
    getUserGreetingLines,
} from './fuwafuwaSpeechGuidance';

describe('fuwafuwaSpeechGuidance', () => {
    it('returns reunion-aware family greeting lines', () => {
        expect(getFamilyGreetingLines(3, 'recent', 0)).toEqual([
            'また すぐ あえたね',
            'このぽかぽか まだ のこってるよ',
        ]);
        expect(getFamilyGreetingLines(3, 'returning', 1)).toEqual([
            'ひさしぶりだね',
            'また きてくれて うれしいな',
        ]);
    });

    it('returns reunion-aware user greeting lines', () => {
        expect(getUserGreetingLines(2, 'today', 1)).toEqual([
            'きょう もういちど',
            'あえて うれしいな',
        ]);
        expect(getUserGreetingLines(2, 'returning', 0)).toEqual([
            'また あえて うれしいな',
            'ふわふわ まってたよ',
        ]);
    });

    it('returns session-afterglow lines for family revisits', () => {
        expect(getFamilyAfterglowLines('magic_delivery', 'recent', 0)).toEqual([
            'さっきの ぽかぽか',
            'まだ みんなの ところに のこってるよ',
        ]);
        expect(getFamilyAfterglowLines('announcement', 'returning', 1)).toEqual([
            'ひさしぶりでも',
            'ちゃんと おぼえてるよ',
        ]);
    });

    it('returns session-afterglow lines for solo revisits', () => {
        expect(getUserAfterglowLines('magic_delivery', 'returning', 0)).toEqual([
            'また あえて',
            'ぽかぽかも もどってきたよ',
        ]);
        expect(getUserAfterglowLines('announcement', 'recent', 1)).toEqual([
            'また みにきてくれて',
            'ふわふわ うれしいな',
        ]);
    });
});
