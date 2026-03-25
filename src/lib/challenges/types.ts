import type { ChallengeProgressWindow } from '../challenge-engine';

export type ChallengeType = 'exercise' | 'menu' | 'duration';
export type ChallengeMenuSource = 'teacher' | 'preset';
export type ChallengeCountUnit = 'exercise_completion' | 'menu_completion';
export type ChallengeTier = 'small' | 'big';
export type ChallengeRewardKind = 'star' | 'medal';
export type ChallengeWindowType = 'calendar' | 'rolling';
export type ChallengeGoalType = 'total_count' | 'active_day';
export type ChallengePublishMode = 'seasonal' | 'always_on';
export type ChallengeAttemptStatus = 'active' | 'completed' | 'expired';

export interface Challenge {
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
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
    requiredDays: number | null;
    dailyMinimumMinutes: number | null;
    publishMode: ChallengePublishMode;
    publishStartDate: string | null;
    publishEndDate: string | null;
    createdBy: string;
    rewardKind: ChallengeRewardKind;
    rewardValue: number;
    rewardFuwafuwaType: number | null;
    tier: ChallengeTier;
    iconEmoji: string | null;
    classLevels: string[];
    createdAt: string;
}

export interface ChallengeCompletion {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    completedAt: string;
}

export interface ChallengeRewardGrant {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    grantedAt: string;
}

export interface ChallengeEnrollment {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    joinedAt: string;
    effectiveStartDate: string;
    effectiveEndDate: string;
    createdAt: string;
}

export interface ChallengeAttempt {
    id: string;
    challengeId: string;
    accountId: string;
    memberId: string;
    attemptNo: number;
    joinedAt: string;
    effectiveStartDate: string;
    effectiveEndDate: string;
    status: ChallengeAttemptStatus;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ChallengeEnrollmentState {
    joinedChallengeIds: Record<string, string[]>;
    challengeEnrollmentWindows: Record<string, Record<string, ChallengeProgressWindow>>;
}

export interface ChallengeWriteInput {
    title: string;
    summary: string | null;
    description: string | null;
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
    requiredDays: number | null;
    dailyMinimumMinutes: number | null;
    publishMode: ChallengePublishMode;
    publishStartDate: string | null;
    publishEndDate: string | null;
    createdBy?: string;
    rewardKind: ChallengeRewardKind;
    rewardValue: number;
    tier: ChallengeTier;
    iconEmoji: string | null;
    classLevels: string[];
}
