import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { HomeAmbientCue } from './homeAmbientUtils';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import { getMilestoneSpeechLines } from './milestoneCopy';

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

export interface FamilyMilestoneLead {
    kind: FuwafuwaMilestoneEvent['kind'];
    userId: string;
    userName: string;
    hasMultiple: boolean;
}

type FuwafuwaSpeechTopic =
    | 'milestone'
    | 'action'
    | 'announcement'
    | 'growth'
    | 'progress'
    | 'ambient'
    | 'relationship'
    | 'mechanic';

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

function isHatchingSoon(stage: number, daysAlive: number): boolean {
    return stage === 1 && daysAlive === 3;
}

function isGrowthSoon(stage: number, activeDays: number): boolean {
    return stage === 2 && activeDays >= 6;
}

interface FamilySpeechContext {
    activeCount: number;
    percent: number;
    displaySeconds: number;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    milestoneLead: FamilyMilestoneLead | null;
    depth: number;
    variantSeed: number;
}

interface UserSpeechContext {
    percent: number;
    displaySeconds: number;
    stage: number;
    activeDays: number;
    daysAlive: number;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null;
    depth: number;
    variantSeed: number;
}

function pickVariant<T>(variants: readonly T[], seed: number): T {
    return variants[Math.abs(seed) % variants.length];
}

function pickFamilyTopic(context: FamilySpeechContext): FuwafuwaSpeechTopic {
    if (context.percent >= 100) {
        return 'action';
    }

    if (context.announcement) {
        return 'announcement';
    }

    if (context.milestoneLead) {
        return 'milestone';
    }

    if (context.displaySeconds === 0) {
        if (context.ambientCue && context.depth >= 2) {
            return 'ambient';
        }

        if (context.depth === 0) {
            return 'relationship';
        }

        return 'progress';
    }

    return 'progress';
}

