import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';
import type { HomeVisitRecency } from './homeVisitMemory';

interface FuwafuwaSpeechPresenceParams {
    speech: FuwafuwaSpeech;
    visitRecency: HomeVisitRecency;
    pokeDepth: number;
}

export function shouldShowFuwafuwaSpeech({
    speech,
    visitRecency,
    pokeDepth,
}: FuwafuwaSpeechPresenceParams): boolean {
    if (pokeDepth > 0) {
        return true;
    }

    if (speech.lines.length === 0 || speech.actionLabel) {
        return true;
    }

    if (visitRecency !== 'recent') {
        return true;
    }

    return speech.category !== 'relationship';
}
