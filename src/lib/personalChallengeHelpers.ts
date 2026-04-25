import { getAllSessions, getTodayKey } from './db';
import {
    buildChallengeEngineInput,
    countChallengeProgressFromSessions,
    createRollingChallengeWindow,
    getChallengeDaysLeft,
    getChallengeGoalTarget,
    type ChallengeCountUnit,
    type ChallengeGoalType,
    type ChallengeMenuSource,
    type ChallengeProgressWindow,
    type ChallengeType,
} from './challenge-engine';
import type {
    PersonalChallenge,
    PersonalChallengeCreateInput,
    PersonalChallengeInsert,
    PersonalChallengeRow,
    PersonalChallengeSetupPatch,
    PersonalChallengeStatus,
    PersonalChallengeUpdate,
} from './personalChallengeTypes';

export const PERSONAL_CHALLENGE_ACTIVE_LIMIT = 3;
export const PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR = 'PERSONAL_CHALLENGE_LIMIT_REACHED';
export const PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR = 'PERSONAL_CHALLENGE_ACCOUNT_REQUIRED';
export const PERSONAL_CHALLENGE_PAST_STATUSES: PersonalChallengeStatus[] = [
    'completed',
    'ended_manual',
    'ended_expired',
];

function normalizeChallengeType(value: string | null | undefined): ChallengeType {
    return value === 'menu' ? 'menu' : 'exercise';
}

function normalizeMenuSource(value: string | null | undefined): ChallengeMenuSource | null {
    return value === 'teacher' || value === 'preset' || value === 'custom' || value === 'public' ? value : null;
}

function normalizeCountUnit(value: string | null | undefined, challengeType: ChallengeType): ChallengeCountUnit {
    if (value === 'menu_completion' || value === 'exercise_completion') {
        return value;
    }

    return challengeType === 'menu' ? 'menu_completion' : 'exercise_completion';
}

function normalizeGoalType(value: string | null | undefined): ChallengeGoalType {
    return value === 'total_count' ? 'total_count' : 'active_day';
}

function normalizePersonalChallengeStatus(value: string | null | undefined): PersonalChallengeStatus {
    return value === 'completed' || value === 'ended_manual' || value === 'ended_expired' ? value : 'active';
}

export function createPersonalChallengeWindow(effectiveStartDate: string, windowDays: number): ChallengeProgressWindow {
    return createRollingChallengeWindow({ windowDays }, effectiveStartDate);
}

export function getPersonalChallengeGoalTarget(
    challenge: Pick<PersonalChallenge, 'goalType' | 'requiredDays' | 'targetCount'>,
): number {
    return getChallengeGoalTarget(challenge);
}

export function isPersonalChallengeLimitReached(activeCount: number): boolean {
    return activeCount >= PERSONAL_CHALLENGE_ACTIVE_LIMIT;
}

export function getRemainingPersonalChallengeSlots(activeCount: number): number {
    return Math.max(PERSONAL_CHALLENGE_ACTIVE_LIMIT - activeCount, 0);
}

export function getPersonalChallengeDaysLeft(
    challenge: Pick<PersonalChallenge, 'effectiveEndDate'>,
    now = new Date(),
): number {
    return getChallengeDaysLeft(challenge.effectiveEndDate, now);
}

export function canDeletePersonalChallenge(challenge: Pick<PersonalChallenge, 'status'>, progress: number): boolean {
    return challenge.status === 'active' && progress === 0;
}

export function toPersonalChallengeEngineInput(challenge: PersonalChallenge) {
    return buildChallengeEngineInput({
        challengeType: challenge.challengeType,
        exerciseId: challenge.exerciseId,
        targetMenuId: challenge.targetMenuId,
        menuSource: challenge.menuSource,
        targetCount: challenge.targetCount,
        dailyCap: challenge.dailyCap,
        countUnit: challenge.countUnit,
        startDate: challenge.effectiveStartDate,
        endDate: challenge.effectiveEndDate,
        windowType: 'rolling' as const,
        goalType: challenge.goalType,
        requiredDays: challenge.requiredDays,
        windowDays: challenge.windowDays,
        dailyMinimumMinutes: null,
    });
}

