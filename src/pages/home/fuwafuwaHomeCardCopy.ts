import type { HomeAnnouncement } from './homeAnnouncementUtils';

export type FuwafuwaSpeechAccent = 'primary' | 'info';

export interface FuwafuwaSpeech {
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
            accent: 'info',
            lines: ['みんなの まほうが', 'いっぱいに なったよ', 'ぽんって してみよう？'],
        };
    }

    if (announcement) {
        return buildAnnouncementSpeech(announcement);
    }

    if (displaySeconds === 0) {
        return {
            accent: 'info',
            lines: [`${peopleLabel} ちからを`, 'あわせよう！'],
        };
    }

    if (percent >= 90) {
        return {
            accent: 'info',
            lines: ['もうすこしで', 'まんたんだね！'],
        };
    }

    if (percent >= 31) {
        return {
            accent: 'info',
            lines: ['みんなの まほう', 'たまってきたよ'],
        };
    }

    return {
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
): FuwafuwaSpeech {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);

    if (percent >= 100) {
        return {
            accent: 'primary',
            lines: ['わあ！ まほうが いっぱいだよ', 'ぽんって さわると', 'ふわふわに おくれるよ'],
        };
    }

    if (announcement) {
        return buildAnnouncementSpeech(announcement);
    }

    if (displaySeconds === 0) {
        if (shouldShowMechanicHint(activeDays)) {
            return {
                accent: 'primary',
                lines: ['まほうは ここに', stage === 1 ? 'たまっていくんだよ' : 'すこしずつ たまるんだよ'],
            };
        }

        return {
            accent: 'primary',
            lines: stage === 1
                ? ['きょうも まってたよ', 'いっしょに やってみよう？']
                : ['あえて うれしいな', 'いっしょに やってみよう？'],
        };
    }

    if (stage === 2 && activeDays >= 6) {
        return {
            accent: 'primary',
            lines: ['もうすぐ', 'おおきく なれそう！'],
        };
    }

    if (percent >= 90) {
        return {
            accent: 'primary',
            lines: ['もうすこしで', 'まんたん！'],
        };
    }

    if (percent >= 31) {
        return {
            accent: 'primary',
            lines: ['いいかんじ！', 'まほうが たまってきたよ'],
        };
    }

    return {
        accent: 'primary',
        lines: ['すこしずつ', 'たまってきたね'],
    };
}

export function getUserMessage(displaySeconds: number, targetSeconds: number, stage: number, activeDays: number) {
    return getUserSpeech(displaySeconds, targetSeconds, stage, activeDays, null).lines.join(' ');
}
