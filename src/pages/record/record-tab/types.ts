import type { SessionRecord } from '../../../lib/db';
import type { RecordSessionHistoryDay } from '../recordHistorySummary';

export interface TopExercise {
    id: string;
    count: number;
    name?: string;
    emoji?: string;
}

export interface RecordTabContentProps {
    loading: boolean;
    sessions: SessionRecord[];
    sessionsCount: number;
    historyDays: RecordSessionHistoryDay[];
    todaySessionsCount: number;
    todayExerciseCount: number;
    todayMinutes: number;
    progressPercent: number;
    ringRadius: number;
    ringCircumference: number;
    ringOffset: number;
    totalSessions: number;
    totalMinutes: number;
    uniqueDays: number;
    topExercises: TopExercise[];
}