export function mapPersonalChallenge(row: PersonalChallengeRow): PersonalChallenge {
    const challengeType = normalizeChallengeType(row.challenge_type);
    const goalType = normalizeGoalType(row.goal_type);

    return {
        id: row.id,
        accountId: row.account_id,
        memberId: row.member_id,
        title: row.title,
        summary: row.summary ?? null,
        description: row.description ?? null,
        challengeType,
        exerciseId: row.target_exercise_id ?? null,
        targetMenuId: row.target_menu_id ?? null,
        menuSource: normalizeMenuSource(row.menu_source),
        targetCount: Math.max(1, row.target_count),
        dailyCap: Math.max(1, row.daily_cap),
        countUnit: normalizeCountUnit(row.count_unit, challengeType),
        goalType,
        windowDays: Math.max(1, row.window_days),
        requiredDays:
            goalType === 'active_day'
                ? Math.max(1, row.required_days ?? row.target_count)
                : (row.required_days ?? null),
        startedAt: row.started_at,
        effectiveStartDate: row.effective_start_date,
        effectiveEndDate: row.effective_end_date,
        status: normalizePersonalChallengeStatus(row.status),
        iconEmoji: row.icon_emoji ?? null,
        rewardKind: 'star',
        rewardValue: 1,
        rewardGrantedAt: row.reward_granted_at ?? null,
        completedAt: row.completed_at ?? null,
        endedAt: row.ended_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toPersonalChallengeInsertRow(
    input: PersonalChallengeCreateInput,
    accountId: string,
): PersonalChallengeInsert {
    const effectiveStartDate = input.effectiveStartDate ?? getTodayKey();
    const effectiveWindow = createPersonalChallengeWindow(effectiveStartDate, input.windowDays);
    const challengeType = input.challengeType;
    const goalType = input.goalType ?? 'active_day';
    const targetCount = getChallengeGoalTarget({
        goalType,
        requiredDays: input.requiredDays ?? null,
        targetCount: input.targetCount ?? 1,
    });

    return {
        account_id: accountId,
        member_id: input.memberId,
        title: input.title,
        summary: input.summary ?? null,
        description: input.description ?? null,
        challenge_type: challengeType,
        target_exercise_id: challengeType === 'exercise' ? (input.exerciseId ?? null) : null,
        target_menu_id: challengeType === 'menu' ? (input.targetMenuId ?? null) : null,
        menu_source: challengeType === 'menu' ? (input.menuSource ?? null) : null,
        target_count: targetCount,
        daily_cap: Math.max(1, input.dailyCap ?? 1),
        count_unit: input.countUnit ?? (challengeType === 'menu' ? 'menu_completion' : 'exercise_completion'),
        goal_type: goalType,
        window_days: Math.max(1, input.windowDays),
        required_days: goalType === 'active_day' ? Math.max(1, input.requiredDays ?? targetCount) : null,
        started_at: input.startedAt ?? new Date().toISOString(),
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
        status: 'active',
        icon_emoji: input.iconEmoji ?? null,
        reward_granted_at: null,
        completed_at: null,
        ended_at: null,
        updated_at: new Date().toISOString(),
    };
}

export function toPersonalChallengeSetupUpdateRow(
    challenge: PersonalChallenge,
    patch: PersonalChallengeSetupPatch,
): PersonalChallengeUpdate {
    const challengeType = patch.challengeType ?? challenge.challengeType;
    const goalType = patch.goalType ?? challenge.goalType;
    const windowDays = Math.max(1, patch.windowDays ?? challenge.windowDays);
    const effectiveStartDate = patch.effectiveStartDate ?? challenge.effectiveStartDate;
    const effectiveWindow = createPersonalChallengeWindow(effectiveStartDate, windowDays);
    const requiredDays =
        goalType === 'active_day'
            ? Math.max(1, patch.requiredDays ?? challenge.requiredDays ?? challenge.targetCount)
            : null;
    const targetCount = getChallengeGoalTarget({
        goalType,
        requiredDays,
        targetCount: patch.targetCount ?? challenge.targetCount,
    });

    return {
        challenge_type: challengeType,
        target_exercise_id: challengeType === 'exercise' ? (patch.exerciseId ?? challenge.exerciseId ?? null) : null,
        target_menu_id: challengeType === 'menu' ? (patch.targetMenuId ?? challenge.targetMenuId ?? null) : null,
        menu_source: challengeType === 'menu' ? (patch.menuSource ?? challenge.menuSource ?? null) : null,
        target_count: targetCount,
        daily_cap: Math.max(1, patch.dailyCap ?? challenge.dailyCap),
        count_unit: patch.countUnit ?? challenge.countUnit,
        goal_type: goalType,
        window_days: windowDays,
        required_days: requiredDays,
        effective_start_date: effectiveWindow.startDate,
        effective_end_date: effectiveWindow.endDate,
        updated_at: new Date().toISOString(),
    };
}

export async function countPersonalChallengeProgress(challenge: PersonalChallenge): Promise<number> {
    const sessions = await getAllSessions();

    return countChallengeProgressFromSessions(
        toPersonalChallengeEngineInput(challenge),
        sessions,
        [challenge.memberId],
        {
            startDate: challenge.effectiveStartDate,
            endDate: challenge.effectiveEndDate,
        },
    );
}