function buildFamilyMilestoneSpeech(milestoneLead: FamilyMilestoneLead, depth: number): FuwafuwaSpeech {
    if (milestoneLead.hasMultiple) {
        if (milestoneLead.kind === 'egg') {
            return createSpeech({
                id: `family:milestone:many:${milestoneLead.kind}`,
                category: 'event_notice',
                accent: 'info',
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
                accent: 'info',
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
            accent: 'info',
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
            accent: 'info',
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
            accent: 'info',
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
        accent: 'info',
        lines: depth === 0
            ? [`${milestoneLead.userName}の ふわふわ`, 'おおきく なったみたい']
            : depth === 1
                ? ['ぐんと そだった', 'みたいだね']
                : ['みにいくの', 'たのしみだね'],
    });
}

function buildAmbientSpeech(ambientCue: HomeAmbientCue, depth: number, accent: FuwafuwaSpeechAccent): FuwafuwaSpeech {
    if (ambientCue.kind === 'public_menu_new') {
        return createSpeech({
            id: 'ambient:public_menu_new',
            category: 'event_notice',
            accent,
            lines: depth === 0
                ? ['みんなの メニューに', 'あたらしいのが あるみたい']
                : depth === 1
                    ? ['ふわふわも ちょっと', 'きになってるんだ']
                    : ['のぞきに いけたら', 'たのしそうだね'],
        });
    }

    if (ambientCue.kind === 'public_menu_custom') {
        return createSpeech({
            id: 'ambient:public_menu_custom',
            category: 'event_notice',
            accent,
            lines: depth === 0
                ? ['みんなの メニューで', 'あたらしい種目も みつかるかも']
                : depth === 1
                    ? ['だれかの くふうが', 'はいってるみたい']
                    : ['ふわふわも', 'みにいきたいな'],
        });
    }

    return createSpeech({
        id: 'ambient:public_exercise',
        category: 'event_notice',
        accent,
        lines: depth === 0
            ? ['みんなの ところで', 'おもしろい種目が みつかるかも']
            : depth === 1
                ? ['ふわふわも なんだか', 'きになってるよ']
                : ['のぞきに いくと', 'たのしいかも'],
    });
}

function buildFamilySpeech(topic: FuwafuwaSpeechTopic, context: FamilySpeechContext): FuwafuwaSpeech {
    if (topic === 'action') {
        return createSpeech({
            id: 'family:magic_full',
            category: 'action_hint',
            accent: 'info',
            lines: context.depth === 0
                ? ['みんなの まほうエネルギーが', 'いっぱいに なったよ', 'ぽんって してくれたら うれしいな']
                : context.depth === 1
                    ? ['みんなの まほうエネルギー', 'ふわふわ うれしいな']
                    : ['ぽんって すると', 'ふわふわに とどくよ'],
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
                accent: 'primary',
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
                accent: 'info',
                lines: context.depth === 1
                    ? ['せんせいが', 'これ いいよって']
                    : ['メニューで', 'みてみる？'],
                actionLabel: context.announcement.actionLabel,
            });
        }

        return createSpeech({
            id: context.announcement!.id,
            category: 'event_notice',
            accent: 'info',
            lines: context.depth === 1
                ? ['せんせいが', 'これ どうかなって']
                : ['メニューで', 'みてみる？'],
            actionLabel: context.announcement!.actionLabel,
        });
    }

    if (topic === 'milestone') {
        return buildFamilyMilestoneSpeech(context.milestoneLead!, context.depth);
    }

    if (topic === 'ambient') {
        return buildAmbientSpeech(context.ambientCue!, Math.max(0, context.depth - 2), 'info');
    }

    if (topic === 'relationship') {
        const peopleLabel = context.activeCount === 2 ? 'ふたりで' : `${context.activeCount}にんで`;
        return createSpeech({
            id: `family:idle:${context.activeCount}`,
            category: 'relationship',
            accent: 'info',
            lines: context.depth === 0
                ? pickVariant([
                    [`${peopleLabel} いると`, 'まほうエネルギー たまるかな？'],
                    ['みんなの まほうエネルギー', 'ふわふわ うれしいな'],
                ], context.variantSeed)
                : context.depth === 1
                    ? ['みんなで やると', 'たのもしいね']
                    : ['いっしょだと', 'たのしいね'],
        });
    }

    if (context.percent >= 90) {
        return createSpeech({
            id: 'family:almost_full',
            category: 'progress',
            accent: 'info',
            lines: context.depth === 0
                ? pickVariant([
                    ['みんなの まほうエネルギーが', 'もうすこしで まんたん！'],
                    ['いいかんじ！', 'ふわふわ どきどきしてる'],
                ], context.variantSeed)
                : context.depth === 1
                    ? ['ここに すこしずつ', 'まほうエネルギー たまってるね']
                    : ['もうすぐ いっぱいで', 'ふわふわ どきどき'],
        });
    }

    if (context.percent >= 31) {
        return createSpeech({
            id: 'family:growing',
            category: 'progress',
            accent: 'info',
            lines: context.depth === 0
                ? pickVariant([
                    ['みんなの まほうエネルギーが', 'たまってきたよ'],
                    ['いいかんじ！', 'まほうエネルギー ふえてきたよ'],
                ], context.variantSeed)
                : context.depth === 1
                    ? ['ここに すこしずつ', 'まほうエネルギー たまってるよ']
                    : ['ふわふわ なんだか', 'わくわくしてきた'],
        });
    }

    return createSpeech({
        id: 'family:small_progress',
        category: 'progress',
        accent: 'info',
        lines: context.depth === 0
            ? pickVariant([
                ['まほうエネルギーが', 'みんなで ふえてるね'],
                ['すこしずつ', 'まほうエネルギー ふえてるよ'],
            ], context.variantSeed)
            : context.depth === 1
                ? ['ここにも まほうエネルギーが', 'ちゃんと たまってるよ']
                : ['ゆっくりでも', 'まほうエネルギーは たまるよ'],
    });
}

export function getFamilySpeech(
    activeCount: number,
    displaySeconds: number,
    targetSeconds: number,
    announcement: HomeAnnouncement | null,
    ambientCue: HomeAmbientCue | null,
    milestoneLead: FamilyMilestoneLead | null = null,
    pokeDepth = 0,
    variantSeed = 0,
): FuwafuwaSpeech {
    const context: FamilySpeechContext = {
        activeCount,
        percent: Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
        displaySeconds,
        announcement,
        ambientCue,
        milestoneLead,
        depth: Math.max(0, Math.min(2, pokeDepth)),
        variantSeed,
    };

    return buildFamilySpeech(pickFamilyTopic(context), context);
}

export function getFamilyMessage(activeCount: number, displaySeconds: number, targetSeconds: number) {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;

    if (percent >= 100) {
        return 'みんな すごい！ まほうエネルギーが まんたんだよ';
    }

    if (displaySeconds === 0) {
        return `${peopleLabel} ちからを あわせよう！`;
    }

    if (percent >= 90) {
        return `${peopleLabel} まほうエネルギーが もうすこしで まんたん！`;
    }

    return 'みんなの まほうエネルギー、たまってきたよ！';
}

function pickUserTopic(context: UserSpeechContext): FuwafuwaSpeechTopic {
    if (context.recentMilestoneEvent) {
        return 'milestone';
    }

    if (context.percent >= 100) {
        return 'action';
    }

    if (context.announcement) {
        return 'announcement';
    }

    if (isHatchingSoon(context.stage, context.daysAlive) || isGrowthSoon(context.stage, context.activeDays)) {
        return 'growth';
    }

    if (context.displaySeconds > 0) {
        return 'progress';
    }

    if (context.ambientCue && !shouldShowMechanicHint(context.activeDays) && context.depth >= 2) {
        return 'ambient';
    }

    if (!shouldShowMechanicHint(context.activeDays)) {
        return context.depth === 0 ? 'relationship' : 'progress';
    }

    return 'mechanic';
}

function buildUserAnnouncementSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    if (context.depth === 0) {
        return buildAnnouncementSpeech(context.announcement!);
    }

    if (context.announcement?.kind === 'challenge') {
        return createSpeech({
            id: context.announcement.id,
            category: 'event_notice',
            accent: 'primary',
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
            accent: 'info',
            lines: context.depth === 1
                ? ['せんせいが', 'これ いいよって']
                : ['メニューで', 'みてみる？'],
            actionLabel: context.announcement.actionLabel,
        });
    }

    return createSpeech({
        id: context.announcement!.id,
        category: 'event_notice',
        accent: 'info',
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
            accent: 'primary',
            lines: context.depth === 0
                ? ['もうすぐ', 'うまれそう！']
                : context.depth === 1
                    ? ['たまごの なかで', 'そわそわしてるかも']
                    : ['あえるの', 'たのしみだな'],
        });
    }

    return createSpeech({
        id: 'user:growth_soon',
        category: 'progress',
        accent: 'primary',
        lines: context.depth === 0
            ? ['もうすぐ', 'おおきく なれそう！']
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
            accent: 'primary',
            lines: context.depth === 0
                ? pickVariant([
                    ['まほうエネルギーが', 'もうすこしで まんたん！'],
                    ['いいかんじ！', 'ふわふわ どきどきしてる'],
                ], context.variantSeed)
                : context.depth === 1
                    ? ['あと ほんのちょっとで', 'いっぱいに なりそう']
                    : ['もうすぐ いっぱいで', 'ふわふわ どきどき'],
        });
    }

    if (context.percent >= 31) {
        return createSpeech({
            id: 'user:growing',
            category: 'progress',
            accent: 'primary',
            lines: context.depth === 0
                ? pickVariant([
                    ['まほうエネルギーが', 'たまってきたよ'],
                    ['いいかんじ！', 'まほうエネルギー ふえてきたよ'],
                ], context.variantSeed)
                : context.depth === 1
                    ? ['ここに すこしずつ', 'まほうエネルギー たまってるよ']
                    : ['ふわふわ なんだか', 'わくわくしてきた'],
        });
    }

    return createSpeech({
        id: 'user:small_progress',
        category: 'progress',
        accent: 'primary',
        lines: context.depth === 0
            ? pickVariant([
                ['まほうエネルギーが', 'すこし たまってきたよ'],
                ['すこしずつ', 'まほうエネルギーが ふえてるよ'],
            ], context.variantSeed)
            : context.depth === 1
                ? ['ここに ちょっとずつ', 'まほうエネルギーが たまるんだよ']
                : ['あせらなくても', 'まほうエネルギーは たまるよ'],
    });
}

