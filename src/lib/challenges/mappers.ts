import type { Database } from '../supabase-types';
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
    const rewardValue = Math.max(0, input.rewardValue);
    return {
        title: input.title,
        exercise_id: input.exerciseId ?? 'S01',
        target_exercise_id: input.challengeType === 'exercise' ? input.exerciseId ?? 'S01' : null,
        target_menu_id: input.challengeType === 'menu' ? input.targetMenuId : null,
        challenge_type: input.challengeType,
        menu_source: input.challengeType === 'menu' ? input.menuSource : null,
        target_count: input.targetCount,
        daily_cap: input.dailyCap,
        count_unit: input.countUnit,
        start_date: input.startDate,
        end_date: input.endDate,
        window_type: input.windowType,
        goal_type: input.goalType,
        window_days: input.windowType === 'rolling' ? input.windowDays : null,
        required_days: input.goalType === 'active_day' ? input.requiredDays : null,
        daily_minimum_minutes: input.goalType === 'active_day' && input.challengeType === 'duration'
            ? input.dailyMinimumMinutes
            : null,
        publish_mode: input.publishMode,
        publish_start_date: input.publishMode === 'seasonal'
            ? (input.publishStartDate ?? input.startDate)
            : null,
        publish_end_date: input.publishMode === 'seasonal'
            ? (input.publishEndDate ?? input.endDate)
            : null,
        created_by: input.createdBy ?? '',
        reward_kind: input.rewardKind,
        reward_value: rewardValue,
        reward_fuwafuwa_type: input.rewardKind === 'medal' ? rewardValue : 0,
        tier: input.tier,
        summary: input.summary,
        description: input.description,
        icon_emoji: input.iconEmoji,
        class_levels: input.classLevels,
    };
}

export function toChallengeInsertRow(input: ChallengeWriteInput): Database['public']['Tables']['challenges']['Insert'] {
    return {
        ...toChallengeRowBase(input),
        created_by: input.createdBy ?? '',
    };
}

export function toChallengeUpdateRow(input: ChallengeWriteInput): Database['public']['Tables']['challenges']['Update'] {
    return toChallengeRowBase(input);
}
