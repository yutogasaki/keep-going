import { describe, expect, it } from 'vitest';
import { isSameRenderedSpeech } from './fuwafuwaSpeechCompare';

describe('fuwafuwaSpeechCompare', () => {
    it('treats identical visible speech as the same even when ids differ', () => {
        expect(isSameRenderedSpeech({
            id: 'user:mood',
            category: 'progress',
            accent: 'everyday',
            lines: ['なんだか ぽかぽか', 'してきたよ'],
        }, {
            id: 'user:growing',
            category: 'progress',
            accent: 'everyday',
            lines: ['なんだか ぽかぽか', 'してきたよ'],
        })).toBe(true);
    });

    it('treats different visible lines as different speech', () => {
        expect(isSameRenderedSpeech({
            id: 'user:mood',
            category: 'progress',
            accent: 'everyday',
            lines: ['なんだか ぽかぽか', 'してきたよ'],
        }, {
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        })).toBe(false);
    });
});
