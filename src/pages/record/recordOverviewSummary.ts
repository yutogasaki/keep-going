import {
    calculateStreak,
    getDateKeyOffset,
    parseDateKey,
    type SessionRecord,
} from '../../lib/db';
import { getSessionCompletedExerciseTotal, getSessionExerciseCounts } from '../../lib/sessionRecords';
import {
    buildPlannedItemExerciseMap,
    type ExerciseDisplayInfo,
    type RecordSessionHistoryDay,
} from './recordHistorySummary';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import { toDisplayMinutes } from './recordUtils';

export type RecordExerciseDisplayInfo = ExerciseDisplayInfo;

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
    targetTab: 'group' | 'individual';
}

export interface RecordTopExerciseChip {
    id: string;
    name: string;
    emoji: string;
    count: number;
    exerciseSource?: 'standard' | 'teacher' | 'custom';
}

export interface RecordHistoryMonthSection {
    id: string;
    label: string;
    monthLabel: string;
    dayCount: number;
    sessionCount: number;
    totalMinutes: number;
    summaryLine: string;
    emptyLine: string;
    calendarCells: RecordHistoryMonthCalendarCell[];
    days: RecordSessionHistoryDay[];
    defaultExpanded: boolean;
}

export interface RecordHistoryMonthCalendarCell {
    id: string;
    date: string;
    label: string;
    minutes: number;
    sessionCount: number;
    level: 0 | 1 | 2 | 3;
    isCurrentMonth: boolean;
    isToday: boolean;
    hasRecord: boolean;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
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

function getMonthKey(dateKey: string): string {
    return dateKey.slice(0, 7);
}

function parseMonthKey(monthKey: string): Date | null {
    const match = /^(\d{4})-(\d{2})$/.exec(monthKey);
    if (!match) {
        return null;
    }

    return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function formatMonthKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMondayStartWeekdayIndex(date: Date): number {
    return (date.getDay() + 6) % 7;
}

function shiftMonthKey(monthKey: string, offsetMonths: number): string {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
        return monthKey;
    }

    parsed.setMonth(parsed.getMonth() + offsetMonths);
    return formatMonthKey(parsed);
}

function formatMonthLabel(monthKey: string): string {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
        return monthKey;
    }

    return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月`;
}

function buildMonthShortLabel(monthKey: string, currentMonthKey: string): string {
    if (monthKey === currentMonthKey) {
        return '今月';
    }

    if (monthKey === shiftMonthKey(currentMonthKey, -1)) {
        return '先月';
    }

    const parsed = parseMonthKey(monthKey);
    const currentParsed = parseMonthKey(currentMonthKey);
    if (!parsed || !currentParsed) {
        return monthKey;
    }

    if (parsed.getFullYear() === currentParsed.getFullYear()) {
        return `${parsed.getMonth() + 1}月`;
    }

    return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月`;
}

function buildRecordHistoryMonthCalendarCells({
    monthKey,
    days,
    todayKey,
}: {
    monthKey: string;
    days: RecordSessionHistoryDay[];
    todayKey: string;
}): RecordHistoryMonthCalendarCell[] {
    const monthStart = parseMonthKey(monthKey);
    if (!monthStart) {
        return [];
    }

    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const daysByDate = new Map(days.map((day) => [day.date, day]));
    const leadingOffset = getMondayStartWeekdayIndex(monthStart);
    const trailingOffset = 6 - getMondayStartWeekdayIndex(monthEnd);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - leadingOffset);
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + trailingOffset);

    const cells: RecordHistoryMonthCalendarCell[] = [];
    const current = new Date(gridStart);

    while (current <= gridEnd) {
        const dateKey = formatDateKey(current);
        const day = daysByDate.get(dateKey);
        const isCurrentMonth = dateKey.startsWith(monthKey);
        const totalSeconds = day?.totalSeconds ?? 0;

        cells.push({
            id: `${monthKey}:${dateKey}`,
            date: dateKey,
            label: String(current.getDate()),
            minutes: toDisplayMinutes(totalSeconds),
            sessionCount: day?.sessionCount ?? 0,
            level: getDotLevel(totalSeconds),
            isCurrentMonth,
            isToday: dateKey === todayKey,
            hasRecord: Boolean(day),
        });

        current.setDate(current.getDate() + 1);
    }

    return cells;
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
