import { describe, expect, it } from 'vitest';
import { getReactionEmojis, getSpeechReactionStyle } from './fuwafuwaSpeechReaction';

describe('fuwafuwaSpeechReaction', () => {
    it('maps milestone and action speech to celebrating reactions', () => {
        expect(getSpeechReactionStyle({
            id: 'user:milestone:user-1:fairy',
            category: 'event_notice',
            accent: 'event',
            lines: ['ついに', 'うまれたよ！'],
        })).toBe('celebrating');

        expect(getSpeechReactionStyle({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'magic',
            lines: ['まほうエネルギーが', 'いっぱいだよ'],
        })).toBe('celebrating');

        expect(getSpeechReactionStyle({
            id: 'user:afterglow:magic_delivery',
            category: 'relationship',
            accent: 'magic',
            lines: ['まほうエネルギー', 'ちゃんと とどいたよ'],
        })).toBe('celebrating');
    });

    it('keeps progress, relationship, and mechanic speech distinct', () => {
        expect(getSpeechReactionStyle({
            id: 'user:mood',
            category: 'progress',
            accent: 'everyday',
            lines: ['なんだか ぽかぽか', 'してきたよ'],
        })).toBe('cozy');

        expect(getSpeechReactionStyle({
            id: 'user:growing',
            category: 'progress',
            accent: 'magic',
            lines: ['まほうエネルギーが', 'たまってきたよ'],
        })).toBe('growing');

        expect(getSpeechReactionStyle({
            id: 'user:relationship_ready',
            category: 'relationship',
            accent: 'everyday',
            lines: ['あえて うれしいな', 'まほうエネルギー ほしいな'],
        })).toBe('cozy');

        expect(getSpeechReactionStyle({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['まほうエネルギーは', 'ここに たまるんだよ'],
        })).toBe('guiding');
    });

    it('returns style-specific particle sets', () => {
        expect(getReactionEmojis('cozy')).toContain('💖');
        expect(getReactionEmojis('cozy')).toContain('🎵');
        expect(getReactionEmojis('growing')).toContain('🌱');
        expect(getReactionEmojis('growing')).toContain('💖');
        expect(getReactionEmojis('guiding')).toContain('💡');
        expect(getReactionEmojis('guiding')).toContain('🎵');
    });
});
