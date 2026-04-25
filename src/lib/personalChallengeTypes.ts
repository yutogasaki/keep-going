import type { ChallengeCountUnit, ChallengeGoalType, ChallengeMenuSource, ChallengeType } from './challenge-engine';
import type { Database } from './supabase-types';

export type PersonalChallengeStatus = 'active' | 'completed' | 'ended_manual' | 'ended_expired';

export interface PersonalChallenge {
    id: string;
    accountId: string;
    memberId: string;
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
    goalType: ChallengeGoalType;
    windowDays: number;
    requiredDays: number | null;
    startedAt: string;
    effectiveStartDate: string;
    effectiveEndDate: string;
    status: PersonalChallengeStatus;
    iconEmoji: string | null;
    rewardKind: 'star';
    rewardValue: 1;
    rewardGrantedAt: string | null;
    completedAt: string | null;
    endedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PersonalChallengeCreateInput {
    memberId: string;
    title: string;
    summary?: string | null;
    description?: string | null;
    challengeType: ChallengeType;
    exerciseId?: string | null;
    targetMenuId?: string | null;
    menuSource?: ChallengeMenuSource | null;
    targetCount?: number;
    dailyCap?: number;
    countUnit?: ChallengeCountUnit;
    goalType?: ChallengeGoalType;
    windowDays: number;
    requiredDays?: number | null;
    startedAt?: string;
    effectiveStartDate?: string;
    iconEmoji?: string | null;
}

export interface PersonalChallengeMetaPatch {
    title?: string;
    summary?: string | null;
    description?: string | null;
    iconEmoji?: string | null;
}

export interface PersonalChallengeSetupPatch {
    challengeType?: ChallengeType;
    exerciseId?: string | null;
    targetMenuId?: string | null;
    menuSource?: ChallengeMenuSource | null;
    targetCount?: number;
    dailyCap?: number;
    countUnit?: ChallengeCountUnit;
    goalType?: ChallengeGoalType;
    windowDays?: number;
    requiredDays?: number | null;
    effectiveStartDate?: string;
}

export type PersonalChallengeRow = Database['public']['Tables']['personal_challenges']['Row'];
export type PersonalChallengeInsert = Database['public']['Tables']['personal_challenges']['Insert'];
export type PersonalChallengeUpdate = Database['public']['Tables']['personal_challenges']['Update'];
