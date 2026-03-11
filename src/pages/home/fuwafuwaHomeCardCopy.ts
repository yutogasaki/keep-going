import type { HomeAnnouncement } from './homeAnnouncementUtils';

export type FuwafuwaSpeechAccent = 'primary' | 'info';

export interface FuwafuwaSpeech {
    id: string;
    accent: FuwafuwaSpeechAccent;
    lines: string[];
    actionLabel?: string;
}

export function getStageLabel(stage: number) {
    if (stage === 1) return 'たまご';
    if (stage === 2) return 'ようせい';
    return 'おとな';
}

export function getSoftProgress(percent: number) {
    if (percent >= 100) return 'まんたん！✨';
    if (percent >= 90) return 'もうすこしで まんたん！';
    if (percent >= 61) return 'けっこう たまった！';
    if (percent >= 31) return 'いいかんじ！';
    if (percent >= 1) return 'すこし たまってきた';
    return 'からっぽ';
}

export function getSoftProgressShort(percent: number) {
    if (percent >= 100) return 'まんたん✨';
    if (percent >= 90) return 'あとすこし';
    if (percent >= 61) return 'いっぱい';
    if (percent >= 31) return 'いいかんじ';
    if (percent >= 1) return 'すこし';
    return 'からっぽ';
}

function buildAnnouncementSpeech(announcement: HomeAnnouncement): FuwafuwaSpeech {
    return {
        id: announcement.id,
        accent: announcement.kind === 'challenge' ? 'primary' : 'info',
        lines: [announcement.title, announcement.detail],
        actionLabel: announcement.actionLabel,
    };
}

function shouldShowMechanicHint(activeDays: number): boolean {
    return activeDays <= 2 || activeDays % 5 === 0;
}

export function getFamilySpeech(
    activeCount: number,
    displaySeconds: number,
    targetSeconds: number,
    announcement: HomeAnnouncement | null,
): FuwafuwaSpeech {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;

    if (percent >= 100) {
        return {
            id: 'family:magic_full',
            accent: 'info',
            lines: ['みんなの まほうが', 'いっぱいに なったよ', 'ぽんって してみよう？'],
        };
    }

    if (announcement) {
        return buildAnnouncementSpeech(announcement);
    }

    if (displaySeconds === 0) {
        return {
            id: `family:idle:${activeCount}`,
            accent: 'info',
            lines: [`${peopleLabel} ちからを`, 'あわせよう！'],
        };
    }

    if (percent >= 90) {
        return {
            id: 'family:almost_full',
            accent: 'info',
            lines: ['もうすこしで', 'まんたんだね！'],
        };
    }

    if (percent >= 31) {
        return {
            id: 'family:growing',
            accent: 'info',
            lines: ['みんなの まほう', 'たまってきたよ'],
        };
    }

    return {
        id: 'family:small_progress',
        accent: 'info',
        lines: ['いいかんじ！', 'みんなで ためてるね'],
    };
}

export function getFamilyMessage(activeCount: number, displaySeconds: number, targetSeconds: number) {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;

    if (percent >= 100) {
        return 'みんな すごい！ まんたんだよ';
    }

    if (displaySeconds === 0) {
        return `${peopleLabel} ちからを あわせよう！`;
    }

    if (percent >= 90) {
        return `${peopleLabel} もうすこしで まんたん！`;
    }

    return 'みんなの まほう、たまってきたよ！';
}

export function getUserSpeech(
    displaySeconds: number,
    targetSeconds: number,
    stage: number,
    activeDays: number,
    announcement: HomeAnnouncement | null,
    pokeDepth = 0,
): FuwafuwaSpeech {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    const depth = Math.max(0, Math.min(2, pokeDepth));

    if (percent >= 100) {
        return {
            id: 'user:magic_full',
            accent: 'primary',
            lines: depth === 0
                ? ['わあ！ まほうが いっぱいだよ', 'ぽんって してみよう']
                : depth === 1
                    ? ['ぽんって さわると', 'ふわふわに おくれるよ']
                    : ['やさしく ぽんって', 'してみよう？'],
        };
    }

    if (announcement) {
        if (depth === 0) {
            return buildAnnouncementSpeech(announcement);
        }

        if (announcement.kind === 'challenge') {
            return {
                id: announcement.id,
                accent: 'primary',
                lines: depth === 1
                    ? ['きょうのきみに', 'あいそうだよ']
                    : ['ちょっとだけ', 'のぞいてみる？'],
                actionLabel: announcement.actionLabel,
            };
        }

        return {
            id: announcement.id,
            accent: 'info',
            lines: depth === 1
                ? ['このまえのレッスンに', 'ぴったりかも']
                : ['メニューで', 'みてみる？'],
            actionLabel: announcement.actionLabel,
        };
    }

    if (displaySeconds === 0) {
        if (shouldShowMechanicHint(activeDays)) {
            return {
                id: 'user:mechanic_hint',
                accent: 'primary',
                lines: depth === 0
                    ? ['まほうは ここに', stage === 1 ? 'たまっていくんだよ' : 'すこしずつ たまるんだよ']
                    : depth === 1
                        ? ['いっぱいになると', 'いいこと あるよ']
                        : ['すこしずつ', 'ためてみよう'],
            };
        }

        return {
            id: stage === 1 ? 'user:relationship_waiting' : 'user:relationship_ready',
            accent: 'primary',
            lines: stage === 1
                ? (
                    depth === 0
                        ? ['きょうも まってたよ', 'いっしょに やってみよう？']
                        : depth === 1
                            ? ['ツンツン してくれて', 'うれしいな']
                            : ['また さわってくれて', 'ありがとう']
                )
                : (
                    depth === 0
                        ? ['あえて うれしいな', 'いっしょに やってみよう？']
                        : depth === 1
                            ? ['ふわふわ なんだか', 'ごきげんだよ']
                            : ['いっしょだと', 'たのしいね']
                ),
        };
    }

    if (stage === 2 && activeDays >= 6) {
        return {
            id: 'user:growth_soon',
            accent: 'primary',
            lines: depth === 0
                ? ['もうすぐ', 'おおきく なれそう！']
                : depth === 1
                    ? ['ちょっとずつ', 'へんかしてるよ']
                    : ['みててね', 'たのしみだね'],
        };
    }

    if (percent >= 90) {
        return {
            id: 'user:almost_full',
            accent: 'primary',
            lines: depth === 0
                ? ['もうすこしで', 'まんたん！']
                : depth === 1
                    ? ['あと ほんのちょっとで', 'いっぱいだよ']
                    : ['このまま いけば', 'すぐ たまるよ'],
        };
    }

    if (percent >= 31) {
        return {
            id: 'user:growing',
            accent: 'primary',
            lines: depth === 0
                ? ['いいかんじ！', 'まほうが たまってきたよ']
                : depth === 1
                    ? ['このまま すこしずつ', 'ためていこう']
                    : ['ふわふわ', 'なんだか うれしいな'],
        };
    }

    return {
        id: 'user:small_progress',
        accent: 'primary',
        lines: depth === 0
            ? ['すこしずつ', 'たまってきたね']
            : depth === 1
                ? ['このペースも', 'いいかんじだよ']
                : ['あせらなくて', 'だいじょうぶ'],
    };
}

export function getUserMessage(displaySeconds: number, targetSeconds: number, stage: number, activeDays: number) {
    return getUserSpeech(displaySeconds, targetSeconds, stage, activeDays, null).lines.join(' ');
}
