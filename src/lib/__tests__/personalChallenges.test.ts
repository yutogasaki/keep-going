import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllSessions, type SessionRecord } from '../db';
import type { Database } from '../supabase-types';
import {
    countPersonalChallengeProgress,
    createPersonalChallengeWindow,
    mapPersonalChallenge,
    toPersonalChallengeEngineInput,
    toPersonalChallengeInsertRow,
} from '../personalChallenges';

vi.mock('../db', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../db')>();

    return {
        ...actual,
        getAllSessions: vi.fn(),
        getTodayKey: vi.fn(() => '2026-03-14'),
    };
});

const mockedGetAllSessions = vi.mocked(getAllSessions);

function asSessions(records: SessionRecord[]): SessionRecord[] {
    return records;
}

function makePersonalChallengeRow(
    overrides: Partial<Database['public']['Tables']['personal_challenges']['Row']> = {},
): Database['public']['Tables']['personal_challenges']['Row'] {
    return {
        id: 'pc-1',
        account_id: 'account-1',
        member_id: 'user-1',
        title: 'じぶんチャレンジ',
        summary: '7日で5日',
        description: null,
        challenge_type: 'exercise',
        target_exercise_id: 'S01',
        target_menu_id: null,
        menu_source: null,
        target_count: 5,
        daily_cap: 1,
        count_unit: 'exercise_completion',
        goal_type: 'active_day',
        window_days: 7,
        required_days: null,
        started_at: '2026-03-14T08:00:00Z',
        effective_start_date: '2026-03-14',
        effective_end_date: '2026-03-20',
        status: 'active',
        icon_emoji: '🎯',
        reward_granted_at: null,
        completed_at: null,
        ended_at: null,
        created_at: '2026-03-14T08:00:00Z',
        updated_at: '2026-03-14T08:00:00Z',
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('personalChallenges helpers', () => {
    it('builds a rolling window from the effective start date', () => {
        expect(createPersonalChallengeWindow('2026-03-14', 14)).toEqual({
            startDate: '2026-03-14',
            endDate: '2026-03-27',
        });
    });

    it('creates an insert row with active-day defaults and a rolling end date', () => {
        const row = toPersonalChallengeInsertRow({
            memberId: 'user-1',
            title: 'メニューを続ける',
            challengeType: 'menu',
            targetMenuId: 'menu-1',
            menuSource: 'custom',
            goalType: 'active_day',
            requiredDays: 5,
            windowDays: 7,
            startedAt: '2026-03-14T08:00:00Z',
            effectiveStartDate: '2026-03-14',
        }, 'account-1');

        expect(row).toMatchObject({
            account_id: 'account-1',
            member_id: 'user-1',
            challenge_type: 'menu',
            target_menu_id: 'menu-1',
            menu_source: 'custom',
            target_count: 5,
            count_unit: 'menu_completion',
            goal_type: 'active_day',
            window_days: 7,
            required_days: 5,
            effective_start_date: '2026-03-14',
            effective_end_date: '2026-03-20',
            status: 'active',
        });
    });

    it('maps rows into app objects with active-day fallback values', () => {
        const challenge = mapPersonalChallenge(makePersonalChallengeRow({
            target_count: 10,
            required_days: null,
            status: 'ended_manual',
        }));

        expect(challenge.requiredDays).toBe(10);
        expect(challenge.status).toBe('ended_manual');
        expect(challenge.rewardKind).toBe('star');
        expect(challenge.rewardValue).toBe(1);
    });

    it('converts active-day challenges into engine input using required days as the goal target', () => {
        const challenge = mapPersonalChallenge(makePersonalChallengeRow({
            goal_type: 'active_day',
            target_count: 99,
            required_days: 5,
        }));

        expect(toPersonalChallengeEngineInput(challenge)).toMatchObject({
            targetCount: 5,
            windowType: 'rolling',
            startDate: '2026-03-14',
            endDate: '2026-03-20',
        });
    });
});

describe('countPersonalChallengeProgress', () => {
    it('counts active days for custom menu challenges', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-03-14',
                startedAt: '2026-03-14T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01'],
                plannedExerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['user-1'],
                sourceMenuId: 'menu-1',
                sourceMenuSource: 'custom',
            },
            {
                id: 's2',
                date: '2026-03-14',
                startedAt: '2026-03-14T11:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01'],
                plannedExerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['user-1'],
                sourceMenuId: 'menu-1',
                sourceMenuSource: 'custom',
            },
            {
                id: 's3',
                date: '2026-03-15',
                startedAt: '2026-03-15T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01'],
                plannedExerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['user-2'],
                sourceMenuId: 'menu-1',
                sourceMenuSource: 'custom',
            },
            {
                id: 's4',
                date: '2026-03-16',
                startedAt: '2026-03-16T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01'],
                plannedExerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['user-1'],
                sourceMenuId: 'menu-1',
                sourceMenuSource: 'custom',
            },
        ]));

        const progress = await countPersonalChallengeProgress(mapPersonalChallenge(makePersonalChallengeRow({
            challenge_type: 'menu',
            target_exercise_id: null,
            target_menu_id: 'menu-1',
            menu_source: 'custom',
            count_unit: 'menu_completion',
        })));

        expect(progress).toBe(2);
    });
});
