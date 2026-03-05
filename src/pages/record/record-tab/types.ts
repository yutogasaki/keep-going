import type { SessionRecord } from '../../../lib/db';

export interface TopExercise {
    id: string;
    count: number;
    name?: string;
    emoji?: string;
}

export interface RecordTabContentProps {
    loading: boolean;
    sessions: SessionRecord[];
    groupedEntries: [string, SessionRecord[]][];
    todaySessions: SessionRecord[];
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
