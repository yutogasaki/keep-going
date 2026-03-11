import type { HomeAnnouncement } from './homeAnnouncementUtils';

export type FuwafuwaSpeechAccent = 'primary' | 'info';
export type FuwafuwaSpeechCategory =
    | 'action_hint'
    | 'event_notice'
    | 'progress'
    | 'relationship'
    | 'mechanic_hint';

export interface FuwafuwaSpeech {
    id: string;
    category: FuwafuwaSpeechCategory;
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

function createSpeech({
    id,
    category,
    accent,
    lines,
    actionLabel,
}: FuwafuwaSpeech): FuwafuwaSpeech {
    return {
        id,
        category,
        accent,
        lines,
        actionLabel,
    };
}

function pickFirstSpeech(...candidates: Array<FuwafuwaSpeech | null>): FuwafuwaSpeech {
    const speech = candidates.find((candidate) => candidate !== null);
    if (!speech) {
        throw new Error('Fuwafuwa speech candidates must include at least one message.');
    }

    return speech;
}

function buildAnnouncementSpeech(announcement: HomeAnnouncement): FuwafuwaSpeech {
    return createSpeech({
        id: announcement.id,
        category: 'event_notice',
        accent: announcement.kind === 'challenge' ? 'primary' : 'info',
        lines: [announcement.title, announcement.detail],
        actionLabel: announcement.actionLabel,
    });
}

function shouldShowMechanicHint(activeDays: number): boolean {
    return activeDays <= 2 || activeDays % 5 === 0;
}

function getFamilyActionSpeech(percent: number): FuwafuwaSpeech | null {
    if (percent < 100) {
        return null;
    }

    return createSpeech({
        id: 'family:magic_full',
        category: 'action_hint',
        accent: 'info',
        lines: ['みんなの まほうが', 'いっぱいに なったよ', 'ぽんって してみよう？'],
    });
}

function getFamilyEventSpeech(announcement: HomeAnnouncement | null): FuwafuwaSpeech | null {
    if (!announcement) {
        return null;
    }

    return buildAnnouncementSpeech(announcement);
}

function getFamilyRelationshipSpeech(activeCount: number, displaySeconds: number): FuwafuwaSpeech | null {
    if (displaySeconds !== 0) {
        return null;
    }

    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;
    return createSpeech({
        id: `family:idle:${activeCount}`,
        category: 'relationship',
        accent: 'info',
        lines: [`${peopleLabel} ちからを`, 'あわせよう！'],
    });
}

function getFamilyProgressSpeech(percent: number): FuwafuwaSpeech {
    if (percent >= 90) {
        return createSpeech({
            id: 'family:almost_full',
            category: 'progress',
            accent: 'info',
            lines: ['もうすこしで', 'まんたんだね！'],
        });
    }

    if (percent >= 31) {
        return createSpeech({
            id: 'family:growing',
            category: 'progress',
            accent: 'info',
            lines: ['みんなの まほう', 'たまってきたよ'],
        });
    }

    return createSpeech({
        id: 'family:small_progress',
        category: 'progress',
        accent: 'info',
        lines: ['いいかんじ！', 'みんなで ためてるね'],
    });
}

export function getFamilySpeech(
    activeCount: number,
    displaySeconds: number,
    targetSeconds: number,
    announcement: HomeAnnouncement | null,
): FuwafuwaSpeech {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    return pickFirstSpeech(
        getFamilyActionSpeech(percent),
        getFamilyEventSpeech(announcement),
        getFamilyRelationshipSpeech(activeCount, displaySeconds),
        getFamilyProgressSpeech(percent),
    );
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
    daysAlive = 0,
): FuwafuwaSpeech {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    const depth = Math.max(0, Math.min(2, pokeDepth));

    const getActionSpeech = (): FuwafuwaSpeech | null => {
        if (percent < 100) {
            return null;
        }

        return createSpeech({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'primary',
            lines: depth === 0
                ? ['わあ！ まほうが いっぱいだよ', 'ぽんって してみよう']
                : depth === 1
                    ? ['ぽんって さわると', 'ふわふわに おくれるよ']
                    : ['やさしく ぽんって', 'してみよう？'],
        });
    };

    const getEventSpeech = (): FuwafuwaSpeech | null => {
        if (!announcement) {
            return null;
        }

        if (depth === 0) {
            return buildAnnouncementSpeech(announcement);
        }

        if (announcement.kind === 'challenge') {
            return createSpeech({
                id: announcement.id,
                category: 'event_notice',
                accent: 'primary',
                lines: depth === 1
                    ? ['きょうのきみに', 'あいそうだよ']
                    : ['ちょっとだけ', 'のぞいてみる？'],
                actionLabel: announcement.actionLabel,
            });
        }

        return createSpeech({
            id: announcement.id,
            category: 'event_notice',
            accent: 'info',
            lines: depth === 1
                ? ['このまえのレッスンに', 'ぴったりかも']
                : ['メニューで', 'みてみる？'],
            actionLabel: announcement.actionLabel,
        });
    };

    const getProgressSpeech = (): FuwafuwaSpeech | null => {
        if (stage === 1 && daysAlive === 3) {
            return createSpeech({
            id: 'user:hatching_soon',
                category: 'progress',
            accent: 'primary',
            lines: depth === 0
                ? ['もうすぐ', 'うまれそう！']
                : depth === 1
                    ? ['たまごの なかで', 'うごいてるかも']
                    : ['あえるの', 'たのしみだね'],
            });
        }

        if (displaySeconds === 0) {
            return null;
        }

        if (stage === 2 && activeDays >= 6) {
            return createSpeech({
            id: 'user:growth_soon',
                category: 'progress',
            accent: 'primary',
            lines: depth === 0
                ? ['もうすぐ', 'おおきく なれそう！']
                : depth === 1
                    ? ['ちょっとずつ', 'へんかしてるよ']
                    : ['みててね', 'たのしみだね'],
            });
        }

        if (percent >= 90) {
            return createSpeech({
            id: 'user:almost_full',
                category: 'progress',
            accent: 'primary',
            lines: depth === 0
                ? ['もうすこしで', 'まんたん！']
                : depth === 1
                    ? ['あと ほんのちょっとで', 'いっぱいだよ']
                    : ['このまま いけば', 'すぐ たまるよ'],
            });
        }

        if (percent >= 31) {
            return createSpeech({
            id: 'user:growing',
                category: 'progress',
            accent: 'primary',
            lines: depth === 0
                ? ['いいかんじ！', 'まほうが たまってきたよ']
                : depth === 1
                    ? ['このまま すこしずつ', 'ためていこう']
                    : ['ふわふわ', 'なんだか うれしいな'],
            });
        }

        return createSpeech({
        id: 'user:small_progress',
            category: 'progress',
        accent: 'primary',
        lines: depth === 0
            ? ['すこしずつ', 'たまってきたね']
            : depth === 1
                ? ['このペースも', 'いいかんじだよ']
                : ['あせらなくて', 'だいじょうぶ'],
        });
    };

    const getRelationshipSpeech = (): FuwafuwaSpeech | null => {
        if (displaySeconds !== 0 || shouldShowMechanicHint(activeDays)) {
            return null;
        }

        return createSpeech({
            id: stage === 1 ? 'user:relationship_waiting' : 'user:relationship_ready',
            category: 'relationship',
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
        });
    };

    const getMechanicSpeech = (): FuwafuwaSpeech | null => {
        if (displaySeconds !== 0 || !shouldShowMechanicHint(activeDays)) {
            return null;
        }

        return createSpeech({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'primary',
            lines: depth === 0
                ? ['まほうは ここに', stage === 1 ? 'たまっていくんだよ' : 'すこしずつ たまるんだよ']
                : depth === 1
                    ? ['いっぱいになると', 'いいこと あるよ']
                    : ['すこしずつ', 'ためてみよう'],
        });
    };

    return pickFirstSpeech(
        getActionSpeech(),
        getEventSpeech(),
        getProgressSpeech(),
        getRelationshipSpeech(),
        getMechanicSpeech(),
    );
}

export function getUserMessage(displaySeconds: number, targetSeconds: number, stage: number, activeDays: number) {
    return getUserSpeech(displaySeconds, targetSeconds, stage, activeDays, null).lines.join(' ');
}
