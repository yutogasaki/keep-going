import { EXERCISES } from '../../data/exercises';
import { PRESET_GROUPS } from '../../data/menuGroups';
import {
    getChallengeDaysLeft as getDaysLeftFromWindowEnd,
    getRollingWindowEndDate,
    resolveChallengeWindow,
    type ChallengeProgressWindow,
} from '../challenge-engine';
import { getTodayKey } from '../db';
import type { TeacherExercise } from '../teacherContent';
import { CANONICAL_TERMS } from '../terminology';
import type { Challenge, ChallengeAttempt, ChallengeEnrollment, ChallengeEnrollmentState } from './types';

export function getChallengeExercise(challenge: Challenge, teacherExercises: TeacherExercise[] = []) {
    return challenge.exerciseId
        ? EXERCISES.find((item) => item.id === challenge.exerciseId)
            ?? teacherExercises.find((item) => item.id === challenge.exerciseId)
            ?? null
        : null;
}

export function getChallengeEmoji(challenge: Challenge, teacherExercises: TeacherExercise[] = []): string {
    if (challenge.challengeType === 'duration') {
        return challenge.iconEmoji ?? '⏱️';
    }

    return challenge.iconEmoji ?? getChallengeExercise(challenge, teacherExercises)?.emoji ?? '🎯';
}

export function getChallengeTargetLabel(challenge: Challenge, teacherExercises: TeacherExercise[] = []): string {
    if (challenge.challengeType === 'duration') {
        return `1日${Math.max(1, challenge.dailyMinimumMinutes ?? 3)}分以上`;
    }

    if (challenge.challengeType === 'menu') {
        if (challenge.menuSource === 'preset' && challenge.targetMenuId) {
            return PRESET_GROUPS.find((group) => group.id === challenge.targetMenuId)?.name ?? CANONICAL_TERMS.menu;
        }

        return challenge.menuSource === 'teacher' ? CANONICAL_TERMS.teacherMenu : CANONICAL_TERMS.menu;
    }

    return getChallengeExercise(challenge, teacherExercises)?.name ?? challenge.exerciseId ?? CANONICAL_TERMS.exercise;
}

export function getChallengeRewardLabel(challenge: Challenge): string {
    return challenge.rewardKind === 'star'
        ? `ほし ${challenge.rewardValue}こ`
        : 'メダル';
}

export function canRetryTeacherChallenge(
    challenge: Pick<Challenge, 'publishMode' | 'publishStartDate' | 'publishEndDate' | 'startDate' | 'endDate' | 'windowType'>,
    date = getTodayKey(),
): boolean {
    if (challenge.windowType !== 'rolling') {
        return false;
    }

    return challenge.publishMode === 'always_on' || isChallengePublishedOnDate(challenge, date);
}

export function getChallengeGoalTarget(
    challenge: Pick<Challenge, 'goalType' | 'requiredDays' | 'targetCount'>,
): number {
    if (challenge.goalType === 'active_day') {
        return Math.max(1, challenge.requiredDays ?? challenge.targetCount);
    }

    return Math.max(1, challenge.targetCount);
}

export function getChallengeGoalLabel(
    challenge: Pick<Challenge, 'goalType' | 'requiredDays' | 'targetCount'>,
    targetLabel: string,
): string {
    const goalTarget = getChallengeGoalTarget(challenge);
    return challenge.goalType === 'active_day'
        ? `${targetLabel}を${goalTarget}日`
        : `${targetLabel}を${goalTarget}回`;
}

export function getChallengeProgressLabel(
    challenge: Pick<Challenge, 'goalType' | 'requiredDays' | 'targetCount'>,
    progress: number,
): string {
    const goalTarget = getChallengeGoalTarget(challenge);
    return challenge.goalType === 'active_day'
        ? `${progress} / ${goalTarget}日`
        : `${progress} / ${goalTarget}回`;
}

export function getChallengeDailyCapLabel(challenge: Challenge): string {
    if (challenge.goalType === 'active_day') {
        return challenge.challengeType === 'duration'
            ? '休憩をのぞいた時間でカウント'
            : '1日1回でカウント';
    }

    return `1日 ${challenge.dailyCap}回まで`;
}

