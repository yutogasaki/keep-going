import type { HomeAfterglow } from '../homeAfterglow';
import { getMilestoneSpeechLines } from '../milestoneCopy';
import type { HomeAnnouncement } from '../homeAnnouncementUtils';
import type { HomeAmbientCue } from '../homeAmbientUtils';
import type { HomeVisitRecency } from '../homeVisitMemory';
import type { FuwafuwaMilestoneEvent } from '../../../store/useAppStore';
import {
    buildAmbientSpeech,
    buildAfterglowAnnouncementSpeech,
    buildAnnouncementSpeech,
    buildDailyUserContext,
    createSpeech,
    getReplyId,
    isHatchingSoon,
    pickVariant,
} from './shared';
import type {
    FuwafuwaDailySelection,
    FuwafuwaEventTopic,
    FuwafuwaSpeech,
    FuwafuwaSpeechTopic,
    UserSpeechContext,
} from './types';

function pickUserEventTopic(context: UserSpeechContext): FuwafuwaEventTopic | null {
    if (context.isMagicDeliveryActive) {
        return 'delivery';
    }

    if (context.recentMilestoneEvent) {
        return 'milestone';
    }

    if (context.percent >= 100) {
        return 'action';
    }

    if (context.announcement) {
        return 'announcement';
    }

    if (context.recentAfterglow) {
        return 'afterglow';
    }

    return null;
}

function buildUserAfterglowSpeech(afterglow: HomeAfterglow, depth: number): FuwafuwaSpeech {
    if (afterglow.kind === 'announcement') {
        return buildAfterglowAnnouncementSpeech(afterglow.announcement, depth);
    }

    return createSpeech({
        id: 'user:afterglow:magic_delivery',
        category: 'relationship',
        accent: 'magic',
        lines: depth === 0
            ? ['まほうエネルギー', 'ちゃんと うけとったよ']
            : depth === 1
                ? ['ぽかぽかが まだ', 'のこってるよ']
                : ['また とどいたら', 'ふわふわ もっと うれしいな'],
    });
}

function buildUserAnnouncementSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    if (context.depth === 0) {
        return buildAnnouncementSpeech(context.announcement!);
    }

    if (context.announcement?.kind === 'challenge') {
        return createSpeech({
            id: context.announcement.id,
            category: 'event_notice',
            accent: 'event',
            lines: context.depth === 1
                ? ['きょうのきみに', 'あいそうだよ']
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

function buildUserGrowthSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    if (isHatchingSoon(context.stage, context.daysAlive)) {
        return createSpeech({
            id: 'user:hatching_soon',
            category: 'progress',
            accent: 'magic',
            dailyGroup: 'magic',
            dailyTopic: 'growth',
            replyId: getReplyId('growth', context.variantSeed, 3),
            lines: context.depth === 0
                ? pickVariant([
                    ['もうすぐ', 'うまれそう！'],
                    ['たまごが', 'そろそろ ひらきそう'],
                    ['ちいさな へんかが', 'はじまりそう'],
                ], context.variantSeed)
                : context.depth === 1
                    ? ['たまごの なかで', 'そわそわしてるかも']
                    : ['あえるの', 'たのしみだな'],
        });
    }

    return createSpeech({
        id: 'user:growth_soon',
        category: 'progress',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'growth',
        replyId: getReplyId('growth', context.variantSeed, 3),
        lines: context.depth === 0
            ? pickVariant([
                ['もうすぐ', 'おおきく なれそう！'],
                ['からだが', 'ちょっとずつ かわってきたよ'],
                ['そろそろ', 'へんかの じゅんび してるよ'],
            ], context.variantSeed)
            : context.depth === 1
                ? ['ちょっとずつ', 'へんかしてるよ']
                : ['みててね', 'たのしみだね'],
    });
}

function buildUserProgressSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    if (context.percent >= 90) {
        return createSpeech({
            id: 'user:almost_full',
            category: 'progress',
            accent: 'magic',
            dailyGroup: 'magic',
            dailyTopic: 'progress',
            replyId: getReplyId('progress', context.variantSeed, 3),
            lines: pickVariant([
                ['まほうエネルギーが', 'もうすこしで まんたん！'],
                ['あと すこしで', 'ふわふわに とどきそう'],
                ['まほうエネルギー', 'もうすぐ いっぱいだよ'],
            ], context.variantSeed),
        });
    }

    if (context.percent >= 31) {
        return createSpeech({
            id: 'user:growing',
            category: 'progress',
            accent: 'magic',
            dailyGroup: 'magic',
            dailyTopic: 'progress',
            replyId: getReplyId('progress', context.variantSeed, 4),
            lines: pickVariant([
                ['まほうエネルギーが', 'たまってきたよ'],
                ['まほうエネルギーが', 'じわっと ふえてるよ'],
                ['なんだか ぽかぽか', 'してきたよ'],
                ['まほうエネルギーが', 'じわっと たまってるよ'],
            ], context.variantSeed),
        });
    }

    return createSpeech({
        id: 'user:small_progress',
        category: 'progress',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'progress',
        replyId: getReplyId('progress', context.variantSeed, 4),
        lines: pickVariant([
            ['まほうエネルギーが', 'すこし たまってきたよ'],
            ['まほうエネルギーも', 'ちゃんと とどいてるよ'],
            ['なんだか ぽかぽか', 'してきたよ'],
            ['あせらなくても', 'ふわふわ うれしいな'],
        ], context.variantSeed),
    });
}

function buildUserRelationshipLines(
    stage: number,
    visitRecency: HomeVisitRecency,
    variantSeed: number,
): string[] {
    if (visitRecency === 'recent') {
        return pickVariant([
            ['また すぐ あえたね', 'ふわふわ うれしいな'],
            ['さっきも きてくれたね', 'また あえて うれしいな'],
            ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'today') {
        return pickVariant([
            ['また きてくれたね', 'ふわふわ うれしいな'],
            ['また あいに きてくれて', 'ふわふわ うれしいな'],
            ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'returning') {
        return pickVariant([
            ['まってたよ', 'また あえて うれしいな'],
            ['ひさしぶりだね', 'ふわふわ うれしいな'],
            ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    if (stage === 1) {
        return pickVariant([
            ['きょうも まってたよ', 'あえて うれしいな'],
            ['なんだか そわそわしてたんだ', 'また あえたね'],
            ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    return pickVariant([
        ['あえて うれしいな', 'ふわふわ ごきげんだよ'],
        ['きょうも きてくれたね', 'また あえて うれしいな'],
        ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
        ['まっていたよ', 'きょうも いっしょだね'],
    ], variantSeed);
}

function buildUserMoodSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    if (context.stage === 1 && context.displaySeconds === 0) {
        return createSpeech({
            id: 'user:mood_waiting',
            category: 'progress',
            accent: 'everyday',
            dailyGroup: 'everyday',
            dailyTopic: 'mood',
            replyId: getReplyId('mood', context.variantSeed, 4),
            lines: pickVariant([
                ['たまごの なかで', 'そわそわしてるかも'],
                ['なんだか ちいさく', 'ぽかぽかしてるよ'],
                ['きみが きてくれて', 'うれしくなったみたい'],
                ['きょうは なんだか', 'おだやかだね'],
            ], context.variantSeed),
        });
    }

    return createSpeech({
        id: 'user:mood',
        category: 'progress',
        accent: 'everyday',
        dailyGroup: 'everyday',
        dailyTopic: 'mood',
        replyId: getReplyId('mood', context.variantSeed, 4),
        lines: pickVariant([
            ['なんだか ぽかぽか', 'してきたよ'],
            ['ふわふわ なんだか', 'ごきげんだよ'],
            ['きょうは なんだか', 'いいかんじ'],
            ['きょうは なんだか', 'おだやかだね'],
        ], context.variantSeed),
    });
}

function buildUserOmenSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: 'user:omen',
        category: 'progress',
        accent: 'event',
        dailyGroup: 'magic',
        dailyTopic: 'omen',
        replyId: getReplyId('omen', context.variantSeed, 3),
        lines: pickVariant([
            ['あと すこしで', 'いいこと ありそう'],
            ['もうすぐ', 'ふわふわに とどきそう'],
            ['まほうエネルギー', 'もうすぐ いっぱいだよ'],
        ], context.variantSeed),
    });
}

function buildUserRelationshipSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: context.stage === 1 ? 'user:relationship_waiting' : 'user:relationship_ready',
        category: 'relationship',
        accent: 'everyday',
        dailyGroup: 'everyday',
        dailyTopic: 'greeting',
        replyId: getReplyId('greeting', context.variantSeed, 4),
        lines: buildUserRelationshipLines(
            context.stage,
            context.visitRecency,
            context.variantSeed,
        ),
    });
}

function buildUserSpeech(topic: FuwafuwaSpeechTopic, context: UserSpeechContext): FuwafuwaSpeech {
    const dailyContext = buildDailyUserContext(context);

    if (topic === 'milestone') {
        return createSpeech({
            id: `user:milestone:${context.recentMilestoneEvent!.userId}:${context.recentMilestoneEvent!.kind}`,
            category: 'event_notice',
            accent: 'event',
            lines: getMilestoneSpeechLines(context.recentMilestoneEvent!.kind, context.depth),
        });
    }

    if (topic === 'delivery') {
        return createSpeech({
            id: 'user:magic_delivery_active',
            category: 'action_hint',
            accent: 'magic',
            lines: context.depth === 0
                ? ['まほうエネルギーが', 'いま ふわふわに とどいてるよ']
                : context.depth === 1
                    ? ['ぽかぽかが ひろがって', 'ふわふわ うれしいな']
                    : ['ちゃんと うけとってるよ', 'ありがとう'],
        });
    }

    if (topic === 'action') {
        return createSpeech({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'magic',
            lines: context.depth === 0
                ? ['まほうエネルギーが', 'いっぱいだよ', 'とどけてくれたら うれしいな']
                : context.depth === 1
                    ? ['ぽんって すると', 'すぐ ふわふわに とどくよ']
                    : ['とどいたら', 'ふわふわ もっと よろこぶよ'],
        });
    }

    if (topic === 'announcement') {
        return buildUserAnnouncementSpeech(context);
    }

    if (topic === 'afterglow') {
        return buildUserAfterglowSpeech(context.recentAfterglow!, context.depth);
    }

    if (topic === 'growth') {
        return buildUserGrowthSpeech(context);
    }

    if (topic === 'progress') {
        return buildUserProgressSpeech(dailyContext);
    }

    if (topic === 'ambient') {
        return buildAmbientSpeech(context.ambientCue!, dailyContext.variantSeed, 'ambient');
    }

    if (topic === 'naming') {
        return createSpeech({
            id: 'user:naming_hint',
            category: 'relationship',
            accent: 'everyday',
            dailyGroup: 'everyday',
            dailyTopic: 'naming',
            replyId: getReplyId('naming', dailyContext.variantSeed, 3),
            lines: pickVariant([
                ['おなまえ ほしいな', 'なんて よんでくれる？'],
                ['なまえ つけてくれたら', 'うれしいな'],
                ['ねえ ねえ', 'おなまえ つけてほしいな'],
            ], dailyContext.variantSeed),
        });
    }

    if (topic === 'greeting') {
        return buildUserRelationshipSpeech(dailyContext);
    }

    if (topic === 'mood') {
        return buildUserMoodSpeech(dailyContext);
    }

    if (topic === 'omen') {
        return buildUserOmenSpeech(dailyContext);
    }

    return createSpeech({
        id: 'user:mechanic_hint',
        category: 'mechanic_hint',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'mechanic',
        replyId: getReplyId('mechanic', dailyContext.variantSeed, 4),
        lines: pickVariant([
            ['まほうエネルギーは', 'ここに たまるんだよ'],
            ['ここに まほうエネルギーが', 'たまっていくんだよ'],
            ['まほうエネルギー ここで', 'ふえていくんだよ'],
            ['まほうエネルギーが', 'たまると うれしいな'],
        ], dailyContext.variantSeed),
    });
}

export function getUserEventSpeech(
    displaySeconds: number,
    targetSeconds: number,
    stage: number,
    activeDays: number,
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null,
    announcement: HomeAnnouncement | null,
    pokeDepth = 0,
    daysAlive = 0,
    recentAfterglow: HomeAfterglow | null = null,
    isMagicDeliveryActive = false,
): FuwafuwaSpeech | null {
    const context: UserSpeechContext = {
        percent: Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
        displaySeconds,
        isMagicDeliveryActive,
        stage,
        activeDays,
        daysAlive,
        announcement,
        ambientCue: null,
        recentMilestoneEvent,
        recentAfterglow,
        visitRecency: 'first',
        depth: Math.max(0, Math.min(2, pokeDepth)),
        variantSeed: 0,
        idleBeat: 0,
    };

    const topic = pickUserEventTopic(context);
    return topic ? buildUserSpeech(topic, context) : null;
}

export function getUserDailySpeech(
    selection: FuwafuwaDailySelection,
    displaySeconds: number,
    targetSeconds: number,
    stage: number,
    activeDays: number,
    ambientCue: HomeAmbientCue | null,
    daysAlive = 0,
    visitRecency: HomeVisitRecency = 'first',
): FuwafuwaSpeech {
    const context: UserSpeechContext = {
        percent: Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
        displaySeconds,
        isMagicDeliveryActive: false,
        stage,
        activeDays,
        daysAlive,
        announcement: null,
        ambientCue,
        recentMilestoneEvent: null,
        recentAfterglow: null,
        visitRecency,
        depth: 0,
        variantSeed: selection.replyIndex,
        idleBeat: 0,
    };

    return buildUserSpeech(selection.topic, context);
}
