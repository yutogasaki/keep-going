import type { Challenge } from '../../../lib/challenges';
import type { ChallengeFormValues } from './types';
import { getDefaultDateRange } from './getDefaultDateRange';

export function createDefaultChallengeFormValues(): ChallengeFormValues {
    const { startDate, endDate } = getDefaultDateRange();
    return {
        title: '',
        exerciseId: 'S01',
        targetCount: 20,
        startDate,
        endDate,
        rewardType: Math.floor(Math.random() * 12),
        classLevels: [],
    };
}

export function createChallengeFormValuesFromChallenge(challenge: Challenge): ChallengeFormValues {
    return {
        title: challenge.title,
        exerciseId: challenge.exerciseId,
        targetCount: challenge.targetCount,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        rewardType: challenge.rewardFuwafuwaType,
        classLevels: challenge.classLevels,
    };
}