export function createRollingChallengeWindow(
    challenge: Pick<Challenge, 'windowDays'>,
    startDate = getTodayKey(),
    joinedAt?: string | null,
): ChallengeProgressWindow {
    const resolvedWindowDays = Math.max(1, challenge.windowDays ?? 7);

    return {
        startDate,
        endDate: getRollingWindowEndDate(startDate, resolvedWindowDays),
        ...(joinedAt ? { joinedAt } : {}),
    };
}

export function getChallengeActiveWindow(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
): ChallengeProgressWindow {
    return resolveChallengeWindow(challenge, effectiveWindow);
}

export function getChallengePeriodLabel(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
): string {
    if (challenge.windowType === 'rolling' && !effectiveWindow) {
        return `参加してから${Math.max(1, challenge.windowDays ?? 7)}日`;
    }

    const window = getChallengeActiveWindow(challenge, effectiveWindow);
    return `${window.startDate} 〜 ${window.endDate}`;
}

export function getChallengePublishWindow(
    challenge: Pick<Challenge, 'publishMode' | 'publishStartDate' | 'publishEndDate' | 'startDate' | 'endDate'>,
): ChallengeProgressWindow | null {
    if (challenge.publishMode === 'always_on') {
        return null;
    }

    return {
        startDate: challenge.publishStartDate ?? challenge.startDate,
        endDate: challenge.publishEndDate ?? challenge.endDate,
    };
}

export function getChallengePublishLabel(
    challenge: Pick<Challenge, 'publishMode' | 'publishStartDate' | 'publishEndDate' | 'startDate' | 'endDate'>,
): string {
    if (challenge.publishMode === 'always_on') {
        return 'いつでもチャレンジ';
    }

    const publishWindow = getChallengePublishWindow(challenge);
    if (!publishWindow) {
        return 'いつでもチャレンジ';
    }

    const [startYear, startMonth, startDay] = publishWindow.startDate.split('-');
    const [, endMonth, endDay] = publishWindow.endDate.split('-');
    void startYear;

    return startMonth === endMonth
        ? `${Number(endMonth)}/${Number(endDay)}までの今だけチャレンジ`
        : `${Number(startMonth)}/${Number(startDay)}〜${Number(endMonth)}/${Number(endDay)}の今だけチャレンジ`;
}

export function getChallengeInviteWindowLabel(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
): string {
    if (challenge.windowType === 'rolling') {
        return `参加すると 今日から${Math.max(1, challenge.windowDays ?? 7)}日`;
    }

    const [startYear, startMonth, startDay] = challenge.startDate.split('-');
    const [, endMonth, endDay] = challenge.endDate.split('-');
    void startYear;

    return startMonth === endMonth
        ? `${Number(endMonth)}/${Number(endDay)}まで`
        : `${Number(startMonth)}/${Number(startDay)}〜${Number(endMonth)}/${Number(endDay)}`;
}

export function getChallengeDeadlineLabel(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    effectiveWindow?: ChallengeProgressWindow | null,
    now = new Date(),
): string {
    if (challenge.windowType === 'rolling' && !effectiveWindow) {
        return `参加すると 今日から${Math.max(1, challenge.windowDays ?? 7)}日`;
    }

    const window = getChallengeActiveWindow(challenge, effectiveWindow);
    const daysLeft = getDaysLeftFromWindowEnd(window.endDate, now);
    return challenge.windowType === 'rolling'
        ? `あと${daysLeft}日`
        : getChallengeInviteWindowLabel(challenge);
}

export function isChallengePublishedOnDate(
    challenge: Pick<Challenge, 'publishMode' | 'publishStartDate' | 'publishEndDate' | 'startDate' | 'endDate'>,
    date: string,
): boolean {
    if (challenge.publishMode === 'always_on') {
        return true;
    }

    const publishWindow = getChallengePublishWindow(challenge);
    if (!publishWindow) {
        return true;
    }

    return publishWindow.startDate <= date && publishWindow.endDate >= date;
}

