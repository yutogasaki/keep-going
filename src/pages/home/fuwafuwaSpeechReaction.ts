import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';

export type FuwafuwaReactionStyle =
    | 'cozy'
    | 'growing'
    | 'sharing'
    | 'celebrating'
    | 'guiding';

export function getSpeechReactionStyle(speech: FuwafuwaSpeech): FuwafuwaReactionStyle {
    if (speech.id.includes(':milestone:')) {
        return 'celebrating';
    }

    if (speech.id.includes(':afterglow:magic')) {
        return 'celebrating';
    }

    if (speech.category === 'action_hint') {
        return 'celebrating';
    }

    if (speech.category === 'event_notice') {
        return speech.accent === 'primary' ? 'sharing' : 'guiding';
    }

    if (speech.category === 'progress') {
        return 'growing';
    }

    if (speech.category === 'relationship') {
        return 'cozy';
    }

    return 'guiding';
}

export function getReactionEmojis(style: FuwafuwaReactionStyle): string[] {
    switch (style) {
    case 'celebrating':
        return ['💖', '💖', '🎵', '🎉', '🌟', '✨', '🫧', '💫'];
    case 'sharing':
        return ['🎵', '🎵', '💖', '✨', '🫧', '🌈', '🌟', '🎶'];
    case 'growing':
        return ['💖', '🎵', '🌱', '✨', '🫧', '💚', '🍀', '🌼'];
    case 'guiding':
        return ['🎵', '💖', '🫧', '✨', '🔆', '💡', '🌟', '🌈'];
    case 'cozy':
    default:
        return ['💖', '💖', '🎵', '✨', '🫧', '🌙', '🤍', '💫'];
    }
}
