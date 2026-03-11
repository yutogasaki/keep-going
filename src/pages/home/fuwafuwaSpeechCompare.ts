import type { FuwafuwaSpeech } from './fuwafuwaHomeCardCopy';

export function isSameRenderedSpeech(left: FuwafuwaSpeech, right: FuwafuwaSpeech): boolean {
    return left.accent === right.accent
        && left.actionLabel === right.actionLabel
        && left.lines.length === right.lines.length
        && left.lines.every((line, index) => line === right.lines[index]);
}
