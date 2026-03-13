import type { HomeAfterglow } from '../homeAfterglow';
import type { HomeAnnouncement } from '../homeAnnouncementUtils';
import type { HomeAmbientCue } from '../homeAmbientUtils';
import type { HomeVisitRecency } from '../homeVisitMemory';
import {
    buildAmbientSpeech,
    buildAfterglowAnnouncementSpeech,
    buildAnnouncementSpeech,
    buildDailyFamilyContext,
    createSpeech,
    getReplyId,
    pickVariant,
} from './shared';
import type {
    FamilyMilestoneLead,
    FamilySpeechContext,
    FuwafuwaDailySelection,
    FuwafuwaEventTopic,
    FuwafuwaSpeech,
    FuwafuwaSpeechTopic,
} from './types';

function pickFamilyEventTopic(context: FamilySpeechContext): FuwafuwaEventTopic | null {
    if (context.isMagicDeliveryActive) {
        return 'delivery';
    }

    if (context.percent >= 100) {
        return 'action';
    }

    if (context.announcement) {
        return 'announcement';
    }

    if (context.milestoneLead) {
        return 'milestone';
    }

    if (context.recentAfterglow) {
        return 'afterglow';
    }

    return null;
}

function buildFamilyAfterglowSpeech(afterglow: HomeAfterglow, depth: number): FuwafuwaSpeech {
    if (afterglow.kind === 'announcement') {
        return buildAfterglowAnnouncementSpeech(afterglow.announcement, depth);
    }

    return createSpeech({
        id: 'family:afterglow:magic_delivery',
        category: 'relationship',
        accent: 'magic',
        lines: depth === 0
            ? ['みんなの まほうエネルギー', 'ちゃんと うけとったよ']
            : depth === 1
                ? ['ぽかぽかが まだ', 'のこってるよ']
                : ['また とどいたら', 'ふわふわ もっと うれしいな'],
    });
}

function buildFamilyMilestoneSpeech(milestoneLead: FamilyMilestoneLead, depth: number): FuwafuwaSpeech {
    if (milestoneLead.hasMultiple) {
        if (milestoneLead.kind === 'egg') {
            return createSpeech({
                id: `family:milestone:many:${milestoneLead.kind}`,
                category: 'event_notice',
                accent: 'event',
                lines: depth === 0
                    ? ['みんなの ところで', 'たまごが きてるみたい']
                    : depth === 1
                        ? ['どんな ふわふわか', 'たのしみだね']
                        : ['あいに いくの', 'わくわくするね'],
            });
        }

        if (milestoneLead.kind === 'fairy') {
            return createSpeech({
                id: `family:milestone:many:${milestoneLead.kind}`,
                category: 'event_notice',
                accent: 'event',
                lines: depth === 0
                    ? ['みんなの ところで', 'うまれた ふわふわが いるみたい']
                    : depth === 1
                        ? ['うまれたばかりで', 'どきどきしてるかも']
                        : ['みにいくの', 'たのしみだね'],
            });
        }

        return createSpeech({
            id: `family:milestone:many:${milestoneLead.kind}`,
            category: 'event_notice',
            accent: 'event',
            lines: depth === 0
                ? ['みんなの ところで', 'おおきく なった ふわふわが いるみたい']
                : depth === 1
                    ? ['ぐんと そだった', 'ふわふわが いるみたい']
                    : ['みにいくの', 'たのしみだね'],
        });
    }

    if (milestoneLead.kind === 'egg') {
        return createSpeech({
            id: `family:milestone:${milestoneLead.userId}:${milestoneLead.kind}`,
            category: 'event_notice',
            accent: 'event',
            lines: depth === 0
                ? [`${milestoneLead.userName}の ところに`, 'たまごが きたみたい']
                : depth === 1
                    ? ['どんな ふわふわか', 'たのしみだね']
                    : ['あいに いくの', 'わくわくするね'],
        });
    }

    if (milestoneLead.kind === 'fairy') {
        return createSpeech({
            id: `family:milestone:${milestoneLead.userId}:${milestoneLead.kind}`,
            category: 'event_notice',
            accent: 'event',
            lines: depth === 0
                ? [`${milestoneLead.userName}の ふわふわ`, 'うまれたみたい！']
                : depth === 1
                    ? ['うまれたばかりで', 'どきどきしてるかも']
                    : ['みにいくの', 'たのしみだね'],
        });
    }

    return createSpeech({
        id: `family:milestone:${milestoneLead.userId}:${milestoneLead.kind}`,
        category: 'event_notice',
        accent: 'event',
        lines: depth === 0
            ? [`${milestoneLead.userName}の ふわふわ`, 'おおきく なったみたい']
            : depth === 1
                ? ['ぐんと そだった', 'みたいだね']
                : ['みにいくの', 'たのしみだね'],
    });
}

