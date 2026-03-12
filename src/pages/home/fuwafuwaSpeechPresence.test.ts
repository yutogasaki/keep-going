import { describe, expect, it } from 'vitest';
import { shouldShowFuwafuwaSpeech } from './fuwafuwaSpeechPresence';

describe('fuwafuwaSpeechPresence', () => {
    it('hides only recent low-priority relationship speech at depth 0', () => {
        expect(shouldShowFuwafuwaSpeech({
            speech: {
                id: 'user:relationship_ready',
                category: 'relationship',
                accent: 'everyday',
                lines: ['また すぐ あえたね', 'ふわふわ うれしいな'],
            },
            visitRecency: 'recent',
            pokeDepth: 0,
        })).toBe(false);
    });

    it('keeps important or user-expanded speech visible', () => {
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
                id: 'user:relationship_ready',
                category: 'relationship',
                accent: 'everyday',
                lines: ['また すぐ あえたね', 'ふわふわ うれしいな'],
            },
            visitRecency: 'recent',
            pokeDepth: 1,
        })).toBe(true);
    });
});
