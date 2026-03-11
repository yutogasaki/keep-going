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
        expect(getUserMessage(0, 600, 1, 0)).toBe('まほうエネルギーは ここに たまるんだよ');
        expect(getUserMessage(590, 600, 2, 6)).toBe('もうすぐ おおきく なれそう！');
    });

    it('prioritizes full-magic action hints for solo speech', () => {
        expect(getUserSpeech(600, 600, 2, 6, null, null, null)).toEqual({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'primary',
            lines: ['まほうエネルギーが', 'いっぱいだよ'],
        });
        expect(getUserSpeech(600, 600, 2, 6, null, null, null, 1)).toEqual({
            id: 'user:magic_full',
            category: 'action_hint',
            accent: 'primary',
            lines: ['ぽんって すると', 'ふわふわに おくれるよ'],
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
            title: 'あたらしいチャレンジが きたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null)).toEqual({
            id: 'user:milestone:user-1:fairy',
            category: 'event_notice',
            accent: 'primary',
            lines: ['ついに', 'うまれたよ！'],
        });

        expect(getUserSpeech(120, 600, 2, 6, milestoneEvent, null, null, 1)).toEqual({
            id: 'user:milestone:user-1:fairy',
            category: 'event_notice',
            accent: 'primary',
            lines: ['まいにちの がんばり', 'ちゃんと とどいてたよ'],
        });
    });

    it('surfaces announcement speech before regular progress copy', () => {
        expect(getUserSpeech(120, 600, 2, 6, null, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジが きたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null)).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'primary',
            lines: ['あたらしいチャレンジが きたよ', '前後開脚チャレンジ'],
            actionLabel: 'みてみる',
        });
    });

    it('deepens announcement speech when fuwafuwa is poked', () => {
        const announcement = {
            id: 'challenge:challenge-1',
            kind: 'challenge' as const,
            badgeLabel: 'チャレンジ' as const,
            title: 'あたらしいチャレンジが きたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        };

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 1)).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'primary',
            lines: ['きょうのきみに', 'あいそうだよ'],
            actionLabel: 'みてみる',
        });

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 2)).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'primary',
            lines: ['ちょっとだけ', 'のぞいてみる？'],
            actionLabel: 'みてみる',
        });
    });

    it('deepens teacher menu recommendations with class context', () => {
        const announcement = {
            id: 'teacher-menu:teacher-menu-1',
            kind: 'teacher_menu' as const,
            badgeLabel: '先生' as const,
            title: 'せんせいの おすすめメニューが きたよ',
            detail: '先生のおすすめメニュー',
            actionLabel: 'メニューへ',
        };

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 1)).toEqual({
            id: 'teacher-menu:teacher-menu-1',
            category: 'event_notice',
            accent: 'info',
            lines: ['クラスで やったことの', 'つづきに いいかも'],
            actionLabel: 'メニューへ',
        });

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 2)).toEqual({
            id: 'teacher-menu:teacher-menu-1',
            category: 'event_notice',
            accent: 'info',
            lines: ['メニューで', 'みてみる？'],
            actionLabel: 'メニューへ',
        });
    });

    it('deepens teacher exercise recommendations as a softer suggestion', () => {
        const announcement = {
            id: 'teacher-exercise:teacher-exercise-1',
            kind: 'teacher_exercise' as const,
            badgeLabel: '先生' as const,
            title: 'せんせいの おすすめしゅもくが きたよ',
            detail: '先生の新しい種目',
            actionLabel: 'メニューへ',
        };

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 1)).toEqual({
            id: 'teacher-exercise:teacher-exercise-1',
            category: 'event_notice',
            accent: 'info',
            lines: ['せんせいが', 'これ どうかなって'],
            actionLabel: 'メニューへ',
        });

        expect(getUserSpeech(120, 600, 2, 6, null, announcement, null, 2)).toEqual({
            id: 'teacher-exercise:teacher-exercise-1',
            category: 'event_notice',
            accent: 'info',
            lines: ['メニューで', 'みてみる？'],
            actionLabel: 'メニューへ',
        });
    });

    it('keeps mechanic hints low-pressure while poke depth advances', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, null)).toEqual({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'primary',
            lines: ['まほうエネルギーは', 'ここに たまるんだよ'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 1)).toEqual({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'primary',
            lines: ['たまると', 'いいこと あるよ'],
        });
    });

    it('rotates low-priority solo speech variants with a seed', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 0, 0, 1)).toEqual({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'primary',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });

        expect(getUserSpeech(300, 600, 2, 4, null, null, null, 0, 0, 1)).toEqual({
            id: 'user:growing',
            category: 'progress',
            accent: 'primary',
            lines: ['いいかんじ！', 'まほうエネルギーが ふえてきたよ'],
        });
    });

    it('uses progress depth to explain how magic energy builds up', () => {
        expect(getUserSpeech(300, 600, 2, 4, null, null, null)).toEqual({
            id: 'user:growing',
            category: 'progress',
            accent: 'primary',
            lines: ['まほうエネルギーが', 'たまってきたよ'],
        });

        expect(getUserSpeech(300, 600, 2, 4, null, null, null, 1)).toEqual({
            id: 'user:growing',
            category: 'progress',
            accent: 'primary',
            lines: ['ここに すこしずつ', 'たまるんだよ'],
        });
    });

    it('can surface ambient public discovery when idle', () => {
        expect(getUserSpeech(0, 600, 2, 3, null, null, { kind: 'public_menu_new' }, 0, 0, 1)).toEqual({
            id: 'ambient:public_menu_new',
            category: 'event_notice',
            accent: 'info',
            lines: ['みんなの メニューに', 'あたらしいのが あるみたい'],
        });
    });

    it('keeps mechanic hints above ambient discovery for early users', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, { kind: 'public_menu_new' }, 0, 0, 1)).toEqual({
            id: 'user:mechanic_hint',
            category: 'mechanic_hint',
            accent: 'primary',
            lines: ['ここに まほうエネルギーが', 'たまっていくんだよ'],
        });
    });

    it('moves hatching-soon copy into the speech bubble', () => {
        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 0, 3)).toEqual({
            id: 'user:hatching_soon',
            category: 'progress',
            accent: 'primary',
            lines: ['もうすぐ', 'うまれそう！'],
        });

        expect(getUserSpeech(0, 600, 1, 0, null, null, null, 1, 3)).toEqual({
            id: 'user:hatching_soon',
            category: 'progress',
            accent: 'primary',
            lines: ['たまごの なかで', 'うごいてるかも'],
        });
    });

    it('returns together-mode speech with info accent', () => {
        expect(getFamilySpeech(2, 300, 600, null, null)).toEqual({
            id: 'family:growing',
            category: 'progress',
            accent: 'info',
            lines: ['みんなの まほうエネルギーが', 'たまってきたよ'],
        });
    });

    it('deepens together-mode progress speech when the bubble is tapped', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, null, 1)).toEqual({
            id: 'family:growing',
            category: 'progress',
            accent: 'info',
            lines: ['ここに すこしずつ', 'たまるんだよ'],
        });
    });

    it('rotates low-priority together-mode speech variants with a seed', () => {
        expect(getFamilySpeech(2, 0, 600, null, null, null, 0, 1)).toEqual({
            id: 'family:idle:2',
            category: 'relationship',
            accent: 'info',
            lines: ['みんなで いっしょに', 'やってみよう？'],
        });

        expect(getFamilySpeech(2, 300, 600, null, null, null, 0, 1)).toEqual({
            id: 'family:growing',
            category: 'progress',
            accent: 'info',
            lines: ['いいかんじ！', 'まほうエネルギーが ふえてきたよ'],
        });
    });

    it('can surface ambient public discovery in together-mode idle speech', () => {
        expect(getFamilySpeech(2, 0, 600, null, { kind: 'public_menu_custom' }, null, 0, 1)).toEqual({
            id: 'ambient:public_menu_custom',
            category: 'event_notice',
            accent: 'info',
            lines: ['みんなの メニューで', 'あたらしい種目も みつかるかも'],
        });
    });

    it('surfaces together-mode milestone ambience before generic progress copy', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        })).toEqual({
            id: 'family:milestone:user-1:egg',
            category: 'event_notice',
            accent: 'info',
            lines: ['さくらの ところに', 'たまごが きたみたい'],
        });
    });

    it('deepens together-mode milestone ambience when the bubble is tapped', () => {
        expect(getFamilySpeech(2, 300, 600, null, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        }, 1)).toEqual({
            id: 'family:milestone:user-1:egg',
            category: 'event_notice',
            accent: 'info',
            lines: ['どんな ふわふわか', 'たのしみだね'],
        });
    });

    it('keeps explicit home announcements above together-mode milestone ambience', () => {
        expect(getFamilySpeech(2, 300, 600, {
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジが きたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        }, null, {
            kind: 'egg',
            userId: 'user-1',
            userName: 'さくら',
            hasMultiple: false,
        })).toEqual({
            id: 'challenge:challenge-1',
            category: 'event_notice',
            accent: 'primary',
            lines: ['あたらしいチャレンジが きたよ', '前後開脚チャレンジ'],
            actionLabel: 'みてみる',
        });
    });

    it('keeps together-mode idle copy in the relationship category', () => {
        expect(getFamilySpeech(2, 0, 600, null, null)).toEqual({
            id: 'family:idle:2',
            category: 'relationship',
            accent: 'info',
            lines: ['ふたりで ちからを', 'あわせよう！'],
        });
    });
});
