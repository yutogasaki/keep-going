import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';
import type { HomeVisitRecency } from './homeVisitMemory';

interface FuwafuwaSpeechPresenceParams {
    speech: FuwafuwaSpeech;
    visitRecency: HomeVisitRecency;
    pokeDepth: number;
}

export function shouldShowFuwafuwaSpeech({
    speech,
    visitRecency: _visitRecency,
    pokeDepth: _pokeDepth,
}: FuwafuwaSpeechPresenceParams): boolean {
    return speech.lines.length > 0 || Boolean(speech.actionLabel);
}
