import { describe, expect, it } from 'vitest';
import { shouldShowFuwafuwaSpeech } from './fuwafuwaSpeechPresence';

describe('fuwafuwaSpeechPresence', () => {
    it('keeps normal speech visible even on recent revisits', () => {
        expect(shouldShowFuwafuwaSpeech({
            speech: {
                id: 'user:relationship_ready',
                category: 'relationship',
                accent: 'everyday',
                lines: ['また すぐ あえたね', 'ふわふわ うれしいな'],
            },
            visitRecency: 'recent',
            pokeDepth: 0,
        })).toBe(true);
    });

    it('hides only empty speech payloads', () => {
        expect(shouldShowFuwafuwaSpeech({
            speech: {
                id: 'user:growing',
                category: 'progress',
                accent: 'magic',
                lines: ['まほうエネルギーが', 'たまってきたよ'],
            },
            visitRecency: 'recent',
            pokeDepth: 0,
        })).toBe(true);

        expect(shouldShowFuwafuwaSpeech({
            speech: {
                id: 'user:none',
                category: 'relationship',
                accent: 'everyday',
                lines: [],
            },
            visitRecency: 'recent',
            pokeDepth: 0,
        })).toBe(false);
    });
});