function buildFamilyRelationshipLines(
    activeCount: number,
    visitRecency: HomeVisitRecency,
    variantSeed: number,
): string[] {
    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;

    if (visitRecency === 'recent') {
        return pickVariant([
            ['また すぐ あえたね', 'ふわふわ うれしいな'],
            ['さっきも あえたね', 'また きてくれて うれしいな'],
            ['みんなが きてくれて', 'ふわふわ ぽかぽかだよ'],
            ['きょうも みんなで', 'いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'today') {
        return pickVariant([
            ['また みんなで きてくれたね', 'ふわふわ うれしいな'],
            ['また あいに きてくれて', 'ふわふわ うれしいな'],
            ['みんなが きてくれて', 'ふわふわ ぽかぽかだよ'],
            ['きょうも みんなで', 'いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'returning') {
        return pickVariant([
            ['まってたよ', 'みんなに また あえて うれしいな'],
            ['ひさしぶりだね', 'ふわふわ うれしいな'],
            ['みんなが きてくれて', 'ふわふわ ぽかぽかだよ'],
            ['きょうも みんなで', 'いっしょだね'],
        ], variantSeed);
    }

    return pickVariant([
        [`${peopleLabel} いると`, 'なんだか たのしいね'],
        ['みんなが いると', 'ふわふわ うれしいな'],
        ['みんなが きてくれて', 'ふわふわ ぽかぽかだよ'],
        ['きょうも みんなで', 'いっしょだね'],
    ], variantSeed);
}

function buildFamilyMoodSpeech(context: FamilySpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: `family:mood:${context.activeCount}`,
        category: 'progress',
        accent: 'everyday',
        dailyGroup: 'everyday',
        dailyTopic: 'mood',
        replyId: getReplyId('mood', context.variantSeed, 4),
        lines: pickVariant([
            ['なんだか ぽかぽか', 'してきたね'],
            ['ふわふわ なんだか', 'ごきげんだよ'],
            ['みんなが いると', 'いいかんじだね'],
            ['みんなで いると', 'なんだか おちつくね'],
        ], context.variantSeed),
    });
}

function buildFamilyOmenSpeech(context: FamilySpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: 'family:omen',
        category: 'progress',
        accent: 'event',
        dailyGroup: 'magic',
        dailyTopic: 'omen',
        replyId: getReplyId('omen', context.variantSeed, 3),
        lines: pickVariant([
            ['あと すこしで', 'いいこと ありそう'],
            ['もうすぐ', 'ふわふわに とどきそう'],
            ['みんなの まほうエネルギー', 'もうすぐ いっぱいだよ'],
        ], context.variantSeed),
    });
}

function buildFamilyMechanicSpeech(context: FamilySpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: 'family:mechanic_hint',
        category: 'mechanic_hint',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'mechanic',
        replyId: getReplyId('mechanic', context.variantSeed, 3),
        lines: pickVariant([
            ['みんなの まほうエネルギー', 'ここに たまっていくんだよ'],
            ['ここでも まほうエネルギーが', 'ふえていくんだよ'],
            ['まほうエネルギーが', 'たまると うれしいな'],
        ], context.variantSeed),
    });
}

