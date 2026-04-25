import { describe, expect, it } from 'vitest';
import {
    normalizeChallengeWriteInput,
    toChallengeEngineInput,
    toChallengeInsertRow,
    toChallengeUpdateRow,
} from '../challenges';
import { makeChallenge, makeChallengeWriteInput } from './challenges.fixtures';

describe('challenge adapters', () => {
    it('normalizes rolling teacher challenge writes into active-day rules', () => {
        const normalized = normalizeChallengeWriteInput(makeChallengeWriteInput({
            challengeType: 'menu',
            exerciseId: 'S01',
            targetMenuId: 'preset-basic',
            menuSource: 'preset',
            targetCount: 9,
            dailyCap: 3,
            countUnit: 'exercise_completion',
            windowType: 'rolling',
            goalType: 'total_count',
            windowDays: null,
            requiredDays: 4,
            publishMode: 'always_on',
            publishStartDate: '2026-03-01',
            publishEndDate: '2026-03-31',
        }));

        expect(normalized).toMatchObject({
            challengeType: 'menu',
            exerciseId: null,
            targetMenuId: 'preset-basic',
            menuSource: 'preset',
            countUnit: 'menu_completion',
            goalType: 'active_day',
            targetCount: 4,
            dailyCap: 1,
            windowDays: 7,
            requiredDays: 4,
            publishStartDate: null,
            publishEndDate: null,
        });
    });

    it('maps normalized teacher challenge writes into insert rows', () => {
        const row = toChallengeInsertRow(makeChallengeWriteInput({
            challengeType: 'duration',
            exerciseId: 'S01',
            targetCount: 2,
            dailyCap: 5,
            goalType: 'total_count',
            requiredDays: 6,
            dailyMinimumMinutes: 4,
            createdBy: 'teacher@example.com',
            publishMode: 'always_on',
        }));

        expect(row).toMatchObject({
            challenge_type: 'duration',
            target_exercise_id: null,
            target_count: 6,
            daily_cap: 1,
            goal_type: 'active_day',
            required_days: 6,
            daily_minimum_minutes: 4,
            publish_mode: 'always_on',
            publish_start_date: null,
            publish_end_date: null,
            created_by: 'teacher@example.com',
        });
    });

    it('does not clear created_by when building an update row without createdBy', () => {
        const row = toChallengeUpdateRow(makeChallengeWriteInput());

        expect(row).not.toHaveProperty('created_by');
    });

    it('builds engine input from teacher challenges through a shared adapter', () => {
        const engineInput = toChallengeEngineInput(makeChallenge({
            challengeType: 'duration',
            exerciseId: null,
            dailyCap: 1,
            goalType: 'active_day',
            requiredDays: 5,
            targetCount: 1,
            windowType: 'rolling',
            windowDays: 7,
            dailyMinimumMinutes: 3,
        }));

        expect(engineInput).toMatchObject({
            challengeType: 'duration',
            targetCount: 5,
            dailyCap: 1,
            windowType: 'rolling',
            windowDays: 7,
            dailyMinimumMinutes: 3,
        });
    });
});
