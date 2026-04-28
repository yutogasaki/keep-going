import type { HomeAfterglow } from './homeAfterglow';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { HomeAmbientCue } from './homeAmbientUtils';
import type { HomeVisitRecency } from './homeVisitMemory';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import {
    getFamilyAfterglowLines,
    getFamilyGreetingLines,
    getUserAfterglowLines,
    getUserGreetingLines,
} from './fuwafuwaSpeechGuidance';
import { getFamilyMilestoneLines } from './fuwafuwaHomeCardCopyMilestones';
import { getMilestoneSpeechLines } from './milestoneCopy';
import {
    AMBIENT_PUBLIC_EXERCISE_LINES,
    AMBIENT_PUBLIC_MENU_CUSTOM_LINES,
    AMBIENT_PUBLIC_MENU_NEW_LINES,
    FAMILY_ALMOST_FULL_LINES,
    FAMILY_GROWING_LINES,
    FAMILY_MECHANIC_LINES,
    FAMILY_MOOD_LINES,
    FAMILY_OMEN_LINES,
    FAMILY_SMALL_PROGRESS_LINES,
    USER_ALMOST_FULL_LINES,
    USER_GROWING_LINES,
    USER_GROWTH_SOON_LINES,
    USER_HATCHING_SOON_LINES,
    USER_MECHANIC_LINES,
    USER_MOOD_LINES,
    USER_NAMING_LINES,
    USER_OMEN_LINES,
    USER_SMALL_PROGRESS_LINES,
    USER_WAITING_MOOD_LINES,
} from './fuwafuwaHomeCardCopyVariants';

export type FuwafuwaSpeechAccent = 'everyday' | 'magic' | 'event' | 'ambient';
export type FuwafuwaSpeechCategory =
    | 'action_hint'
    | 'event_notice'
    | 'progress'
    | 'relationship'
    | 'mechanic_hint';

export type FuwafuwaDailyGroup = 'everyday' | 'magic' | 'ambient';
export type FuwafuwaDailyTopic = 'greeting' | 'mood' | 'mechanic' | 'progress' | 'omen' | 'growth' | 'ambient' | 'naming';

export interface FuwafuwaDailySelection {
    group: FuwafuwaDailyGroup;
    topic: FuwafuwaDailyTopic;
    replyIndex: number;
}

export interface FuwafuwaSpeech {
    id: string;
    category: FuwafuwaSpeechCategory;
    accent: FuwafuwaSpeechAccent;
    lines: readonly string[];
    actionLabel?: string;
    dailyGroup?: FuwafuwaDailyGroup;
    dailyTopic?: FuwafuwaDailyTopic;
    replyId?: string;
}

export interface FamilyMilestoneLead {
    kind: FuwafuwaMilestoneEvent['kind'];
    userId: string;
    userName: string;
    hasMultiple: boolean;
}

type FuwafuwaSpeechTopic =
    | 'milestone'
    | 'delivery'
    | 'action'
    | 'announcement'
    | 'afterglow'
    | 'growth'
    | 'greeting'
    | 'mood'
    | 'omen'
    | 'progress'
    | 'ambient'
    | 'mechanic'
    | 'naming';

type FuwafuwaEventTopic =
    | 'milestone'
    | 'delivery'
    | 'action'
    | 'announcement'
    | 'afterglow';

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

function getReplyId(topic: FuwafuwaDailyTopic, replyIndex: number, count: number) {
    return `${topic}:${Math.abs(replyIndex) % count}`;
}

function buildAnnouncementSpeech(announcement: HomeAnnouncement): FuwafuwaSpeech {
    return createSpeech({
        id: announcement.id,
        category: 'event_notice',
        accent: 'event',
        lines: [announcement.title, announcement.detail],
        actionLabel: announcement.actionLabel,
    });
}

function isHatchingSoon(stage: number, daysAlive: number): boolean {
    return stage === 1 && daysAlive === 3;
}

interface FamilySpeechContext {
    activeCount: number;
    percent: number;
    displaySeconds: number;
    isMagicDeliveryActive: boolean;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    milestoneLead: FamilyMilestoneLead | null;
    recentAfterglow: HomeAfterglow | null;
    visitRecency: HomeVisitRecency;
    depth: number;
    variantSeed: number;
    idleBeat: number;
}

interface UserSpeechContext {
    percent: number;
    displaySeconds: number;
    isMagicDeliveryActive: boolean;
    stage: number;
    activeDays: number;
    daysAlive: number;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null;
    recentAfterglow: HomeAfterglow | null;
    visitRecency: HomeVisitRecency;
    depth: number;
    variantSeed: number;
    idleBeat: number;
}

function pickVariant<T>(variants: readonly T[], seed: number): T {
    return variants[Math.abs(seed) % variants.length];
}

function buildDailyFamilyContext(context: FamilySpeechContext): FamilySpeechContext {
    return {
        ...context,
        depth: 0,
        variantSeed: context.variantSeed + (context.idleBeat * 2),
    };
}

function buildDailyUserContext(context: UserSpeechContext): UserSpeechContext {
    return {
        ...context,
        depth: 0,
        variantSeed: context.variantSeed + (context.idleBeat * 2),
    };
}

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

