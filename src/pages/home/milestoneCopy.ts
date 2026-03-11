import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';

type MilestoneKind = FuwafuwaMilestoneEvent['kind'];

export function getMilestoneEmoji(kind: MilestoneKind): string {
    if (kind === 'egg') return '🥚';
    if (kind === 'fairy') return '🧚';
    return '🌟';
}

export function getMilestoneTitle(kind: MilestoneKind): string {
    if (kind === 'egg') return 'たまごが やってきた！';
    if (kind === 'fairy') return 'たまごが かえった！';
    return 'おおきく そだったね！';
}

export function getMilestoneAmbientBadge(kind: MilestoneKind): string {
    if (kind === 'egg') return 'きたよ';
    if (kind === 'fairy') return 'うまれた';
    return 'そだった';
}

export function getMilestoneAriaLabel(kind: MilestoneKind): string {
    if (kind === 'egg') return 'たまごが やってきた';
    if (kind === 'fairy') return 'たまごが かえった';
    return 'おおきく そだった';
}

export function getMilestoneSpeechLines(kind: MilestoneKind, depth: number): string[] {
    const normalizedDepth = Math.max(0, Math.min(2, depth));

    if (kind === 'egg') {
        if (normalizedDepth === 0) {
            return ['あたらしい たまごが', 'きたよ'];
        }
        if (normalizedDepth === 1) {
            return ['これから いっしょに', 'そだっていくよ'];
        }
        return ['また あいに', 'きてくれたら うれしいな'];
    }

    if (kind === 'fairy') {
        if (normalizedDepth === 0) {
            return ['ついに', 'うまれたよ！'];
        }
        if (normalizedDepth === 1) {
            return ['まいにちの がんばり', 'ちゃんと とどいてたよ'];
        }
        return ['これからも', 'いっしょに いたいな'];
    }

    if (normalizedDepth === 0) {
        return ['りっぱに', 'そだったよ！'];
    }
    if (normalizedDepth === 1) {
        return ['ここまで つづけてきたの', 'すごいね'];
    }
    return ['これからも', 'いっしょに いたいな'];
}
