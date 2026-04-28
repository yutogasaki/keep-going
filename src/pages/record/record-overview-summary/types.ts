import type { ExerciseDisplayInfo, RecordSessionHistoryDay } from '../recordHistorySummary';

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
