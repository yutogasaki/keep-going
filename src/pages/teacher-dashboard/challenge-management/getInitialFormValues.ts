import type { Challenge } from '../../../lib/challenges';
import type { ChallengeFormValues } from './types';
import { getDefaultDateRange } from './getDefaultDateRange';
import { PRESET_GROUPS } from '../../../data/menuGroups';

export function createDefaultChallengeFormValues(): ChallengeFormValues {
    const { startDate, endDate } = getDefaultDateRange();
    return {
        title: '',
        summary: '',
        description: '',
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: PRESET_GROUPS[0]?.id ?? '',
        menuSource: 'preset',
        targetCount: 20,
        dailyCap: 1,
        startDate,
        endDate,
        tier: 'big',
        rewardKind: 'medal',
        rewardValue: Math.floor(Math.random() * 10),
        iconEmoji: '🎯',
        classLevels: [],
    };
}

export function createChallengeFormValuesFromChallenge(challenge: Challenge): ChallengeFormValues {
    return {
        title: challenge.title,
        summary: challenge.summary ?? challenge.title,
        description: challenge.description ?? '',
        challengeType: challenge.challengeType,
        exerciseId: challenge.exerciseId ?? 'S01',
        targetMenuId: challenge.targetMenuId ?? PRESET_GROUPS[0]?.id ?? '',
        menuSource: challenge.menuSource ?? 'preset',
        targetCount: challenge.targetCount,
        dailyCap: challenge.dailyCap,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        tier: challenge.tier,
        rewardKind: challenge.rewardKind,
        rewardValue: challenge.rewardValue,
        iconEmoji: challenge.iconEmoji ?? '🎯',
        classLevels: challenge.classLevels,
    };
}
