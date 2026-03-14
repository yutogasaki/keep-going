import { shiftDateKey } from '../../../lib/db';
import type { Challenge } from '../../../lib/challenges';
import type { ChallengeDurationPreset, ChallengeFormValues } from './types';

export interface ChallengeDurationPresetOption {
    id: ChallengeDurationPreset;
    label: string;
    description: string;
}

export const CHALLENGE_DURATION_PRESET_OPTIONS: readonly ChallengeDurationPresetOption[] = [
    { id: 'week', label: '1週間', description: 'まずは作りやすいおすすめ' },
    { id: 'two_weeks', label: '2週間', description: '少し長めに続けたいとき' },
    { id: 'month', label: '1ヶ月', description: 'しっかり取り組みたいとき' },
    { id: 'custom', label: 'カスタム', description: '日にちを自分で決める' },
] as const;

export function resolveChallengeDurationDays(preset: ChallengeDurationPreset): number | null {
    switch (preset) {
    case 'week':
        return 7;
    case 'two_weeks':
        return 14;
    case 'month':
        return 30;
    case 'custom':
    default:
        return null;
    }
}

export function getRecommendedChallengeGoal(days: number): number {
    if (days <= 7) return 5;
    if (days <= 14) return 10;
    return 20;
}

function getInclusiveDateRangeDays(startDate: string, endDate: string): number | null {
    if (!startDate || !endDate || endDate < startDate) {
        return null;
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const diffMs = end.getTime() - start.getTime();
    if (!Number.isFinite(diffMs) || diffMs < 0) {
        return null;
    }

    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function inferDurationPresetFromChallenge(challenge: Challenge): ChallengeDurationPreset {
    const days = challenge.windowType === 'rolling'
        ? challenge.windowDays
        : getInclusiveDateRangeDays(challenge.startDate, challenge.endDate);

    switch (days) {
    case 7:
        return 'week';
    case 14:
        return 'two_weeks';
    case 30:
        return 'month';
    default:
        return 'custom';
    }
}

export function applyDurationPreset(
    values: Pick<ChallengeFormValues, 'durationPreset' | 'windowType' | 'startDate' | 'windowDays'>,
    preset: ChallengeDurationPreset,
): Partial<ChallengeFormValues> {
    const days = resolveChallengeDurationDays(preset);
    if (!days) {
        return { durationPreset: 'custom' };
    }

    const baseStartDate = values.startDate;
    const endDate = shiftDateKey(baseStartDate, days - 1);
    const recommendedGoal = getRecommendedChallengeGoal(days);

    if (values.windowType === 'rolling') {
        return {
            durationPreset: preset,
            windowDays: days,
            requiredDays: Math.min(recommendedGoal, days),
            targetCount: Math.min(recommendedGoal, days),
            startDate: baseStartDate,
            endDate,
        };
    }

    return {
        durationPreset: preset,
        startDate: baseStartDate,
        endDate,
        targetCount: recommendedGoal,
        dailyCap: 1,
    };
}

export function getDurationPresetSummary(values: Pick<ChallengeFormValues, 'windowType' | 'startDate' | 'endDate' | 'windowDays'>): string {
    if (values.windowType === 'rolling') {
        return `参加した人は ${values.windowDays}日チャレンジ。ホームには ${values.startDate} 〜 ${values.endDate} に表示されます。`;
    }

    return `${values.startDate} 〜 ${values.endDate} の期間で進みます。`;
}
