import type { SessionRecord } from './db';
import { shiftDateKey } from './db';
import { getSessionExerciseCounts, hasCompletedPlannedExercises } from './sessionRecords';

export type ChallengeWindowType = 'calendar' | 'rolling';
export type ChallengeGoalType = 'total_count' | 'active_day';
export type ChallengeType = 'exercise' | 'menu';
export type ChallengeMenuSource = 'teacher' | 'preset';
export type ChallengeCountUnit = 'exercise_completion' | 'menu_completion';

export interface ChallengeEngineInput {
    challengeType: ChallengeType;
    exerciseId: string | null;
    targetMenuId: string | null;
    menuSource: ChallengeMenuSource | null;
    targetCount: number;
    dailyCap: number;
    countUnit: ChallengeCountUnit;
    startDate: string;
    endDate: string;
    windowType: ChallengeWindowType;
    goalType: ChallengeGoalType;
    windowDays: number | null;
}

export interface ChallengeProgressWindow {
    startDate: string;
    endDate: string;
}

export function getRollingWindowEndDate(startDate: string, windowDays: number): string {
    return shiftDateKey(startDate, Math.max(windowDays - 1, 0));
}

export function resolveChallengeWindow(
    challenge: Pick<ChallengeEngineInput, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
): ChallengeProgressWindow {
    if (challenge.windowType === 'rolling' && effectiveWindow) {
        return effectiveWindow;
    }

    return {
        startDate: challenge.startDate,
        endDate: challenge.endDate,
    };
}

export function getChallengeDaysLeft(endDateString: string, now = new Date()): number {
    const endDate = new Date(`${endDateString}T23:59:59`);
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function isChallengeWindowActive(
    window: ChallengeProgressWindow,
    today: string,
): boolean {
    return window.startDate <= today && window.endDate >= today;
}

export function isChallengeWindowPast(
    window: ChallengeProgressWindow,
    today: string,
): boolean {
    return window.endDate < today;
}

function sessionMatchesUsers(session: SessionRecord, userIds: string[]): boolean {
    if (!session.userIds || session.userIds.length === 0) {
        return true;
    }

    return session.userIds.some((userId) => userIds.includes(userId));
}

function sessionMatchesWindow(session: SessionRecord, window: ChallengeProgressWindow): boolean {
    return session.date >= window.startDate && session.date <= window.endDate;
}

export function countChallengeProgressFromSessions(
    challenge: ChallengeEngineInput,
    sessions: SessionRecord[],
    userIds: string[],
    window: ChallengeProgressWindow,
): number {
    if (challenge.goalType === 'active_day') {
        const activeDays = new Set<string>();

        for (const session of sessions) {
            if (!sessionMatchesWindow(session, window)) continue;
            if (!sessionMatchesUsers(session, userIds)) continue;

            if (challenge.challengeType === 'menu') {
                if (!challenge.targetMenuId || !challenge.menuSource) continue;
                if (session.sourceMenuId !== challenge.targetMenuId || session.sourceMenuSource !== challenge.menuSource) continue;
                if (!hasCompletedPlannedExercises(session)) continue;
                activeDays.add(session.date);
                continue;
            }

            if (!challenge.exerciseId) continue;
            if ((getSessionExerciseCounts(session)[challenge.exerciseId] ?? 0) > 0) {
                activeDays.add(session.date);
            }
        }

        return activeDays.size;
    }

    if (challenge.challengeType === 'menu') {
        if (!challenge.targetMenuId || !challenge.menuSource) {
            return 0;
        }

        const countsByDate = new Map<string, number>();

        for (const session of sessions) {
            if (!sessionMatchesWindow(session, window)) continue;
            if (!sessionMatchesUsers(session, userIds)) continue;
            if (session.sourceMenuId !== challenge.targetMenuId || session.sourceMenuSource !== challenge.menuSource) continue;
            if (!hasCompletedPlannedExercises(session)) continue;

            countsByDate.set(session.date, (countsByDate.get(session.date) ?? 0) + 1);
        }

        return [...countsByDate.values()].reduce((sum, count) => sum + Math.min(count, challenge.dailyCap), 0);
    }

    if (!challenge.exerciseId) {
        return 0;
    }

    const countsByDate = new Map<string, number>();

    for (const session of sessions) {
        if (!sessionMatchesWindow(session, window)) continue;
        if (!sessionMatchesUsers(session, userIds)) continue;

        const nextCount = (countsByDate.get(session.date) ?? 0) + (getSessionExerciseCounts(session)[challenge.exerciseId] ?? 0);
        countsByDate.set(session.date, nextCount);
    }

    let progress = 0;
    for (const count of countsByDate.values()) {
        progress += Math.min(count, challenge.dailyCap);
    }

    return progress;
}
