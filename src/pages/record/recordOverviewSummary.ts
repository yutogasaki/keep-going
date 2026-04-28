import {
    calculateStreak,
    getDateKeyOffset,
    parseDateKey,
    type SessionRecord,
} from '@/lib/db';
import { getSessionCompletedExerciseTotal, getSessionExerciseCounts } from '@/lib/sessionRecords';
import {
    buildPlannedItemExerciseMap,
    type RecordSessionHistoryDay,
} from './recordHistorySummary';
import type { ExercisePlacement } from '@/data/exercisePlacement';
import { toDisplayMinutes } from './recordUtils';
import {
    buildMonthShortLabel,
    buildRecordHistoryMonthCalendarCells,
    buildTodayRhythmLine,
    formatMonthLabel,
    formatTime,
    getDotLevel,
    getMonthKey,
    getPlacementTrendLabel,
    getTimeBucket,
    getTimeBucketLabel,
    shiftMonthKey,
    WEEKDAY_LABELS,
} from './record-overview-summary/helpers';
import type {
    RecordExerciseDisplayInfo,
    RecordHistoryMonthSection,
    RecordSuggestionSummary,
    RecordTopExerciseChip,
    TodayRecordSummary,
    TwoWeekRecordSummary,
} from './record-overview-summary/types';

export type {
    RecordExerciseDisplayInfo,
    RecordHistoryMonthCalendarCell,
    RecordHistoryMonthSection,
    RecordSuggestionSummary,
    RecordTopExerciseChip,
    TodayRecordSummary,
    TwoWeekActivityDot,
    TwoWeekRecordSummary,
} from './record-overview-summary/types';

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
        minutes: toDisplayMinutes(totalSeconds),
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
        const plannedItemMap = buildPlannedItemExerciseMap(session);

        for (const [exerciseId, count] of Object.entries(getSessionExerciseCounts(session))) {
            const placement = plannedItemMap.get(exerciseId)?.placement
                ?? exerciseMap.get(exerciseId)?.placement
                ?? 'stretch';
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
    const totalMinutes = toDisplayMinutes(
        Array.from(secondsByDate.values()).reduce((sum, totalSeconds) => sum + totalSeconds, 0),
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
            const minutes = toDisplayMinutes(secondsByDate.get(date) ?? 0);
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
    todaySummary,
    quickMenuName,
}: {
    sessions: SessionRecord[];
    todaySummary: TodayRecordSummary;
    quickMenuName: string | null;
}): RecordSuggestionSummary {
    const dates = new Set(Array.from({ length: 14 }, (_, index) => getDateKeyOffset(-(13 - index))));
    const recentSessions = sessions.filter((session) => dates.has(session.date));
    const recentMenuCandidates = new Map<string, { name: string; count: number; lastStartedAt: string }>();
    for (const session of recentSessions) {
        if (!session.sourceMenuName) {
            continue;
        }

        const key = `${session.sourceMenuSource ?? 'unknown'}:${session.sourceMenuId ?? session.sourceMenuName}`;
        const existing = recentMenuCandidates.get(key);
        if (existing) {
            existing.count += 1;
            if (session.startedAt > existing.lastStartedAt) {
                existing.lastStartedAt = session.startedAt;
            }
            continue;
        }

        recentMenuCandidates.set(key, {
            name: session.sourceMenuName,
            count: 1,
            lastStartedAt: session.startedAt,
        });
    }

    const familiarMenu = Array.from(recentMenuCandidates.values())
        .sort((left, right) => {
            if (right.count !== left.count) {
                return right.count - left.count;
            }
            if (right.lastStartedAt !== left.lastStartedAt) {
                return right.lastStartedAt.localeCompare(left.lastStartedAt);
            }
            return left.name.localeCompare(right.name, 'ja');
        })[0] ?? null;

    if (todaySummary.sessionCount === 0) {
        return {
            title: 'まずはやってみよう',
            body: quickMenuName
                ? `「${quickMenuName}」からでも いいよ`
                : '短めのメニューからでも いいよ',
            ctaLabel: 'メニューをみる',
            targetTab: 'group',
        };
    }

    if (todaySummary.remainingMinutes > 0) {
        return {
            title: todaySummary.remainingMinutes <= 3
                ? `あと${todaySummary.remainingMinutes}分だけ やってみる？`
                : 'もうすこしやってみる？',
            body: quickMenuName
                ? `「${quickMenuName}」みたいな 短めメニューが合いそう`
                : '短めのメニューなら つづけやすいよ',
            ctaLabel: 'メニューをみる',
            targetTab: 'group',
        };
    }

    if (familiarMenu) {
        return {
            title: `「${familiarMenu.name}」どう？`,
            body: '最近よく会うメニューだよ',
            ctaLabel: 'メニューをみる',
            targetTab: 'group',
        };
    }

    return {
        title: 'メニューをのぞいてみる？',
        body: '次にやるときのメニューを 見ておくのもよさそう',
        ctaLabel: 'メニューをみる',
        targetTab: 'group',
    };
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
        const plannedItemMap = buildPlannedItemExerciseMap(session);
        for (const [exerciseId, count] of Object.entries(getSessionExerciseCounts(session))) {
            if (plannedItemMap.get(exerciseId)?.isInline) {
                continue;
            }
            counts.set(exerciseId, (counts.get(exerciseId) ?? 0) + count);
        }
    }

    const chips: RecordTopExerciseChip[] = [];

    for (const [id, count] of Array.from(counts.entries())) {
        const info = exerciseMap.get(id);
        if (!info) {
            continue;
        }

        chips.push({
            id,
            name: info.name,
            emoji: info.emoji,
            count,
            exerciseSource: info.source ?? 'standard',
        });
    }

    return chips
        .sort((a, b) => {
            if (b.count !== a.count) {
                return b.count - a.count;
            }
            return a.name.localeCompare(b.name, 'ja');
        })
        .slice(0, 3);
}

export function buildRecordHistoryMonthSections({
    historyDays,
    todayKey,
}: {
    historyDays: RecordSessionHistoryDay[];
    todayKey: string;
}): RecordHistoryMonthSection[] {
    const currentMonthKey = getMonthKey(todayKey);
    const previousMonthKey = shiftMonthKey(currentMonthKey, -1);
    const monthKeys = Array.from(new Set([
        currentMonthKey,
        previousMonthKey,
        ...historyDays.map((day) => getMonthKey(day.date)),
    ])).sort((left, right) => right.localeCompare(left));

    return monthKeys.map((monthKey) => {
        const days = historyDays
            .filter((day) => getMonthKey(day.date) === monthKey)
            .sort((left, right) => right.date.localeCompare(left.date));
        const dayCount = days.length;
        const sessionCount = days.reduce((sum, day) => sum + day.sessionCount, 0);
        const totalMinutes = toDisplayMinutes(days.reduce((sum, day) => sum + day.totalSeconds, 0));
        const monthLabel = formatMonthLabel(monthKey);

        return {
            id: monthKey,
            label: buildMonthShortLabel(monthKey, currentMonthKey),
            monthLabel,
            dayCount,
            sessionCount,
            totalMinutes,
            summaryLine: dayCount === 0
                ? 'まだありません'
                : `${dayCount}日 / ${sessionCount}回 / ${totalMinutes}分`,
            emptyLine: `${monthLabel}のきろくは ありません`,
            calendarCells: buildRecordHistoryMonthCalendarCells({
                monthKey,
                days,
                todayKey,
            }),
            days,
            defaultExpanded: monthKey === currentMonthKey,
        };
    });
}