function buildUserRelationshipSpeech(context: UserSpeechContext): FuwafuwaSpeech {
    return createSpeech({
        id: context.stage === 1 ? 'user:relationship_waiting' : 'user:relationship_ready',
        category: 'relationship',
        accent: 'primary',
        lines: context.stage === 1
            ? (
                context.depth === 0
                    ? pickVariant([
                        ['きょうも まってたよ', 'まほうエネルギー もらえるかな？'],
                        ['あえて うれしいな', 'まほうエネルギー ほしいな'],
                    ], context.variantSeed)
                    : context.depth === 1
                        ? ['ツンツン してくれて', 'うれしいな']
                        : ['また さわってくれて', 'ありがとう']
            )
            : (
                context.depth === 0
                    ? pickVariant([
                        ['あえて うれしいな', 'まほうエネルギー ほしいな'],
                        ['きょうも きてくれたね', 'まほうエネルギー たまるかな？'],
                    ], context.variantSeed)
                    : context.depth === 1
                        ? ['ふわふわ なんだか', 'ごきげんだよ']
                        : ['いっしょだと', 'たのしいね']
            ),
    });
}

function buildUserSpeech(topic: FuwafuwaSpeechTopic, context: UserSpeechContext): FuwafuwaSpeech {
    if (topic === 'milestone') {
        return createSpeech({
            id: `user:milestone:${context.recentMilestoneEvent!.userId}:${context.recentMilestoneEvent!.kind}`,
            category: 'event_notice',
            accent: 'primary',
            lines: getMilestoneSpeechLines(context.recentMilestoneEvent!.kind, context.depth),
        });
    }

    if (topic === 'action') {
        return createSpeech({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'primary',
            lines: context.depth === 0
                ? ['まほうエネルギーが', 'いっぱいだよ']
                : context.depth === 1
                    ? ['ぽんって すると', 'ふわふわに おくれるよ']
                    : ['やさしく ぽんって', 'してくれたら うれしいな'],
        });
    }

    if (topic === 'announcement') {
        return buildUserAnnouncementSpeech(context);
    }

    if (topic === 'growth') {
        return buildUserGrowthSpeech(context);
    }

    if (topic === 'progress') {
        return buildUserProgressSpeech(context);
    }

    if (topic === 'ambient') {
        return buildAmbientSpeech(context.ambientCue!, Math.max(0, context.depth - 2), 'info');
    }

    if (topic === 'relationship') {
        return buildUserRelationshipSpeech(context);
    }

    return createSpeech({
        id: 'user:mechanic_hint',
        category: 'mechanic_hint',
        accent: 'primary',
        lines: context.depth === 0
            ? pickVariant([
                ['まほうエネルギーは', 'ここに たまるんだよ'],
                ['ここに まほうエネルギーが', 'たまっていくんだよ'],
            ], context.variantSeed)
            : context.depth === 1
                ? ['たまると', 'ふわふわ うれしいな']
                : ['すこしずつ', 'とどくと うれしいな'],
    });
}

export function getUserSpeech(
    displaySeconds: number,
    targetSeconds: number,
    stage: number,
    activeDays: number,
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null,
    announcement: HomeAnnouncement | null,
    ambientCue: HomeAmbientCue | null,
    pokeDepth = 0,
    daysAlive = 0,
    variantSeed = 0,
): FuwafuwaSpeech {
    const context: UserSpeechContext = {
        percent: Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
        displaySeconds,
        stage,
        activeDays,
        daysAlive,
        announcement,
        ambientCue,
        recentMilestoneEvent,
        depth: Math.max(0, Math.min(2, pokeDepth)),
        variantSeed,
    };

    return buildUserSpeech(pickUserTopic(context), context);
}

export function getUserMessage(displaySeconds: number, targetSeconds: number, stage: number, activeDays: number) {
    return getUserSpeech(displaySeconds, targetSeconds, stage, activeDays, null, null, null).lines.join(' ');
}
