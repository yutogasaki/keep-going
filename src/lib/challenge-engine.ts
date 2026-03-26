import type { SessionRecord } from './db';
import { shiftDateKey } from './db';
import { getSessionExerciseCounts, hasCompletedPlannedExercises } from './sessionRecords';

export type ChallengeWindowType = 'calendar' | 'rolling';
export type ChallengeGoalType = 'total_count' | 'active_day';
export type ChallengeType = 'exercise' | 'menu' | 'duration';
export type ChallengeMenuSource = 'teacher' | 'preset' | 'custom' | 'public';
export type ChallengeCountUnit = 'exercise_completion' | 'menu_completion';

export interface ChallengeGoalTargetInput {
    goalType: ChallengeGoalType;
    requiredDays?: number | null;
    targetCount: number;
}

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
    dailyMinimumMinutes: number | null;
}

export interface ChallengeEngineSource extends ChallengeGoalTargetInput {
    challengeType: ChallengeType;
    exerciseId: string | null;
    targetMenuId: string | null;
    menuSource: ChallengeMenuSource | null;
    dailyCap: number;
    countUnit: ChallengeCountUnit;
    startDate: string;
    endDate: string;
    windowType: ChallengeWindowType;
    windowDays: number | null;
    dailyMinimumMinutes: number | null;
}

export interface ChallengeProgressWindow {
    startDate: string;
    endDate: string;
    joinedAt?: string | null;
}

export function getChallengeGoalTarget(challenge: ChallengeGoalTargetInput): number {
    if (challenge.goalType === 'active_day') {
        return Math.max(1, challenge.requiredDays ?? challenge.targetCount);
    }

    return Math.max(1, challenge.targetCount);
}

export function buildChallengeEngineInput(challenge: ChallengeEngineSource): ChallengeEngineInput {
    return {
        challengeType: challenge.challengeType,
        exerciseId: challenge.exerciseId,
        targetMenuId: challenge.targetMenuId,
        menuSource: challenge.menuSource,
        targetCount: getChallengeGoalTarget(challenge),
        dailyCap: Math.max(1, challenge.dailyCap),
        countUnit: challenge.countUnit,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        windowType: challenge.windowType,
        goalType: challenge.goalType,
        windowDays: challenge.windowDays,
        dailyMinimumMinutes: challenge.dailyMinimumMinutes,
    };
}

export function getRollingWindowEndDate(startDate: string, windowDays: number): string {
    return shiftDateKey(startDate, Math.max(windowDays - 1, 0));
}

export function createRollingChallengeWindow(
    challenge: Pick<ChallengeEngineSource, 'windowDays'>,
    startDate: string,
    joinedAt?: string | null,
): ChallengeProgressWindow {
    return {
        startDate,
        endDate: getRollingWindowEndDate(startDate, Math.max(challenge.windowDays ?? 7, 1)),
        ...(joinedAt ? { joinedAt } : {}),
    };
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
        joinedAt: effectiveWindow?.joinedAt ?? null,
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
    if (session.date < window.startDate || session.date > window.endDate) {
        return false;
    }

    if (!window.joinedAt) {
        return true;
    }

    const joinedDate = getChallengeDateKeyFromTimestamp(window.joinedAt);
    if (!joinedDate) {
        return true;
    }

    if (session.date < joinedDate) {
        return false;
    }

    if (session.date > joinedDate) {
        return true;
    }

    const sessionStart = Date.parse(session.startedAt);
    const joinedAt = Date.parse(window.joinedAt);
    if (Number.isNaN(sessionStart) || Number.isNaN(joinedAt)) {
        return true;
    }

    return sessionStart >= joinedAt;
}

function getChallengeDateKeyFromTimestamp(timestamp: string): string | null {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    const adjusted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
    const year = adjusted.getFullYear();
    const month = String(adjusted.getMonth() + 1).padStart(2, '0');
    const day = String(adjusted.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function countChallengeProgressFromSessions(
    challenge: ChallengeEngineInput,
    sessions: SessionRecord[],
    userIds: string[],
    window: ChallengeProgressWindow,
): number {
    if (challenge.goalType === 'active_day') {
        if (challenge.challengeType === 'duration') {
            const thresholdSeconds = Math.max(1, challenge.dailyMinimumMinutes ?? 1) * 60;
            const secondsByDate = new Map<string, number>();

            for (const session of sessions) {
                if (!sessionMatchesWindow(session, window)) continue;
                if (!sessionMatchesUsers(session, userIds)) continue;

                secondsByDate.set(session.date, (secondsByDate.get(session.date) ?? 0) + session.totalSeconds);
            }

            return [...secondsByDate.values()].filter((seconds) => seconds >= thresholdSeconds).length;
        }

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
