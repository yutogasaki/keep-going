import {
    buildChallengeEngineInput,
    getChallengeGoalTarget,
    type ChallengeEngineInput,
} from '../challenge-engine';
import type { Challenge, ChallengeWriteInput } from './types';

type ChallengeEngineSourceLike = Pick<
    Challenge,
    | 'challengeType'
    | 'exerciseId'
    | 'targetMenuId'
    | 'menuSource'
    | 'targetCount'
    | 'dailyCap'
    | 'countUnit'
    | 'startDate'
    | 'endDate'
    | 'windowType'
    | 'goalType'
    | 'requiredDays'
    | 'windowDays'
    | 'dailyMinimumMinutes'
>;

export function normalizeChallengeWriteInput(input: ChallengeWriteInput): ChallengeWriteInput {
    const goalType = input.challengeType === 'duration' || input.windowType === 'rolling'
        ? 'active_day'
        : input.goalType;
    const targetCount = getChallengeGoalTarget({
        goalType,
        requiredDays: goalType === 'active_day' ? input.requiredDays ?? null : null,
        targetCount: input.targetCount,
    });
    const requiredDays = goalType === 'active_day'
        ? Math.max(1, input.requiredDays ?? targetCount)
        : null;

    return {
        ...input,
        exerciseId: input.challengeType === 'exercise' ? input.exerciseId : null,
        targetMenuId: input.challengeType === 'menu' ? input.targetMenuId : null,
        menuSource: input.challengeType === 'menu' ? input.menuSource : null,
        countUnit: input.challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
        targetCount,
        dailyCap: goalType === 'active_day' ? 1 : Math.max(1, input.dailyCap),
        goalType,
        windowDays: input.windowType === 'rolling' ? Math.max(1, input.windowDays ?? 7) : null,
        requiredDays,
        dailyMinimumMinutes: input.challengeType === 'duration' && goalType === 'active_day'
            ? input.dailyMinimumMinutes
            : null,
        publishStartDate: input.publishMode === 'seasonal' ? input.publishStartDate : null,
        publishEndDate: input.publishMode === 'seasonal' ? input.publishEndDate : null,
    };
}

export function toChallengeEngineInput(challenge: ChallengeEngineSourceLike): ChallengeEngineInput {
    return buildChallengeEngineInput({
        challengeType: challenge.challengeType,
        exerciseId: challenge.exerciseId,
        targetMenuId: challenge.targetMenuId,
        menuSource: challenge.menuSource,
        targetCount: challenge.targetCount,
        dailyCap: challenge.dailyCap,
        countUnit: challenge.countUnit,
        startDate: challenge.startDate,
        endDate: challenge.endDate,
        windowType: challenge.windowType,
        goalType: challenge.goalType,
        requiredDays: challenge.requiredDays,
        windowDays: challenge.windowDays,
        dailyMinimumMinutes: challenge.dailyMinimumMinutes,
    });
}
