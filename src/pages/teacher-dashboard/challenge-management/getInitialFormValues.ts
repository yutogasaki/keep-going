import type { Challenge } from '../../../lib/challenges';
import type { ChallengeFormValues } from './types';
import { getDefaultDateRange } from './getDefaultDateRange';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import { inferDurationPresetFromChallenge } from './durationPresets';

export function createDefaultChallengeFormValues(): ChallengeFormValues {
    const { startDate, endDate } = getDefaultDateRange();
    return {
        title: '',
        description: '',
        challengeType: 'exercise',
        windowType: 'calendar',
        goalType: 'total_count',
        durationPreset: 'week',
        exerciseId: 'S01',
        targetMenuId: PRESET_GROUPS[0]?.id ?? '',
        menuSource: 'preset',
        targetCount: 5,
        dailyCap: 1,
        dailyMinimumMinutes: 3,
        windowDays: 7,
        requiredDays: 5,
        startDate,
        endDate,
        publishMode: 'seasonal',
        publishStartDate: startDate,
        publishEndDate: endDate,
        tier: 'small',
        rewardKind: 'star',
        rewardValue: 1,
        iconEmoji: '',
        classLevels: [],
    };
}

export function createChallengeFormValuesFromChallenge(challenge: Challenge): ChallengeFormValues {
    return {
        title: challenge.title,
        description: challenge.description?.trim() || challenge.summary?.trim() || '',
        challengeType: challenge.challengeType,
        windowType: challenge.windowType,
        goalType: challenge.goalType,
        durationPreset: inferDurationPresetFromChallenge(challenge),
        exerciseId: challenge.exerciseId ?? 'S01',
        targetMenuId: challenge.targetMenuId ?? PRESET_GROUPS[0]?.id ?? '',
        menuSource: challenge.menuSource ?? 'preset',
        targetCount: challenge.targetCount,
        dailyCap: challenge.dailyCap,
        dailyMinimumMinutes: challenge.dailyMinimumMinutes ?? 3,
        windowDays: challenge.windowDays ?? 7,
        requiredDays: challenge.requiredDays ?? challenge.targetCount,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        publishMode: challenge.publishMode,
        publishStartDate: challenge.publishStartDate ?? challenge.startDate,
        publishEndDate: challenge.publishEndDate ?? challenge.endDate,
        tier: challenge.tier,
        rewardKind: challenge.rewardKind,
        rewardValue: challenge.rewardValue,
        iconEmoji: challenge.iconEmoji ?? '',
        classLevels: challenge.classLevels,
    };
}

export function createChallengeCopyFormValues(challenge: Challenge): ChallengeFormValues {
    return {
        ...createChallengeFormValuesFromChallenge(challenge),
        title: `${challenge.title}（コピー）`,
    };
}
