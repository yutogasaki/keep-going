import type { Database } from '../supabase-types';
import { normalizeChallengeWriteInput } from './engine';
import type {
    Challenge,
    ChallengeAttempt,
    ChallengeAttemptStatus,
    ChallengeCountUnit,
    ChallengeEnrollment,
    ChallengeGoalType,
    ChallengeMenuSource,
    ChallengePublishMode,
    ChallengeRewardKind,
    ChallengeTier,
    ChallengeType,
    ChallengeWindowType,
    ChallengeWriteInput,
} from './types';

function normalizeChallengeType(value: string | null | undefined): ChallengeType {
    return value === 'menu' || value === 'duration' ? value : 'exercise';
}

function normalizeMenuSource(value: string | null | undefined): ChallengeMenuSource | null {
    return value === 'teacher' || value === 'preset'
        ? value
        : null;
}

function normalizeCountUnit(value: string | null | undefined, challengeType: ChallengeType): ChallengeCountUnit {
    if (value === 'menu_completion' || value === 'exercise_completion') {
        return value;
    }

    return challengeType === 'menu' ? 'menu_completion' : 'exercise_completion';
}

function normalizeRewardKind(value: string | null | undefined): ChallengeRewardKind {
    return value === 'star' ? 'star' : 'medal';
}

function normalizeTier(value: string | null | undefined): ChallengeTier {
    return value === 'small' ? 'small' : 'big';
}

function normalizeWindowType(value: string | null | undefined): ChallengeWindowType {
    return value === 'rolling' ? 'rolling' : 'calendar';
}

function normalizeGoalType(value: string | null | undefined): ChallengeGoalType {
    return value === 'active_day' ? 'active_day' : 'total_count';
}

function normalizePublishMode(value: string | null | undefined): ChallengePublishMode {
    return value === 'always_on' ? 'always_on' : 'seasonal';
}

function normalizeChallengeAttemptStatus(value: string | null | undefined): ChallengeAttemptStatus {
    return value === 'completed' || value === 'expired' ? value : 'active';
}

export function mapChallenge(row: Database['public']['Tables']['challenges']['Row']): Challenge {
    const challengeType = normalizeChallengeType(row.challenge_type);
    const rewardKind = normalizeRewardKind(row.reward_kind);
    const rewardValue = row.reward_value ?? row.reward_fuwafuwa_type ?? 0;
    const exerciseId = row.target_exercise_id ?? row.exercise_id;
    const goalType = normalizeGoalType(row.goal_type);
    const publishMode = normalizePublishMode(row.publish_mode);

    return {
        id: row.id,
        title: row.title,
        summary: row.summary ?? row.title,
        description: row.description ?? null,
        challengeType,
        exerciseId,
        targetMenuId: row.target_menu_id ?? null,
        menuSource: normalizeMenuSource(row.menu_source),
        targetCount: row.target_count,
        dailyCap: row.daily_cap ?? 1,
        countUnit: normalizeCountUnit(row.count_unit, challengeType),
        startDate: row.start_date,
        endDate: row.end_date,
        windowType: normalizeWindowType(row.window_type),
        goalType,
        windowDays: row.window_days ?? null,
        requiredDays: goalType === 'active_day'
            ? (row.required_days ?? row.target_count)
            : (row.required_days ?? null),
        dailyMinimumMinutes: row.daily_minimum_minutes ?? null,
        publishMode,
        publishStartDate: publishMode === 'seasonal'
            ? (row.publish_start_date ?? row.start_date)
            : (row.publish_start_date ?? null),
        publishEndDate: publishMode === 'seasonal'
            ? (row.publish_end_date ?? row.end_date)
            : (row.publish_end_date ?? null),
        createdBy: row.created_by,
        rewardKind,
        rewardValue,
        rewardFuwafuwaType: rewardKind === 'medal' ? rewardValue : null,
        tier: normalizeTier(row.tier),
        iconEmoji: row.icon_emoji ?? null,
        classLevels: row.class_levels ?? [],
        createdAt: row.created_at,
    };
}

export function mapChallengeEnrollment(
    row: Database['public']['Tables']['challenge_enrollments']['Row'],
): ChallengeEnrollment {
    return {
        id: row.id,
        challengeId: row.challenge_id,
        accountId: row.account_id,
        memberId: row.member_id,
        joinedAt: row.joined_at,
        effectiveStartDate: row.effective_start_date,
        effectiveEndDate: row.effective_end_date,
        createdAt: row.created_at,
    };
}

export function mapChallengeAttempt(
    row: Database['public']['Tables']['challenge_attempts']['Row'],
): ChallengeAttempt {
    return {
        id: row.id,
        challengeId: row.challenge_id,
        accountId: row.account_id,
        memberId: row.member_id,
        attemptNo: row.attempt_no,
        joinedAt: row.joined_at,
        effectiveStartDate: row.effective_start_date,
        effectiveEndDate: row.effective_end_date,
        status: normalizeChallengeAttemptStatus(row.status),
        completedAt: row.completed_at ?? null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toChallengeRowBase(input: ChallengeWriteInput) {
    const normalized = normalizeChallengeWriteInput(input);
    const rewardValue = Math.max(0, normalized.rewardValue);

    return {
        title: normalized.title,
        exercise_id: normalized.exerciseId ?? 'S01',
        target_exercise_id: normalized.challengeType === 'exercise' ? normalized.exerciseId ?? 'S01' : null,
        target_menu_id: normalized.challengeType === 'menu' ? normalized.targetMenuId : null,
        challenge_type: normalized.challengeType,
        menu_source: normalized.challengeType === 'menu' ? normalized.menuSource : null,
        target_count: normalized.targetCount,
        daily_cap: normalized.dailyCap,
        count_unit: normalized.countUnit,
        start_date: normalized.startDate,
        end_date: normalized.endDate,
        window_type: normalized.windowType,
        goal_type: normalized.goalType,
        window_days: normalized.windowType === 'rolling' ? normalized.windowDays : null,
        required_days: normalized.goalType === 'active_day' ? normalized.requiredDays : null,
        daily_minimum_minutes: normalized.goalType === 'active_day' && normalized.challengeType === 'duration'
            ? normalized.dailyMinimumMinutes
            : null,
        publish_mode: normalized.publishMode,
        publish_start_date: normalized.publishMode === 'seasonal'
            ? (normalized.publishStartDate ?? normalized.startDate)
            : null,
        publish_end_date: normalized.publishMode === 'seasonal'
            ? (normalized.publishEndDate ?? normalized.endDate)
            : null,
        reward_kind: normalized.rewardKind,
        reward_value: rewardValue,
        reward_fuwafuwa_type: normalized.rewardKind === 'medal' ? rewardValue : 0,
        tier: normalized.tier,
        summary: normalized.summary,
        description: normalized.description,
        icon_emoji: normalized.iconEmoji,
        class_levels: normalized.classLevels,
    };
}

export function toChallengeInsertRow(input: ChallengeWriteInput): Database['public']['Tables']['challenges']['Insert'] {
    const normalized = normalizeChallengeWriteInput(input);

    return {
        ...toChallengeRowBase(input),
        created_by: normalized.createdBy ?? '',
    };
}

export function toChallengeUpdateRow(input: ChallengeWriteInput): Database['public']['Tables']['challenges']['Update'] {
    const normalized = normalizeChallengeWriteInput(input);

    return {
        ...toChallengeRowBase(input),
        ...(normalized.createdBy ? { created_by: normalized.createdBy } : {}),
    };
}
