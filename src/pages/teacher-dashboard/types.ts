import type { StudentSession } from '../../lib/teacher';

export interface IndividualStudent {
    memberId: string;
    name: string;
    classLevel: string;
    avatarUrl?: string;
    accountId: string;
    sessions: StudentSession[];
    streak: number;
    totalSessions: number;
    lastActiveDate: string | null;
}

export interface WeeklyStats {
    activeCount: number;
    totalMinutes: number;
    totalSessions: number;
    rate: number;
    dailyActivity: Array<{
        dateKey: string;
        label: string;
        count: number;
        isToday: boolean;
    }>;
}
