import { describe, expect, it } from 'vitest';
import {
    getFamilyMessage,
    getFamilySpeech,
    getSoftProgress,
    getSoftProgressShort,
    getStageLabel,
    getUserMessage,
    getUserSpeech,
} from './fuwafuwaHomeCardCopy';

describe('fuwafuwaHomeCardCopy', () => {
    it('returns stage labels for each growth phase', () => {
        expect(getStageLabel(1)).toBe('たまご');
        expect(getStageLabel(2)).toBe('ようせい');
        expect(getStageLabel(3)).toBe('おとな');
    });

    it('returns soft progress labels for family and short card states', () => {
        expect(getSoftProgress(95)).toBe('もうすこしで まんたん！');
        expect(getSoftProgressShort(35)).toBe('いいかんじ');
    });

    it('keeps lightweight fallback strings for legacy usage', () => {
        expect(getFamilyMessage(3, 0, 600)).toBe('3にんで ちからを あわせよう！');
        expect(getUserMessage(0, 600, 1, 0)).toBe('きょうも まってたよ あえて うれしいな');
        expect(getUserMessage(590, 600, 2, 6)).toBe('もうすぐ おおきく なれそう！');
    });

    it('prioritizes full-magic action hints for solo speech', () => {
        expect(getUserSpeech(600, 600, 2, 6, null, null, null)).toEqual({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'magic',
            lines: ['まほうエネルギーが', 'いっぱいだよ', 'とどけてくれたら うれしいな'],
        });
        expect(getUserSpeech(600, 600, 2, 6, null, null, null, 1)).toEqual({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'magic',
            lines: ['ぽんって すると', 'すぐ ふわふわに とどくよ'],
        });
    });

    it('shows delivery speech above other home topics while magic is being sent', () => {
        expect(getUserSpeech(600, 600, 2, 6, {
            kind: 'fairy' as const,
            userId: 'user-1',
            source: 'system' as const,
        }, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null, 0, 0, 0, 'first', null, true)).toEqual({
            id: 'user:magic_delivery_active',
            category: 'action_hint',
            accent: 'magic',
            lines: ['まほうエネルギーが', 'いま ふわふわに とどいてるよ'],
        });

        expect(getFamilySpeech(2, 1200, 1200, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        }, 0, 0, 'first', null, true)).toEqual({
            id: 'family:magic_delivery_active',
            category: 'action_hint',
            accent: 'magic',
            lines: ['みんなの まほうエネルギーが', 'いま ふわふわに とどいてるよ'],
        });
    });

    it('keeps magic-delivery afterglow above family idle speech after reset', () => {
        expect(getFamilySpeech(2, 0, 600, null, null, null, 0, 0, 'first', {
            kind: 'magic_delivery',
            contextKey: 'family:user-1|user-2',
        })).toEqual({
            id: 'family:afterglow:magic_delivery',
            category: 'relationship',
            accent: 'magic',
            lines: ['みんなの まほうエネルギー', 'ちゃんと うけとったよ'],
        });
    });

    it('deepens receive-focused delivery speech and afterglow', () => {
        expect(getUserSpeech(600, 600, 2, 6, null, null, null, 2, 0, 0, 'first', null, true)).toEqual({
            id: 'user:magic_delivery_active',
            category: 'action_hint',
            accent: 'magic',
            lines: ['ちゃんと うけとってるよ', 'ありがとう'],
        });

        expect(getUserSpeech(0, 600, 2, 6, null, null, null, 1, 0, 0, 'first', {
            kind: 'magic_delivery',
            contextKey: 'solo:user-1',
        })).toEqual({
            id: 'user:afterglow:magic_delivery',
            category: 'relationship',
            accent: 'magic',
            lines: ['ぽかぽかが まだ', 'のこってるよ'],
        });
    });

    it('keeps milestone follow-up speech above regular home topics', () => {
        const milestoneEvent = {
            kind: 'fairy' as const,
            userId: 'user-1',
            source: 'system' as const,
        };

        expect(getUserSpeech(600, 600, 2, 6, milestoneEvent, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null)).toEqual({
            id: 'user:milestone:user-1:fairy',
            category: 'event_notice',
            accent: 'event',
            lines: ['ついに', 'うまれたよ！'],
        });

        expect(getUserSpeech(120, 600, 2, 6, milestoneEvent, null, null, 1)).toEqual({
            id: 'user:milestone:user-1:fairy',
            category: 'event_notice',
            accent: 'event',
            lines: ['まいにちの がんばり', 'ちゃんと とどいてたよ'],
        });
    });

    it('varies growth-soon idle speech for users nearing the next stage', () => {
        expect(getUserSpeech(120, 600, 2, 6, null, null, null, 0, 6, 0)).toMatchObject({
            id: 'user:growth_soon',
            category: 'progress',
            accent: 'magic',
            lines: ['もうすぐ', 'おおきく なれそう！'],
        });

        expect(getUserSpeech(120, 600, 2, 6, null, null, null, 0, 6, 1)).toMatchObject({
            id: 'user:mood',
            category: 'progress',
            accent: 'everyday',
            lines: ['ふわふわ なんだか', 'ごきげんだよ'],
        });
    });

    it('lets growth-soon users rotate into magic and ambient daily speech', () => {
        expect(getUserSpeech(120, 600, 2, 6, null, null, null, 0, 6, 2)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['まほうエネルギー ここで', 'ふえていくんだよ'],
        });

        expect(getUserSpeech(120, 600, 2, 6, null, null, { kind: 'public_menu_new' }, 0, 6, 4)).toMatchObject({
            id: 'ambient:public_menu_new',
            category: 'event_notice',
            accent: 'ambient',
            lines: ['ふわふわも ちょっと', 'きになってるんだ'],
        });
    });

    it('surfaces announcement speech before regular progress copy', () => {
        expect(getUserSpeech(120, 600, 2, 6, null, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null)).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['あたらしいチャレンジ みつけたよ', '前後開脚チャレンジ'],
            actionLabel: 'みてみる',
        });
    });

    it('keeps announcement afterglow above regular idle copy once the card is gone', () => {
        expect(getUserSpeech(0, 600, 2, 3, null, null, null, 0, 0, 0, 'first', {
            kind: 'announcement',
            contextKey: 'solo:user-1',
            announcement: {
                id: 'challenge:challenge-1',
                kind: 'challenge',
                badgeLabel: 'チャレンジ',
                title: 'あたらしいチャレンジ みつけたよ',
                detail: '前後開脚チャレンジ',
                actionLabel: 'みてみる',
            },
        })).toEqual({
            id: 'afterglow:challenge:challenge-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['みつけてくれて', 'ふわふわ うれしいな'],
        });
    });

    it('deepens announcement speech when fuwafuwa is poked', () => {
        const announcement = {
            id: 'challenge:challenge-1',
            kind: 'challenge' as const,
            badgeLabel: 'チャレンジ' as const,
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        };

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 1)).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['きょうのきみに', 'あいそうだよ'],
            actionLabel: 'みてみる',
        });

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 2)).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['ちょっとだけ', 'のぞいてみる？'],
            actionLabel: 'みてみる',
        });
    });

    it('deepens teacher menu recommendations with class context', () => {
        const announcement = {
            id: 'teacher-menu:teacher-menu-1',
            kind: 'teacher_menu' as const,
            badgeLabel: '先生' as const,
            title: 'せんせいから おすすめが とどいたよ',
            detail: '先生のおすすめメニュー',
            actionLabel: 'メニューへ',
        };

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 1)).toEqual({
            id: 'teacher-menu:teacher-menu-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['せんせいが', 'これ いいよって'],
            actionLabel: 'メニューへ',
        });

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 2)).toEqual({
            id: 'teacher-menu:teacher-menu-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['メニューで', 'みてみる？'],
            actionLabel: 'メニューへ',
        });
    });

    it('deepens teacher exercise recommendations as a softer suggestion', () => {
        const announcement = {
            id: 'teacher-exercise:teacher-exercise-1',
            kind: 'teacher_exercise' as const,
            badgeLabel: '先生' as const,
            title: 'せんせいが これ どうかなって',
            detail: '先生の新しい種目',
            actionLabel: 'メニューへ',
        };

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 1)).toEqual({
            id: 'teacher-exercise:teacher-exercise-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['せんせいが', 'これ どうかなって'],
            actionLabel: 'メニューへ',
        });

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 2)).toEqual({
            id: 'teacher-exercise:teacher-exercise-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['メニューで', 'みてみる？'],
            actionLabel: 'メニューへ',
        });
    });

    it('moves idle solo speech into magic conversation when the daily seed advances', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, null)).toMatchObject({
            id: 'user:relationship_waiting',
            category: 'relationship',
            accent: 'everyday',
            lines: ['きょうも まってたよ', 'あえて うれしいな'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 0, 0, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });
    });

    it('rotates low-priority solo speech variants with a seed', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 0, 0, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });

        expect(getUserSpeech(300, 600, 2, 4, null, null, null, 0, 0, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });
    });

    it('moves progress speech into magic and then progress as the daily seed advances', () => {
        expect(getUserSpeech(300, 600, 2, 4, null, null, null)).toMatchObject({
            id: 'user:mood',
            category: 'progress',
            accent: 'everyday',
            lines: ['なんだか ぽかぽか', 'してきたよ'],
        });

        expect(getUserSpeech(300, 600, 2, 4, null, null, null, 0, 0, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });

        expect(getUserSpeech(300, 600, 2, 4, null, null, null, 0, 0, 2)).toMatchObject({
            id: 'user:growing',
            category: 'progress',
            accent: 'magic',
            lines: ['なんだか ぽかぽか', 'してきたよ'],
        });
    });

    it('keeps solo ambient discovery on magic before mood and ambient', () => {
        expect(getUserSpeech(0, 600, 2, 3, null, null, { kind: 'public_menu_new' }, 0, 0, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });

        expect(getUserSpeech(0, 600, 2, 3, null, null, { kind: 'public_menu_new' }, 0, 0, 2)).toMatchObject({
            id: 'user:mood',
            category: 'progress',
            accent: 'everyday',
            lines: ['きょうは なんだか', 'いいかんじ'],
        });
    });

    it('keeps early users on mechanic before waiting mood discovery', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, { kind: 'public_menu_new' }, 0, 0, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, null, { kind: 'public_menu_new' }, 0, 0, 2)).toMatchObject({
            id: 'user:mood_waiting',
            category: 'progress',
            accent: 'everyday',
            lines: ['きみが きてくれて', 'うれしくなったみたい'],
        });
    });

    it('moves hatching-soon copy into the speech bubble', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 0, 3)).toMatchObject({
            id: 'user:hatching_soon',
            category: 'progress',
            accent: 'magic',
            lines: ['もうすぐ', 'うまれそう！'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 1, 3)).toMatchObject({
            id: 'user:hatching_soon',
            category: 'progress',
            accent: 'magic',
            lines: ['たまごの なかで', 'そわそわしてるかも'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 0, 3, 1)).toMatchObject({
            id: 'user:relationship_waiting',
            category: 'relationship',
            accent: 'everyday',
            lines: ['なんだか そわそわしてたんだ', 'また あえたね'],
        });
    });

    it('returns together-mode speech with info accent', () => {
        expect(getFamilySpeech(2, 300, 600, null, null)).toMatchObject({
            id: 'family:mood:2',
            category: 'progress',
            accent: 'everyday',
            lines: ['なんだか ぽかぽか', 'してきたね'],
        });
    });

    it('moves together-mode progress speech into magic when the daily seed advances', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, null, 0, 1)).toMatchObject({
            id: 'family:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここでも まほうエネルギーが', 'ふえていくんだよ'],
        });
    });

    it('rotates low-priority together-mode speech variants with a seed', () => {
        expect(getFamilySpeech(2, 0, 600, null, null, null, 0, 1)).toMatchObject({
            id: 'family:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここでも まほうエネルギーが', 'ふえていくんだよ'],
        });

        expect(getFamilySpeech(2, 300, 600, null, null, null, 0, 1)).toMatchObject({
            id: 'family:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここでも まほうエネルギーが', 'ふえていくんだよ'],
        });
    });

    it('keeps together-mode idle speech on magic energy before mood and ambient discovery', () => {
        expect(getFamilySpeech(2, 0, 600, null, { kind: 'public_menu_custom' }, null, 0, 1)).toMatchObject({
            id: 'family:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['ここでも まほうエネルギーが', 'ふえていくんだよ'],
        });

        expect(getFamilySpeech(2, 0, 600, null, { kind: 'public_menu_custom' }, null, 0, 2)).toMatchObject({
            id: 'family:mood:2',
            category: 'progress',
            accent: 'everyday',
            lines: ['みんなが いると', 'いいかんじだね'],
        });
    });

    it('surfaces together-mode milestone ambience before generic progress copy', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        })).toMatchObject({
            id: 'family:milestone:user-1:egg',
            category: 'event_notice',
            accent: 'event',
            lines: ['さくらの ところに', 'たまごが きたみたい'],
        });
    });

    it('deepens together-mode milestone ambience when the bubble is tapped', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        }, 1)).toMatchObject({
            id: 'family:milestone:user-1:egg',
            category: 'event_notice',
            accent: 'event',
            lines: ['どんな ふわふわか', 'たのしみだね'],
        });
    });

    it('keeps explicit home announcements above together-mode milestone ambience', () => {
        expect(getFamilySpeech(2, 300, 600, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        })).toMatchObject({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'event',
            lines: ['あたらしいチャレンジ みつけたよ', '前後開脚チャレンジ'],
            actionLabel: 'みてみる',
        });
    });

    it('keeps together-mode idle copy in the relationship category', () => {
        expect(getFamilySpeech(2, 0, 600, null, null)).toMatchObject({
            id: 'family:idle:2',
            category: 'relationship',
            accent: 'everyday',
            lines: ['ふたりで いると', 'なんだか たのしいね'],
        });
    });

    it('mentions magic energy in solo idle relationship variants too', () => {
        expect(getUserSpeech(0, 600, 2, 3, null, null, null, 0, 0, 0)).toMatchObject({
            id: 'user:relationship_ready',
            category: 'relationship',
            accent: 'everyday',
            lines: ['あえて うれしいな', 'ふわふわ ごきげんだよ'],
        });
    });

    it('changes solo relationship speech when fuwafuwa remembers a returning visit', () => {
        expect(getUserSpeech(0, 600, 2, 3, null, null, null, 0, 0, 0, 'returning')).toMatchObject({
            id: 'user:relationship_ready',
            category: 'relationship',
            accent: 'everyday',
            lines: ['まってたよ', 'また あえて うれしいな'],
        });
    });

    it('changes together relationship speech when everyone came back recently', () => {
        expect(getFamilySpeech(2, 0, 600, null, null, null, 0, 0, 'recent')).toMatchObject({
            id: 'family:idle:2',
            category: 'relationship',
            accent: 'everyday',
            lines: ['また すぐ あえたね', 'ふわふわ うれしいな'],
        });
    });

    it('rotates low-priority solo speech over time without poking', () => {
        expect(getUserSpeech(300, 600, 2, 4, null, null, null, 0, 0, 0, 'first', null, false, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['まほうエネルギー ここで', 'ふえていくんだよ'],
        });

        expect(getUserSpeech(0, 600, 2, 3, null, null, { kind: 'public_menu_new' }, 0, 0, 0, 'first', null, false, 1)).toMatchObject({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['まほうエネルギー ここで', 'ふえていくんだよ'],
        });

        expect(getUserSpeech(0, 600, 2, 3, null, null, { kind: 'public_menu_new' }, 0, 0, 0, 'first', null, false, 3)).toMatchObject({
            id: 'ambient:public_menu_new',
            category: 'event_notice',
            accent: 'ambient',
            lines: ['みんなの メニューに', 'あたらしいのが あるみたい'],
        });
    });

    it('rotates low-priority family speech over time without poking', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, null, 0, 0, 'first', null, false, 1)).toMatchObject({
            id: 'family:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['まほうエネルギーが', 'たまると うれしいな'],
        });

        expect(getFamilySpeech(2, 0, 600, null, { kind: 'public_menu_custom' }, null, 0, 0, 'first', null, false, 1)).toMatchObject({
            id: 'family:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'magic',
            lines: ['まほうエネルギーが', 'たまると うれしいな'],
        });

        expect(getFamilySpeech(2, 0, 600, null, { kind: 'public_menu_custom' }, null, 0, 0, 'first', null, false, 2)).toMatchObject({
            id: 'family:mood:2',
            category: 'progress',
            accent: 'everyday',
            lines: ['ふわふわ なんだか', 'ごきげんだよ'],
        });

        expect(getFamilySpeech(2, 0, 600, null, { kind: 'public_menu_custom' }, null, 0, 0, 'first', null, false, 4)).toMatchObject({
            id: 'ambient:public_menu_custom',
            category: 'event_notice',
            accent: 'ambient',
            lines: ['ふわふわも', 'みにいきたいな'],
        });
    });
});
