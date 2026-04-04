import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionRecord } from '../../../lib/db';
import { buildRecordHistoryDays } from '../recordHistorySummary';
import {
    buildRecordHistoryMonthSections,
    buildRecordSuggestionSummary,
    buildTodayRecordSummary,
    buildTopExerciseChips,
    buildTwoWeekRecordSummary,
} from '../recordOverviewSummary';

function createSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
    return {
        id: 'session-1',
        date: '2026-03-14',
        startedAt: '2026-03-14T09:00:00',
        totalSeconds: 360,
        exerciseIds: ['S01', 'S02'],
        skippedIds: [],
        userIds: ['u1'],
        ...overrides,
    };
}

const exerciseMap = new Map([
    ['S01', { name: '開脚', emoji: '🦵', placement: 'stretch' as const }],
    ['S02', { name: '前屈', emoji: '🙇', placement: 'stretch' as const }],
    ['S04', { name: 'ブリッジ', emoji: '🌈', placement: 'core' as const }],
    ['S11', { name: 'バー', emoji: '🩰', placement: 'barre' as const }],
    ['S99', { name: '深呼吸', emoji: '🌬️', placement: 'ending' as const }],
]);

const userNameMap = new Map([
    ['u1', 'ことり'],
    ['u2', 'ひなた'],
]);

