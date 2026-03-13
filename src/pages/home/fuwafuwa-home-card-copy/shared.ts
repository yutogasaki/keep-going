import type { HomeAmbientCue } from '../homeAmbientUtils';
import type { HomeAnnouncement } from '../homeAnnouncementUtils';
import type {
    FamilySpeechContext,
    FuwafuwaDailyTopic,
    FuwafuwaSpeech,
    FuwafuwaSpeechAccent,
    UserSpeechContext,
} from './types';

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

export function createSpeech({
    id,
    category,
    accent,
    lines,
    actionLabel,
    dailyGroup,
    dailyTopic,
    replyId,
}: FuwafuwaSpeech): FuwafuwaSpeech {
    return {
        id,
        category,
        accent,
        lines,
        ...(actionLabel ? { actionLabel } : {}),
        ...(dailyGroup ? { dailyGroup } : {}),
        ...(dailyTopic ? { dailyTopic } : {}),
        ...(replyId ? { replyId } : {}),
    };
}

export function getReplyId(topic: FuwafuwaDailyTopic, replyIndex: number, count: number) {
    return `${topic}:${Math.abs(replyIndex) % count}`;
}

export function pickVariant<T>(variants: readonly T[], seed: number): T {
    return variants[Math.abs(seed) % variants.length];
}

export function buildAnnouncementSpeech(announcement: HomeAnnouncement): FuwafuwaSpeech {
    return createSpeech({
        id: announcement.id,
        category: 'event_notice',
        accent: 'event',
        lines: [announcement.title, announcement.detail],
        actionLabel: announcement.actionLabel,
    });
}

export function isHatchingSoon(stage: number, daysAlive: number): boolean {
    return stage === 1 && daysAlive === 3;
}

export function buildDailyFamilyContext(context: FamilySpeechContext): FamilySpeechContext {
    return {
        ...context,
        depth: 0,
        variantSeed: context.variantSeed + (context.idleBeat * 2),
    };
}

export function buildDailyUserContext(context: UserSpeechContext): UserSpeechContext {
    return {
        ...context,
        depth: 0,
        variantSeed: context.variantSeed + (context.idleBeat * 2),
    };
}

export function buildAfterglowAnnouncementSpeech(
    announcement: HomeAnnouncement,
    depth: number,
): FuwafuwaSpeech {
    if (announcement.kind === 'challenge') {
        return createSpeech({
            id: `afterglow:${announcement.id}`,
            category: 'event_notice',
            accent: 'event',
            lines: depth === 0
                ? ['みつけてくれて', 'ふわふわ うれしいな']
                : depth === 1
                    ? ['また みにいけたら', 'たのしそうだね']
                    : ['きになったときに', 'のぞいてみてね'],
        });
    }

    return createSpeech({
        id: `afterglow:${announcement.id}`,
        category: 'event_notice',
        accent: 'event',
        lines: depth === 0
            ? ['おすすめ みてくれて', 'ふわふわ うれしいな']
            : depth === 1
                ? ['せんせいも', 'よろこぶかも']
                : ['また みにいけたら', 'いいね'],
    });
}

export function buildAmbientSpeech(
    ambientCue: HomeAmbientCue,
    seed: number,
    accent: FuwafuwaSpeechAccent,
): FuwafuwaSpeech {
    if (ambientCue.kind === 'public_menu_new') {
        return createSpeech({
            id: 'ambient:public_menu_new',
            category: 'event_notice',
            accent,
            dailyGroup: 'ambient',
            dailyTopic: 'ambient',
            replyId: getReplyId('ambient', seed, 3),
            lines: pickVariant([
                ['みんなの メニューに', 'あたらしいのが あるみたい'],
                ['ふわふわも ちょっと', 'きになってるんだ'],
                ['のぞきに いけたら', 'たのしそうだね'],
            ], seed),
        });
    }

    if (ambientCue.kind === 'public_menu_custom') {
        return createSpeech({
            id: 'ambient:public_menu_custom',
            category: 'event_notice',
            accent,
            dailyGroup: 'ambient',
            dailyTopic: 'ambient',
            replyId: getReplyId('ambient', seed, 3),
            lines: pickVariant([
                ['みんなの メニューで', 'あたらしい種目も みつかるかも'],
                ['だれかの くふうが', 'はいってるみたい'],
                ['ふわふわも', 'みにいきたいな'],
            ], seed),
        });
    }

    return createSpeech({
        id: 'ambient:public_exercise',
        category: 'event_notice',
        accent,
        dailyGroup: 'ambient',
        dailyTopic: 'ambient',
        replyId: getReplyId('ambient', seed, 3),
        lines: pickVariant([
            ['みんなの ところで', 'おもしろい種目が みつかるかも'],
            ['ふわふわも なんだか', 'きになってるよ'],
            ['のぞきに いくと', 'たのしいかも'],
        ], seed),
    });
}
