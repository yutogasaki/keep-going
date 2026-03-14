import {
    calculateStreak,
    getDateKeyOffset,
    parseDateKey,
    shiftDateKey,
    type SessionRecord,
} from '../../lib/db';
import { getSessionCompletedExerciseTotal, getSessionExerciseCounts } from '../../lib/sessionRecords';
import type { RecordSessionHistoryDay } from './recordHistorySummary';
import type { ExercisePlacement } from '../../data/exercisePlacement';

export interface RecordExerciseDisplayInfo {
    name: string;
    emoji: string;
    placement?: ExercisePlacement;
}

export interface TodayRecordSummary {
    progressPercent: number;
    minutes: number;
    sessionCount: number;
    exerciseCount: number;
    remainingMinutes: number;
    firstSessionTime: string | null;
    lastSessionTime: string | null;
    sessionTimes: string[];
    rhythmLine: string;
}

export interface TwoWeekActivityDot {
    date: string;
    label: string;
    minutes: number;
    level: 0 | 1 | 2 | 3;
    isToday: boolean;
}

export interface TwoWeekRecordSummary {
    streak: number;
    activeDays: number;
    totalMinutes: number;
    dominantTimeLine: string;
    dominantPlacementLine: string;
    dots: TwoWeekActivityDot[];
}

export interface RecordSuggestionSummary {
    title: string;
    body: string;
    ctaLabel: string;
    suggestedPlacement: ExercisePlacement | null;
}

export interface RecordTopExerciseChip {
    id: string;
    name: string;
    emoji: string;
    count: number;
}