function buildFamilySpeech(topic: FuwafuwaSpeechTopic, context: FamilySpeechContext): FuwafuwaSpeech {
    const dailyContext = buildDailyFamilyContext(context);

    if (topic === 'delivery') {
        return createSpeech({
            id: 'family:magic_delivery_active',
            category: 'action_hint',
            accent: 'magic',
            lines: context.depth === 0
                ? ['みんなの まほうエネルギーが', 'いま ふわふわに とどいてるよ']
                : context.depth === 1
                    ? ['ぽかぽかが ひろがって', 'ふわふわ うれしいな']
                    : ['ちゃんと うけとってるよ', 'ありがとう'],
        });
    }

    if (topic === 'action') {
        return createSpeech({
            id: 'family:magic_full',
            category: 'action_hint',
            accent: 'magic',
            lines: context.depth === 0
                ? ['みんなの まほうエネルギーが', 'いっぱいに なったよ', 'とどけてくれたら うれしいな']
                : context.depth === 1
                    ? ['ぽんって すると', 'すぐ ふわふわに とどくよ']
                    : ['とどいたら', 'ふわふわ もっと よろこぶよ'],
        });
    }

    if (topic === 'announcement') {
        if (context.depth === 0) {
            return buildAnnouncementSpeech(context.announcement!);
        }

        if (context.announcement?.kind === 'challenge') {
            return createSpeech({
                id: context.announcement.id,
                category: 'event_notice',
                accent: 'event',
                lines: context.depth === 1
                    ? ['みんなで やると', 'ふわふわ うれしいな']
                    : ['ちょっとだけ', 'のぞいてみる？'],
                actionLabel: context.announcement.actionLabel,
            });
        }

        if (context.announcement?.kind === 'teacher_menu') {
            return createSpeech({
                id: context.announcement.id,
                category: 'event_notice',
                accent: 'event',
                lines: context.depth === 1
                    ? ['せんせいが', 'これ いいよって']
                    : ['メニューで', 'みてみる？'],
                actionLabel: context.announcement.actionLabel,
            });
        }

        return createSpeech({
            id: context.announcement!.id,
            category: 'event_notice',
            accent: 'event',
            lines: context.depth === 1
                ? ['せんせいが', 'これ どうかなって']
                : ['メニューで', 'みてみる？'],
            actionLabel: context.announcement!.actionLabel,
        });
    }

    if (topic === 'afterglow') {
        return buildFamilyAfterglowSpeech(context.recentAfterglow!, context.depth);
    }

    if (topic === 'milestone') {
        return buildFamilyMilestoneSpeech(context.milestoneLead!, context.depth);
    }

    if (topic === 'ambient') {
        return buildAmbientSpeech(context.ambientCue!, dailyContext.variantSeed, 'ambient');
    }

    if (topic === 'greeting') {
        return createSpeech({
            id: `family:idle:${dailyContext.activeCount}`,
            category: 'relationship',
            accent: 'everyday',
            dailyGroup: 'everyday',
            dailyTopic: 'greeting',
            replyId: getReplyId('greeting', dailyContext.variantSeed, 4),
            lines: buildFamilyRelationshipLines(
                dailyContext.activeCount,
                dailyContext.visitRecency,
                dailyContext.variantSeed,
            ),
        });
    }

    if (topic === 'mood') {
        return buildFamilyMoodSpeech(dailyContext);
    }

    if (topic === 'omen') {
        return buildFamilyOmenSpeech(dailyContext);
    }

    if (topic === 'mechanic') {
        return buildFamilyMechanicSpeech(dailyContext);
    }

    if (context.percent >= 90) {
        return createSpeech({
            id: 'family:almost_full',
            category: 'progress',
            accent: 'magic',
            dailyGroup: 'magic',
            dailyTopic: 'progress',
            replyId: getReplyId('progress', dailyContext.variantSeed, 3),
            lines: pickVariant([
                ['みんなの まほうエネルギーが', 'もうすこしで まんたん！'],
                ['あと すこしで', 'いいこと ありそう'],
                ['みんなの まほうエネルギー', 'もうすぐ いっぱいだよ'],
            ], dailyContext.variantSeed),
        });
    }

    if (context.percent >= 31) {
        return createSpeech({
            id: 'family:growing',
            category: 'progress',
            accent: 'magic',
            dailyGroup: 'magic',
            dailyTopic: 'progress',
            replyId: getReplyId('progress', dailyContext.variantSeed, 4),
            lines: pickVariant([
                ['みんなの まほうエネルギーが', 'たまってきたよ'],
                ['まほうエネルギーが', 'みんなで ふえてるね'],
                ['なんだか ぽかぽか', 'してきたね'],
                ['まほうエネルギーが', 'じわっと たまってるね'],
            ], dailyContext.variantSeed),
        });
    }

    return createSpeech({
        id: 'family:small_progress',
        category: 'progress',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'progress',
        replyId: getReplyId('progress', dailyContext.variantSeed, 4),
        lines: pickVariant([
            ['まほうエネルギーが', 'みんなで ふえてるね'],
            ['みんなの まほうエネルギー', 'すこしずつ とどいてるよ'],
            ['ちいさく ぽかぽか', 'してきたね'],
            ['まほうエネルギーも', 'ちゃんと とどいてるよ'],
        ], dailyContext.variantSeed),
    });
}

export function getFamilyEventSpeech(
    activeCount: number,
    displaySeconds: number,
    targetSeconds: number,
    announcement: HomeAnnouncement | null,
    milestoneLead: FamilyMilestoneLead | null = null,
    pokeDepth = 0,
    visitRecency: HomeVisitRecency = 'first',
    recentAfterglow: HomeAfterglow | null = null,
    isMagicDeliveryActive = false,
): FuwafuwaSpeech | null {
    const context: FamilySpeechContext = {
        activeCount,
        percent: Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
        displaySeconds,
        isMagicDeliveryActive,
        announcement,
        ambientCue: null,
        milestoneLead,
        recentAfterglow,
        visitRecency,
        depth: Math.max(0, Math.min(2, pokeDepth)),
        variantSeed: 0,
        idleBeat: 0,
    };

    const topic = pickFamilyEventTopic(context);
    return topic ? buildFamilySpeech(topic, context) : null;
}

export function getFamilyDailySpeech(
    selection: FuwafuwaDailySelection,
    activeCount: number,
    displaySeconds: number,
    targetSeconds: number,
    ambientCue: HomeAmbientCue | null,
    visitRecency: HomeVisitRecency = 'first',
): FuwafuwaSpeech {
    const context: FamilySpeechContext = {
        activeCount,
        percent: Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
        displaySeconds,
        isMagicDeliveryActive: false,
        announcement: null,
        ambientCue,
        milestoneLead: null,
        recentAfterglow: null,
        visitRecency,
        depth: 0,
        variantSeed: selection.replyIndex,
        idleBeat: 0,
    };

    return buildFamilySpeech(selection.topic, context);
}