describe('recordOverviewSummary', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('builds today summary with progress and rhythm copy', () => {
        const summary = buildTodayRecordSummary({
            todaySessions: [
                createSession({
                    id: 'morning',
                    totalSeconds: 480,
                    startedAt: '2026-03-14T10:20:00',
                    exerciseIds: ['S01', 'S02', 'S02'],
                }),
                createSession({
                    id: 'evening',
                    totalSeconds: 240,
                    startedAt: '2026-03-14T18:40:00',
                    exerciseIds: ['S04'],
                }),
            ],
            targetMinutes: 15,
        });

        expect(summary.progressPercent).toBe(80);
        expect(summary.minutes).toBe(12);
        expect(summary.exerciseCount).toBe(4);
        expect(summary.remainingMinutes).toBe(3);
        expect(summary.rhythmLine).toBe('昼と夕方に、ちょっとずつ');
        expect(summary.sessionTimes).toEqual(['10:20', '18:40']);
    });

    it('builds two-week analysis and suggestion from recent sessions', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 14, 10, 0, 0));

        const sessions = [
            createSession({ id: 'd0', date: '2026-03-14', startedAt: '2026-03-14T18:40:00', exerciseIds: ['S01', 'S02'] }),
            createSession({ id: 'd1', date: '2026-03-13', startedAt: '2026-03-13T18:20:00', exerciseIds: ['S01'] }),
            createSession({ id: 'd2', date: '2026-03-12', startedAt: '2026-03-12T17:40:00', exerciseIds: ['S02', 'S02'] }),
            createSession({ id: 'd6', date: '2026-03-08', startedAt: '2026-03-08T16:30:00', exerciseIds: ['S01'] }),
            createSession({ id: 'd8', date: '2026-03-06', startedAt: '2026-03-06T18:00:00', exerciseIds: ['S01', 'S99'] }),
            createSession({ id: 'old', date: '2026-02-20', startedAt: '2026-02-20T18:00:00', exerciseIds: ['S04'] }),
        ];

        const summary = buildTwoWeekRecordSummary({ sessions, exerciseMap });
        const todaySummary = buildTodayRecordSummary({
            todaySessions: sessions.filter((session) => session.date === '2026-03-14'),
            targetMinutes: 10,
        });
        const suggestion = buildRecordSuggestionSummary({
            sessions,
            todaySummary,
            quickMenuName: '今日の3分',
        });
        const topExercises = buildTopExerciseChips({ sessions, exerciseMap });

        expect(summary.streak).toBe(3);
        expect(summary.activeDays).toBe(5);
        expect(summary.totalMinutes).toBe(30);
        expect(summary.dominantTimeLine).toBe('会いやすいのは 夕方みたい');
        expect(summary.dominantPlacementLine).toBe('最近は のばす日が多め');
        expect(summary.dots).toHaveLength(14);

        expect(suggestion.title).toBe('もうすこしやってみる？');
        expect(suggestion.body).toBe('「今日の3分」みたいな 短めメニューが合いそう');
        expect(suggestion.targetTab).toBe('group');

        expect(topExercises).toEqual([
            { id: 'S01', name: '開脚', emoji: '🦵', count: 4, exerciseSource: 'standard' },
            { id: 'S02', name: '前屈', emoji: '🙇', count: 3, exerciseSource: 'standard' },
            { id: 'S99', name: '深呼吸', emoji: '🌬️', count: 1, exerciseSource: 'standard' },
        ]);
    });

    it('does not count inline-only items in top exercise chips', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 14, 10, 0, 0));

        const sessions = [
            createSession({
                id: 'inline-session',
                date: '2026-03-14',
                exerciseIds: ['inline-1', 'S01'],
                plannedItems: [
                    {
                        id: 'inline-1',
                        kind: 'inline_only',
                        name: 'おへやジャンプ',
                        sec: 30,
                        emoji: '✨',
                        placement: 'stretch',
                        internal: 'single',
                    },
                    {
                        id: 'S01',
                        kind: 'exercise_ref',
                        name: '開脚',
                        sec: 30,
                        emoji: '🦵',
                        placement: 'stretch',
                        internal: 'single',
                    },
                ],
            }),
        ];

        expect(buildTopExerciseChips({ sessions, exerciseMap })).toEqual([
            { id: 'S01', name: '開脚', emoji: '🦵', count: 1, exerciseSource: 'standard' },
        ]);
    });

    it('groups history days into month sections including current and previous month', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 14, 10, 0, 0));

        const historyDays = buildRecordHistoryDays({
            groupedEntries: [
                ['2026-03-14', [createSession({ id: 'today', date: '2026-03-14' })]],
                ['2026-03-11', [createSession({ id: 'this-month', date: '2026-03-11' })]],
                ['2026-02-20', [createSession({ id: 'last-month', date: '2026-02-20' })]],
            ],
            exerciseMap,
            userNameMap,
        });

        const sections = buildRecordHistoryMonthSections({
            historyDays,
            todayKey: '2026-03-14',
        });

        expect(sections.map((section) => section.label)).toEqual(['今月', '先月']);
        expect(sections[0].days.map((day) => day.date)).toEqual(['2026-03-14', '2026-03-11']);
        expect(sections[1].days.map((day) => day.date)).toEqual(['2026-02-20']);
        expect(sections[0].summaryLine).toBe('2日 / 2回 / 12分');
        expect(sections[1].summaryLine).toBe('1日 / 1回 / 6分');
        expect(sections[0].defaultExpanded).toBe(true);
    });

    it('uses a softer suggestion copy before any recent record exists', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 14, 10, 0, 0));

        const todaySummary = buildTodayRecordSummary({
            todaySessions: [],
            targetMinutes: 10,
        });
        const suggestion = buildRecordSuggestionSummary({
            sessions: [],
            todaySummary,
            quickMenuName: '今日の3分',
        });

        expect(suggestion.title).toBe('まずはやってみよう');
        expect(suggestion.body).toBe('「今日の3分」からでも いいよ');
        expect(suggestion.targetTab).toBe('group');
    });

    it('rounds sub-minute record displays up to one minute', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 14, 10, 0, 0));

        const sessions = [
            createSession({
                id: 'short',
                date: '2026-03-14',
                totalSeconds: 30,
                exerciseIds: ['S01'],
            }),
        ];

        const todaySummary = buildTodayRecordSummary({
            todaySessions: sessions,
            targetMinutes: 10,
        });
        const trendSummary = buildTwoWeekRecordSummary({ sessions, exerciseMap });
        const historyDays = buildRecordHistoryDays({
            groupedEntries: [['2026-03-14', sessions]],
            exerciseMap,
            userNameMap,
        });
        const sections = buildRecordHistoryMonthSections({
            historyDays,
            todayKey: '2026-03-14',
        });

        expect(todaySummary.minutes).toBe(1);
        expect(trendSummary.totalMinutes).toBe(1);
        expect(trendSummary.dots[trendSummary.dots.length - 1]?.minutes).toBe(1);
        expect(sections[0].summaryLine).toBe('1日 / 1回 / 1分');
    });

    it('suggests a familiar menu after today is already enough', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 2, 14, 10, 0, 0));

        const sessions = [
            createSession({
                id: 'today',
                date: '2026-03-14',
                totalSeconds: 360,
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
                sourceMenuName: '基本ストレッチ',
            }),
            createSession({
                id: 'recent-1',
                date: '2026-03-13',
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
                sourceMenuName: '基本ストレッチ',
            }),
        ];
        const todaySummary = buildTodayRecordSummary({
            todaySessions: sessions.filter((session) => session.date === '2026-03-14'),
            targetMinutes: 5,
        });
        const suggestion = buildRecordSuggestionSummary({
            sessions,
            todaySummary,
            quickMenuName: '今日の3分',
        });

        expect(suggestion.title).toBe('「基本ストレッチ」どう？');
        expect(suggestion.body).toBe('最近よく会うメニューだよ');
        expect(suggestion.targetTab).toBe('group');
    });
});