export interface RecordHistoryAccordionSection {
    id: 'today' | 'thisWeek' | 'lastWeek';
    label: string;
    summaryLine: string;
    emptyLine: string;
    days: RecordSessionHistoryDay[];
    defaultExpanded: boolean;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const ACTIONABLE_PLACEMENTS: ExercisePlacement[] = ['stretch', 'core', 'barre', 'ending'];

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getTimeBucket(hour: number): 'morning' | 'daytime' | 'evening' | 'night' {
    if (hour >= 5 && hour < 10) {
        return 'morning';
    }
    if (hour >= 10 && hour < 15) {
        return 'daytime';
    }
    if (hour >= 15 && hour < 19) {
        return 'evening';
    }
    return 'night';
}

function getTimeBucketLabel(bucket: ReturnType<typeof getTimeBucket>): string {
    switch (bucket) {
    case 'morning':
        return '朝';
    case 'daytime':
        return '昼';
    case 'evening':
        return '夕方';
    case 'night':
    default:
        return '夜';
    }
}

function getPlacementTrendLabel(placement: ExercisePlacement | null): string {
    switch (placement) {
    case 'prep':
        return '最近は はじめる日が多め';
    case 'stretch':
        return '最近は のばす日が多め';
    case 'core':
        return '最近は 体幹の日が多め';
    case 'barre':
        return '最近は バーの日が多め';
    case 'ending':
        return '最近は しめる日が多め';
    case 'rest':
    case null:
    default:
        return 'まだ いろんなながれが見えてくるところ';
    }
}

function buildTodayRhythmLine(todaySessions: SessionRecord[]): string {
    if (todaySessions.length === 0) {
        return 'まだ これから';
    }

    const sortedBuckets = todaySessions
        .map((session) => getTimeBucket(new Date(session.startedAt).getHours()))
        .sort((a, b) => {
            const order = ['morning', 'daytime', 'evening', 'night'];
            return order.indexOf(a) - order.indexOf(b);
        });

    const firstLabel = getTimeBucketLabel(sortedBuckets[0]);
    const lastLabel = getTimeBucketLabel(sortedBuckets[sortedBuckets.length - 1]);
    const uniqueLabels = Array.from(new Set(sortedBuckets.map((bucket) => getTimeBucketLabel(bucket))));

    if (todaySessions.length === 1) {
        return `${firstLabel}に、ちょっとだけ`;
    }

    if (uniqueLabels.length === 1) {
        return `${firstLabel}に、${todaySessions.length}回あえたね`;
    }

    if (todaySessions.length === 2) {
        return `${firstLabel}と${lastLabel}に、ちょっとずつ`;
    }

    return `${firstLabel}から${lastLabel}に、ちょっとずつ`;
}

function getDotLevel(totalSeconds: number): 0 | 1 | 2 | 3 {
    if (totalSeconds <= 0) {
        return 0;
    }
    if (totalSeconds < 5 * 60) {
        return 1;
    }
    if (totalSeconds < 10 * 60) {
        return 2;
    }
    return 3;
}

function getWeekStart(dateKey: string): string {
    const date = parseDateKey(dateKey);
    if (!date) {
        return dateKey;
    }

    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function compareDateKey(a: string, b: string): number {
    return a.localeCompare(b);
}

export function buildTodayRecordSummary({
    todaySessions,
    targetMinutes,
}: {
    todaySessions: SessionRecord[];
    targetMinutes: number;
}): TodayRecordSummary {
    const totalSeconds = todaySessions.reduce((sum, session) => sum + session.totalSeconds, 0);
    const targetSeconds = Math.max(60, targetMinutes * 60);
    const progressPercent = Math.min(100, Math.round((totalSeconds / targetSeconds) * 100));
    const sortedSessions = [...todaySessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    const sessionTimes = sortedSessions.map((session) => formatTime(session.startedAt));

    return {
        progressPercent,
        minutes: Math.floor(totalSeconds / 60),
        sessionCount: todaySessions.length,
        exerciseCount: todaySessions.reduce(
            (sum, session) => sum + getSessionCompletedExerciseTotal(session),
            0,
        ),
        remainingMinutes: Math.max(0, Math.ceil((targetSeconds - totalSeconds) / 60)),
        firstSessionTime: sessionTimes[0] ?? null,
        lastSessionTime: sessionTimes.length > 0 ? sessionTimes[sessionTimes.length - 1] : null,
        sessionTimes,
        rhythmLine: buildTodayRhythmLine(sortedSessions),
    };
}

export function buildTwoWeekRecordSummary({
    sessions,
    exerciseMap,
}: {
    sessions: SessionRecord[];
    exerciseMap: Map<string, RecordExerciseDisplayInfo>;
}): TwoWeekRecordSummary {
    const dates = Array.from({ length: 14 }, (_, index) => getDateKeyOffset(-(13 - index)));
    const dateSet = new Set(dates);
    const recentSessions = sessions.filter((session) => dateSet.has(session.date));
    const secondsByDate = new Map<string, number>();

    for (const date of dates) {
        secondsByDate.set(date, 0);
    }

    const timeBucketCounts = new Map<ReturnType<typeof getTimeBucket>, number>();
    const placementCounts = new Map<ExercisePlacement, number>();

    for (const session of recentSessions) {
        secondsByDate.set(session.date, (secondsByDate.get(session.date) ?? 0) + session.totalSeconds);

        const bucket = getTimeBucket(new Date(session.startedAt).getHours());
        timeBucketCounts.set(bucket, (timeBucketCounts.get(bucket) ?? 0) + 1);

        for (const [exerciseId, count] of Object.entries(getSessionExerciseCounts(session))) {
            const placement = exerciseMap.get(exerciseId)?.placement ?? 'stretch';
            placementCounts.set(placement, (placementCounts.get(placement) ?? 0) + count);
        }
    }

    const sortedTimeBuckets = Array.from(timeBucketCounts.entries())
        .sort((a, b) => b[1] - a[1]);
    const dominantTimeBucket = sortedTimeBuckets.length > 0 ? sortedTimeBuckets[0][0] : null;

    const sortedPlacements = Array.from(placementCounts.entries())
        .filter(([placement]) => placement !== 'rest')
        .sort((a, b) => b[1] - a[1]);
    const dominantPlacement = sortedPlacements.length > 0 ? sortedPlacements[0][0] : null;
    const totalMinutes = Math.floor(
        Array.from(secondsByDate.values()).reduce((sum, totalSeconds) => sum + totalSeconds, 0) / 60,
    );

    return {
        streak: calculateStreak(sessions),
        activeDays: dates.filter((date) => (secondsByDate.get(date) ?? 0) > 0).length,
        totalMinutes,
        dominantTimeLine: dominantTimeBucket
            ? `会いやすいのは ${getTimeBucketLabel(dominantTimeBucket)}みたい`
            : '会いやすいじかんは まだこれから',
        dominantPlacementLine: getPlacementTrendLabel(dominantPlacement),
        dots: dates.map((date) => {
            const parsed = parseDateKey(date);
            const weekdayIndex = parsed?.getDay() ?? 0;
            const minutes = Math.floor((secondsByDate.get(date) ?? 0) / 60);
            return {
                date,
                label: WEEKDAY_LABELS[weekdayIndex],
                minutes,
                level: getDotLevel(secondsByDate.get(date) ?? 0),
                isToday: date === dates[dates.length - 1],
            };
        }),
    };
}

export function buildRecordSuggestionSummary({
    sessions,
    exerciseMap,
}: {
    sessions: SessionRecord[];
    exerciseMap: Map<string, RecordExerciseDisplayInfo>;
}): RecordSuggestionSummary {
    const dates = new Set(Array.from({ length: 14 }, (_, index) => getDateKeyOffset(-(13 - index))));
    const recentSessions = sessions.filter((session) => dates.has(session.date));
    const availablePlacements = ACTIONABLE_PLACEMENTS.filter((placement) =>
        Array.from(exerciseMap.values()).some((exercise) => exercise.placement === placement),
    );
    const preferredDefaultPlacement = availablePlacements.includes('stretch')
        ? 'stretch'
        : availablePlacements[0] ?? 'stretch';
    const placementCounts = new Map<ExercisePlacement, number>();

    for (const placement of availablePlacements) {
        placementCounts.set(placement, 0);
    }

    for (const session of recentSessions) {
        for (const [exerciseId, count] of Object.entries(getSessionExerciseCounts(session))) {
            const placement = exerciseMap.get(exerciseId)?.placement ?? 'stretch';
            if (!placementCounts.has(placement)) {
                continue;
            }
            placementCounts.set(placement, (placementCounts.get(placement) ?? 0) + count);
        }
    }

    if (recentSessions.length === 0) {
        return {
            title: 'まずはひとつ、どう？',
            body: 'はじめやすい ストレッチからでも いいよ',
            ctaLabel: 'みてみる',
            suggestedPlacement: preferredDefaultPlacement,
        };
    }

    const sortedSuggestedPlacements = Array.from(placementCounts.entries())
        .sort((a, b) => {
            if (a[1] !== b[1]) {
                return a[1] - b[1];
            }

            const order = ['core', 'barre', 'ending', 'stretch'];
            return order.indexOf(a[0]) - order.indexOf(b[0]);
        });
    const suggestedPlacement = sortedSuggestedPlacements.length > 0
        ? sortedSuggestedPlacements[0][0]
        : preferredDefaultPlacement;

    switch (suggestedPlacement) {
    case 'stretch':
        return {
            title: 'ストレッチをひとつ、どう？',
            body: 'この2週間は まだ出番が少なめ',
            ctaLabel: 'みてみる',
            suggestedPlacement,
        };
    case 'barre':
        return {
            title: 'バーをひとつ、どう？',
            body: 'この2週間は まだ出番が少なめ',
            ctaLabel: 'みてみる',
            suggestedPlacement,
        };
    case 'ending':
        return {
            title: 'おわりをひとつ、どう？',
            body: 'この2週間は まだ出番が少なめ',
            ctaLabel: 'みてみる',
            suggestedPlacement,
        };
    case 'core':
    default:
        return {
            title: '体幹をひとつ、どう？',
            body: 'この2週間は まだ出番が少なめ',
            ctaLabel: 'みてみる',
            suggestedPlacement: 'core',
        };
    }
}

export function buildTopExerciseChips({
    sessions,
    exerciseMap,
}: {
    sessions: SessionRecord[];
    exerciseMap: Map<string, RecordExerciseDisplayInfo>;
}): RecordTopExerciseChip[] {
    const dates = new Set(Array.from({ length: 14 }, (_, index) => getDateKeyOffset(-(13 - index))));
    const recentSessions = sessions.filter((session) => dates.has(session.date));
    const counts = new Map<string, number>();

    for (const session of recentSessions) {
        for (const [exerciseId, count] of Object.entries(getSessionExerciseCounts(session))) {
            counts.set(exerciseId, (counts.get(exerciseId) ?? 0) + count);
        }
    }

    return Array.from(counts.entries())
        .map(([id, count]) => {
            const info = exerciseMap.get(id);
            if (!info) {
                return null;
            }
            return {
                id,
                name: info.name,
                emoji: info.emoji,
                count,
            };
        })
        .filter((item): item is RecordTopExerciseChip => item !== null)
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.name.localeCompare(b.name, 'ja');
        })
        .slice(0, 3);
}

export function buildRecordHistoryAccordionSections({
    historyDays,
    todayKey,
}: {
    historyDays: RecordSessionHistoryDay[];
    todayKey: string;
}): RecordHistoryAccordionSection[] {
    const currentWeekStart = getWeekStart(todayKey);
    const lastWeekStart = shiftDateKey(currentWeekStart, -7);

    const todayDays = historyDays.filter((day) => day.date === todayKey);
    const thisWeekDays = historyDays.filter((day) => (
        compareDateKey(day.date, currentWeekStart) >= 0
        && compareDateKey(day.date, todayKey) < 0
    ));
    const lastWeekDays = historyDays.filter((day) => (
        compareDateKey(day.date, lastWeekStart) >= 0
        && compareDateKey(day.date, currentWeekStart) < 0
    ));

    const buildSummaryLine = (
        days: RecordSessionHistoryDay[],
        options?: { includeDayCount?: boolean },
    ) => {
        if (days.length === 0) {
            return 'まだありません';
        }

        const totalSessions = days.reduce((sum, day) => sum + day.sessionCount, 0);
        const totalMinutes = Math.floor(days.reduce((sum, day) => sum + day.totalSeconds, 0) / 60);
        if (options?.includeDayCount) {
            return `${days.length}日 / ${totalSessions}回 / ${totalMinutes}分`;
        }
        return `${totalSessions}回 / ${totalMinutes}分`;
    };

    return [
        {
            id: 'today',
            label: '今日',
            summaryLine: buildSummaryLine(todayDays),
            emptyLine: '今日はまだ きろくがありません',
            days: todayDays,
            defaultExpanded: true,
        },
        {
            id: 'thisWeek',
            label: '今週',
            summaryLine: buildSummaryLine(thisWeekDays, { includeDayCount: true }),
            emptyLine: '今週ののこりは まだこれから',
            days: thisWeekDays,
            defaultExpanded: false,
        },
        {
            id: 'lastWeek',
            label: '先週',
            summaryLine: buildSummaryLine(lastWeekDays, { includeDayCount: true }),
            emptyLine: '先週のきろくは ありません',
            days: lastWeekDays,
            defaultExpanded: false,
        },
    ];
}
