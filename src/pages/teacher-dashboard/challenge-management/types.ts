export interface ChallengeFormValues {
    title: string;
    description: string;
    challengeType: 'exercise' | 'menu';
    exerciseId: string;
    targetMenuId: string;
    menuSource: 'preset' | 'teacher';
    targetCount: number;
    dailyCap: number;
    startDate: string;
    endDate: string;
    tier: 'small' | 'big';
    rewardKind: 'star' | 'medal';
    rewardValue: number;
    iconEmoji: string;
    classLevels: string[];
}
