import type { SessionRecord } from '@/lib/db';
import type { ExercisePlacement } from '@/data/exercisePlacement';
import { toDisplayMinutes } from '../recordUtils';
import type { RecordSessionHistoryDay } from '../recordHistorySummary';
import type { RecordHistoryMonthCalendarCell } from './types';

export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export type TimeBucket = 'morning' | 'daytime' | 'evening' | 'night';

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getTimeBucket(hour: number): TimeBucket {
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

export function getTimeBucketLabel(bucket: TimeBucket): string {
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

export function getPlacementTrendLabel(placement: ExercisePlacement | null): string {
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

export function buildTodayRhythmLine(todaySessions: SessionRecord[]): string {
    if (todaySessions.length === 0) {
        return 'まだ これから';
    }

    const sortedBuckets = todaySessions
        .map((session) => getTimeBucket(new Date(session.startedAt).getHours()))
        .sort((a, b) => {
            const order: TimeBucket[] = ['morning', 'daytime', 'evening', 'night'];
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

export function getDotLevel(totalSeconds: number): 0 | 1 | 2 | 3 {
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

export function getMonthKey(dateKey: string): string {
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

export function shiftMonthKey(monthKey: string, offsetMonths: number): string {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
        return monthKey;
    }

    parsed.setMonth(parsed.getMonth() + offsetMonths);
    return formatMonthKey(parsed);
}

export function formatMonthLabel(monthKey: string): string {
    const parsed = parseMonthKey(monthKey);
    if (!parsed) {
        return monthKey;
    }

    return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月`;
}

export function buildMonthShortLabel(monthKey: string, currentMonthKey: string): string {
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

export function buildRecordHistoryMonthCalendarCells({
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
