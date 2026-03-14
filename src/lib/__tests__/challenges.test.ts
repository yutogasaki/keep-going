import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    countChallengeProgress,
    getChallengeCardText,
    getChallengeDescriptionText,
    getChallengeGoalLabel,
    getChallengeHeaderText,
    getChallengeInviteWindowLabel,
    getChallengeProgressLabel,
    getChallengeRewardLabel,
    type Challenge,
} from '../challenges';
import { getAllSessions, type SessionRecord } from '../db';

vi.mock('../db', () => ({
    getAllSessions: vi.fn(),
    getTodayKey: vi.fn(() => '2026-03-09'),
}));

const mockedGetAllSessions = vi.mocked(getAllSessions);

function asSessions(records: SessionRecord[]): SessionRecord[] {
    return records;
}

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: 'challenge-1',
        title: '開脚チャレンジ',
        summary: '1日1回の開脚',
        description: 'ゆっくりやる',
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: null,
        menuSource: null,
        targetCount: 5,
        dailyCap: 2,
        countUnit: 'exercise_completion',
        startDate: '2026-03-01',
        endDate: '2026-03-31',
        windowType: 'calendar',
        goalType: 'total_count',
        windowDays: null,
        requiredDays: null,
        createdBy: 'teacher@example.com',
        rewardKind: 'star',
        rewardValue: 3,
        rewardFuwafuwaType: null,
        tier: 'small',
        iconEmoji: '⭐',
        classLevels: [],
        createdAt: '2026-03-01T00:00:00Z',
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe('countChallengeProgress', () => {
    it('caps daily exercise counts by dailyCap', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-03-05',
                startedAt: '2026-03-05T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01', 'S01', 'S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-05',
                startedAt: '2026-03-05T11:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's3',
                date: '2026-03-06',
                startedAt: '2026-03-06T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge(), ['u1']);

        expect(progress).toBe(3);
    });

    it('ignores sessions outside the date range and other users', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-02-28',
                startedAt: '2026-02-28T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-10',
                startedAt: '2026-03-10T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u2'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            startDate: '2026-03-01',
            endDate: '2026-03-09',
        }), ['u1']);

        expect(progress).toBe(0);
    });

    it('counts only completed matching menu sessions and applies dailyCap', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 'menu-1',
                date: '2026-03-05',
                startedAt: '2026-03-05T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01', 'S02'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: [],
                userIds: ['u1'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
            {
                id: 'menu-2',
                date: '2026-03-05',
                startedAt: '2026-03-05T11:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01', 'S02'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: [],
                userIds: ['u1'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
            {
                id: 'menu-3',
                date: '2026-03-05',
                startedAt: '2026-03-05T12:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: ['S02'],
                userIds: ['u1'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
            {
                id: 'menu-4',
                date: '2026-03-06',
                startedAt: '2026-03-06T10:00:00Z',
                totalSeconds: 180,
                exerciseIds: ['S01', 'S02'],
                plannedExerciseIds: ['S01', 'S02'],
                skippedIds: [],
                userIds: ['u2'],
                sourceMenuId: 'preset-basic',
                sourceMenuSource: 'preset',
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            challengeType: 'menu',
            exerciseId: null,
            targetMenuId: 'preset-basic',
            menuSource: 'preset',
            countUnit: 'menu_completion',
            dailyCap: 1,
        }), ['u1']);

        expect(progress).toBe(1);
    });

    it('counts active days inside an effective rolling window', async () => {
        mockedGetAllSessions.mockResolvedValue(asSessions([
            {
                id: 's1',
                date: '2026-03-13',
                startedAt: '2026-03-13T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's2',
                date: '2026-03-14',
                startedAt: '2026-03-14T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
            {
                id: 's3',
                date: '2026-03-15',
                startedAt: '2026-03-15T10:00:00Z',
                totalSeconds: 60,
                exerciseIds: ['S01', 'S01'],
                skippedIds: [],
                userIds: ['u1'],
            },
        ]));

        const progress = await countChallengeProgress(makeChallenge({
            windowType: 'rolling',
            goalType: 'active_day',
            windowDays: 7,
            requiredDays: 5,
            targetCount: 5,
            dailyCap: 1,
        }), ['u1'], {
            startDate: '2026-03-14',
            endDate: '2026-03-20',
        });

        expect(progress).toBe(2);
    });
});

describe('getChallengeRewardLabel', () => {
    it('formats star rewards', () => {
        expect(getChallengeRewardLabel(makeChallenge())).toBe('ほし 3こ');
    });

    it('formats medal rewards', () => {
        expect(getChallengeRewardLabel(makeChallenge({
            rewardKind: 'medal',
            rewardValue: 4,
            rewardFuwafuwaType: 4,
            tier: 'big',
        }))).toBe('メダル');
    });
});

describe('challenge text helpers', () => {
    it('prefers summary for compact card text', () => {
        expect(getChallengeCardText(makeChallenge())).toBe('1日1回の開脚');
    });

    it('falls back to description when summary matches title', () => {
        expect(getChallengeCardText(makeChallenge({
            summary: '開脚チャレンジ',
            description: 'ゆっくりやる',
        }))).toBe('ゆっくりやる');
    });

    it('shows header text only when summary differs from title', () => {
        expect(getChallengeHeaderText(makeChallenge())).toBe('1日1回の開脚');
        expect(getChallengeHeaderText(makeChallenge({ summary: '開脚チャレンジ' }))).toBeNull();
    });

    it('hides detail description when it duplicates summary', () => {
        expect(getChallengeDescriptionText(makeChallenge({
            summary: '同じ',
            description: '同じ',
        }))).toBeNull();
        expect(getChallengeDescriptionText(makeChallenge({
            summary: 'ひとこと',
            description: '詳しい説明',
        }))).toBe('詳しい説明');
    });

    it('formats rolling active-day labels', () => {
        const challenge = makeChallenge({
            windowType: 'rolling',
            goalType: 'active_day',
            windowDays: 7,
            requiredDays: 5,
            targetCount: 5,
        });

        expect(getChallengeGoalLabel(challenge, '前後開脚')).toBe('前後開脚を5日');
        expect(getChallengeProgressLabel(challenge, 3)).toBe('3 / 5日');
        expect(getChallengeInviteWindowLabel(challenge)).toBe('参加すると 今日から7日');
    });
});