function buildFamilyAfterglowSpeech(afterglow: HomeAfterglow, context: FamilySpeechContext): FuwafuwaSpeech {
    if (afterglow.kind === 'announcement') {
        return createSpeech({
            id: `afterglow:${afterglow.announcement.id}`,
            category: 'event_notice',
            accent: 'event',
            lines: getFamilyAfterglowLines('announcement', context.visitRecency, context.depth),
        });
    }

    return createSpeech({
        id: 'family:afterglow:magic_delivery',
        category: 'relationship',
        accent: 'magic',
        lines: getFamilyAfterglowLines('magic_delivery', context.visitRecency, context.depth),
    });
}

function buildFamilyMilestoneSpeech(milestoneLead: FamilyMilestoneLead, depth: number): FuwafuwaSpeech {
    return createSpeech({
        id: milestoneLead.hasMultiple
            ? `family:milestone:many:${milestoneLead.kind}`
            : `family:milestone:${milestoneLead.userId}:${milestoneLead.kind}`,
        category: 'event_notice',
        accent: 'event',
        lines: getFamilyMilestoneLines(
            milestoneLead.kind,
            milestoneLead.userName,
            milestoneLead.hasMultiple,
            depth,
        ),
    });
}

function buildAmbientSpeech(ambientCue: HomeAmbientCue, seed: number, accent: FuwafuwaSpeechAccent): FuwafuwaSpeech {
    if (ambientCue.kind === 'public_menu_new') {
        return createSpeech({
            id: 'ambient:public_menu_new',
            category: 'event_notice',
            accent,
            dailyGroup: 'ambient',
            dailyTopic: 'ambient',
            replyId: getReplyId('ambient', seed, 3),
            lines: pickVariant(AMBIENT_PUBLIC_MENU_NEW_LINES, seed),
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
            lines: pickVariant(AMBIENT_PUBLIC_MENU_CUSTOM_LINES, seed),
        });
    }

    return createSpeech({
        id: 'ambient:public_exercise',
        category: 'event_notice',
        accent,
        dailyGroup: 'ambient',
        dailyTopic: 'ambient',
        replyId: getReplyId('ambient', seed, 3),
        lines: pickVariant(AMBIENT_PUBLIC_EXERCISE_LINES, seed),
    });
}

function buildFamilyMoodSpeech(context: FamilySpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: `family:mood:${context.activeCount}`,
        category: 'progress',
        accent: 'everyday',
        dailyGroup: 'everyday',
        dailyTopic: 'mood',
        replyId: getReplyId('mood', context.variantSeed, 4),
        lines: pickVariant(FAMILY_MOOD_LINES, context.variantSeed),
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
        lines: pickVariant(FAMILY_OMEN_LINES, context.variantSeed),
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
        lines: pickVariant(FAMILY_MECHANIC_LINES, context.variantSeed),
    });
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
            lines: pickVariant(USER_WAITING_MOOD_LINES, context.variantSeed),
        });
    }

    return createSpeech({
        id: 'user:mood',
        category: 'progress',
        accent: 'everyday',
        dailyGroup: 'everyday',
        dailyTopic: 'mood',
        replyId: getReplyId('mood', context.variantSeed, 4),
        lines: pickVariant(USER_MOOD_LINES, context.variantSeed),
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
        lines: pickVariant(USER_OMEN_LINES, context.variantSeed),
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
        return buildFamilyAfterglowSpeech(context.recentAfterglow!, context);
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
            lines: getFamilyGreetingLines(
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
            lines: pickVariant(FAMILY_ALMOST_FULL_LINES, dailyContext.variantSeed),
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
            lines: pickVariant(FAMILY_GROWING_LINES, dailyContext.variantSeed),
        });
    }

    return createSpeech({
        id: 'family:small_progress',
        category: 'progress',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'progress',
        replyId: getReplyId('progress', dailyContext.variantSeed, 4),
        lines: pickVariant(FAMILY_SMALL_PROGRESS_LINES, dailyContext.variantSeed),
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

function buildUserAfterglowSpeech(afterglow: HomeAfterglow, context: UserSpeechContext): FuwafuwaSpeech {
    if (afterglow.kind === 'announcement') {
        return createSpeech({
            id: `afterglow:${afterglow.announcement.id}`,
            category: 'event_notice',
            accent: 'event',
            lines: getUserAfterglowLines('announcement', context.visitRecency, context.depth),
        });
    }

    return createSpeech({
        id: 'user:afterglow:magic_delivery',
        category: 'relationship',
        accent: 'magic',
        lines: getUserAfterglowLines('magic_delivery', context.visitRecency, context.depth),
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
                ? pickVariant(USER_HATCHING_SOON_LINES, context.variantSeed)
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
            ? pickVariant(USER_GROWTH_SOON_LINES, context.variantSeed)
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
            lines: pickVariant(USER_ALMOST_FULL_LINES, context.variantSeed),
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
            lines: pickVariant(USER_GROWING_LINES, context.variantSeed),
        });
    }

    return createSpeech({
        id: 'user:small_progress',
        category: 'progress',
        accent: 'magic',
        dailyGroup: 'magic',
        dailyTopic: 'progress',
        replyId: getReplyId('progress', context.variantSeed, 4),
        lines: pickVariant(USER_SMALL_PROGRESS_LINES, context.variantSeed),
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
        lines: getUserGreetingLines(
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
        return buildUserAfterglowSpeech(context.recentAfterglow!, context);
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
            lines: pickVariant(USER_NAMING_LINES, dailyContext.variantSeed),
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
        lines: pickVariant(USER_MECHANIC_LINES, dailyContext.variantSeed),
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
    visitRecency: HomeVisitRecency = 'first',
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
        visitRecency,
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
