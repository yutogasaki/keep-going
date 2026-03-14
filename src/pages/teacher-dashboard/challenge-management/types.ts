export type ChallengeDurationPreset = 'week' | 'two_weeks' | 'month' | 'custom';
export type ChallengePublishMode = 'seasonal' | 'always_on';

export interface ChallengeFormValues {
    title: string;
    description: string;
    challengeType: 'exercise' | 'menu' | 'duration';
    windowType: 'calendar' | 'rolling';
    goalType: 'total_count' | 'active_day';
    durationPreset: ChallengeDurationPreset;
    exerciseId: string;
    targetMenuId: string;
    menuSource: 'preset' | 'teacher';
    targetCount: number;
    dailyCap: number;
    dailyMinimumMinutes: number;
    windowDays: number;
    requiredDays: number;
    startDate: string;
    endDate: string;
    publishMode: ChallengePublishMode;
    publishStartDate: string;
    publishEndDate: string;
    tier: 'small' | 'big';
    rewardKind: 'star' | 'medal';
    rewardValue: number;
    iconEmoji: string;
    classLevels: string[];
}