export function isChallengeDoneForToday(
    challenge: Pick<Challenge, 'goalType' | 'dailyCap'>,
    todayProgress: number,
): boolean {
    if (challenge.goalType === 'active_day') {
        return todayProgress >= 1;
    }

    return todayProgress >= Math.max(1, challenge.dailyCap);
}

export function isChallengeFinishedOverall(
    activeUserIds: string[],
    completedUserIds: Set<string>,
): boolean {
    return activeUserIds.length > 0
        && activeUserIds.every((userId) => completedUserIds.has(userId));
}

export function isChallengePastForUsers(
    challenge: Pick<Challenge, 'startDate' | 'endDate' | 'windowDays' | 'windowType'>,
    today: string,
    effectiveWindow?: ChallengeProgressWindow | null,
): boolean {
    if (challenge.windowType === 'rolling' && !effectiveWindow) {
        return false;
    }

    const activeWindow = getChallengeActiveWindow(challenge, effectiveWindow);
    return activeWindow.endDate < today;
}

export function buildChallengeEnrollmentState(
    enrollments: ChallengeEnrollment[],
): ChallengeEnrollmentState {
    const joinedChallengeIds: Record<string, string[]> = {};
    const challengeEnrollmentWindows: Record<string, Record<string, ChallengeProgressWindow>> = {};

    for (const enrollment of enrollments) {
        joinedChallengeIds[enrollment.memberId] = [
            ...(joinedChallengeIds[enrollment.memberId] ?? []),
            enrollment.challengeId,
        ];
            challengeEnrollmentWindows[enrollment.memberId] = {
                ...(challengeEnrollmentWindows[enrollment.memberId] ?? {}),
                [enrollment.challengeId]: {
                    startDate: enrollment.effectiveStartDate,
                    endDate: enrollment.effectiveEndDate,
                    joinedAt: enrollment.joinedAt,
                },
            };
        }

    return {
        joinedChallengeIds,
        challengeEnrollmentWindows,
    };
}

export function getLatestChallengeAttempts(
    attempts: ChallengeAttempt[],
): Map<string, ChallengeAttempt> {
    const latestAttempts = new Map<string, ChallengeAttempt>();

    for (const attempt of attempts) {
        const current = latestAttempts.get(attempt.memberId);
        if (!current || attempt.attemptNo > current.attemptNo) {
            latestAttempts.set(attempt.memberId, attempt);
        }
    }

    return latestAttempts;
}

export function getChallengeRetryStats(attempts: ChallengeAttempt[]) {
    const latestAttempts = getLatestChallengeAttempts(attempts);
    const retryingMemberCount = [...latestAttempts.values()].filter(
        (attempt) => attempt.attemptNo > 1 && attempt.status === 'active',
    ).length;
    const repeatCompletionCount = attempts.filter(
        (attempt) => attempt.attemptNo > 1 && attempt.status === 'completed',
    ).length;

    return {
        totalAttempts: attempts.length,
        retryingMemberCount,
        repeatCompletionCount,
        latestAttempts,
    };
}

function normalizeChallengeText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

export function getChallengeCardText(challenge: Pick<Challenge, 'title' | 'summary' | 'description'>): string | null {
    const summary = normalizeChallengeText(challenge.summary);
    if (summary && summary !== challenge.title) {
        return summary;
    }

    const description = normalizeChallengeText(challenge.description);
    if (description && description !== challenge.title) {
        return description;
    }

    return null;
}

export function getChallengeHeaderText(challenge: Pick<Challenge, 'title' | 'summary'>): string | null {
    const summary = normalizeChallengeText(challenge.summary);
    return summary && summary !== challenge.title ? summary : null;
}

export function getChallengeDescriptionText(
    challenge: Pick<Challenge, 'summary' | 'description'>,
): string | null {
    const description = normalizeChallengeText(challenge.description);
    const summary = normalizeChallengeText(challenge.summary);

    if (!description) {
        return null;
    }

    return description !== summary ? description : null;
}
