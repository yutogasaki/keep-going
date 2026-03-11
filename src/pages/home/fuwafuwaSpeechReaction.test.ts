import { describe, expect, it } from 'vitest';
import { getReactionEmojis, getSpeechReactionStyle } from './fuwafuwaSpeechReaction';

describe('fuwafuwaSpeechReaction', () => {
    it('maps milestone and action speech to celebrating reactions', () => {
        expect(getSpeechReactionStyle({
            id: 'user:milestone:user-1:fairy',
            category: 'event_notice',
            accent: 'primary',
            lines: ['ついに', 'うまれたよ！'],
        })).toBe('celebrating');

        expect(getSpeechReactionStyle({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'primary',
            lines: ['まほうエネルギーが', 'いっぱいだよ'],
        })).toBe('celebrating');

        expect(getSpeechReactionStyle({
            id: 'user:afterglow:magic_delivery',
            category: 'relationship',
            accent: 'primary',
            lines: ['まほうエネルギー', 'ちゃんと とどいたよ'],
        })).toBe('celebrating');
    });

    it('keeps progress, relationship, and mechanic speech distinct', () => {
        expect(getSpeechReactionStyle({
            id: 'user:growing',
            category: 'progress',
            accent: 'primary',
            lines: ['まほうエネルギーが', 'たまってきたよ'],
        })).toBe('growing');

        expect(getSpeechReactionStyle({
            id: 'user:relationship_ready',
            category: 'relationship',
            accent: 'primary',
            lines: ['あえて うれしいな', 'まほうエネルギー ほしいな'],
        })).toBe('cozy');

        expect(getSpeechReactionStyle({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'primary',
            lines: ['まほうエネルギーは', 'ここに たまるんだよ'],
        })).toBe('guiding');
    });

    it('returns style-specific particle sets', () => {
        expect(getReactionEmojis('cozy')).toContain('💖');
        expect(getReactionEmojis('growing')).toContain('🌱');
        expect(getReactionEmojis('guiding')).toContain('💡');
    });
});
