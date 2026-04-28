import { describe, expect, it } from 'vitest';
import type {
    Challenge,
    ChallengeAttempt,
    ChallengeCompletion,
    ChallengeEnrollment,
} from '../../../lib/challenges';
import type { StudentSession } from '../../../lib/teacher';
import {
    buildParticipantDetail,
    buildParticipantStatusItems,
    type ParticipantStatusItem,
} from './challengeParticipantStatus';

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: 'challenge-1',
        title: '毎日チャレンジ',
        summary: null,
        description: null,
        challengeType: 'exercise',
        exerciseId: 'exercise-1',
        targetMenuId: null,
        menuSource: null,
        targetCount: 3,
        dailyCap: 1,
        countUnit: 'exercise_completion',
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        windowType: 'calendar',
        goalType: 'total_count',
        windowDays: null,
        requiredDays: null,
        dailyMinimumMinutes: null,
        publishMode: 'seasonal',
        publishStartDate: '2026-04-01',
        publishEndDate: '2026-04-30',
        createdBy: 'teacher@example.com',
        rewardKind: 'star',
        rewardValue: 1,
        rewardFuwafuwaType: null,
        tier: 'small',
        iconEmoji: null,
        classLevels: [],
        createdAt: '2026-04-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeSession(
    id: string,
    memberId: string,
    date: string,
    overrides: Partial<StudentSession> = {},
): StudentSession {
    return {
        id,
        date,
        startedAt: `${date}T09:00:00.000Z`,
        totalSeconds: 300,
        exerciseIds: ['exercise-1'],
        plannedExerciseIds: ['exercise-1'],
        skippedIds: [],
        userIds: [memberId],
        sourceMenuId: null,
        sourceMenuSource: null,
        ...overrides,
    };
}

function makeEnrollment(memberId: string, overrides: Partial<ChallengeEnrollment> = {}): ChallengeEnrollment {
    return {
        id: `enrollment-${memberId}`,
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId,
        joinedAt: '2026-04-01T00:00:00.000Z',
        effectiveStartDate: '2026-04-01',
        effectiveEndDate: '2026-04-30',
        createdAt: '2026-04-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeAttempt(memberId: string, attemptNo: number, overrides: Partial<ChallengeAttempt> = {}): ChallengeAttempt {
    return {
        id: `attempt-${memberId}-${attemptNo}`,
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId,
        attemptNo,
        joinedAt: '2026-04-01T00:00:00.000Z',
        effectiveStartDate: '2026-04-01',
        effectiveEndDate: '2026-04-30',
        status: 'active',
        completedAt: null,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
        ...overrides,
    };
}

function makeCompletion(memberId: string, completedAt: string): ChallengeCompletion {
    return {
        id: `completion-${memberId}`,
        challengeId: 'challenge-1',
        accountId: 'account-1',
        memberId,
        completedAt,
    };
}

describe('challenge participant status helpers', () => {
    it('builds sorted participant statuses from completions, enrollments, latest attempts, and sessions', () => {
        const challenge = makeChallenge();
        const memberNameMap = new Map([
            ['active-member', 'あい'],
            ['joined-member', 'うみ'],
            ['done-member', 'えま'],
            ['retry-member', 'おと'],
            ['expired-member', 'かい'],
        ]);
        const sessionsByMemberId = new Map<string, StudentSession[]>([
            ['active-member', [
                makeSession('active-session-1', 'active-member', '2026-04-03'),
                makeSession('active-session-2', 'active-member', '2026-04-04'),
            ]],
            ['retry-member', [
                makeSession('retry-session-1', 'retry-member', '2026-04-12'),
            ]],
        ]);

        const result = buildParticipantStatusItems(
            challenge,
            [makeCompletion('done-member', '2026-04-08T08:00:00.000Z')],
            [
                makeEnrollment('joined-member'),
                makeEnrollment('active-member'),
            ],
            [
                makeAttempt('expired-member', 1, {
                    effectiveEndDate: '2026-04-10',
                    status: 'expired',
                }),
                makeAttempt('retry-member', 2, {
                    effectiveStartDate: '2026-04-11',
                    effectiveEndDate: '2026-04-17',
                }),
            ],
            memberNameMap,
            sessionsByMemberId,
        );

        expect(result.map((item) => item.memberId)).toEqual([
            'active-member',
            'retry-member',
            'joined-member',
            'expired-member',
            'done-member',
        ]);
        expect(result).toMatchObject([
            {
                memberId: 'active-member',
                progressLabel: '2 / 3回',
                subLabel: '参加中',
                attemptLabel: '1回目',
                windowLabel: '4/30まで',
                completed: false,
                progress: 2,
                attemptNo: 1,
            },
            {
                memberId: 'retry-member',
                progressLabel: '2回目・1 / 3回',
                subLabel: '再挑戦中',
                attemptLabel: '2回目',
                windowLabel: '4/17まで',
                completed: false,
                progress: 1,
                attemptNo: 2,
            },
            {
                memberId: 'joined-member',
                progressLabel: '0 / 3回',
                subLabel: '参加したよ',
            },
            {
                memberId: 'expired-member',
                progressLabel: '0 / 3回',
                subLabel: '期間が終わった',
                windowLabel: '4/10まで',
            },
            {
                memberId: 'done-member',
                progressLabel: 'クリア',
                subLabel: 'ごほうびゲット',
                windowLabel: '4/8にクリア',
                completed: true,
                completedAt: '2026-04-08T08:00:00.000Z',
            },
        ]);
    });

    it('builds participant detail with attempts ordered newest first and latest progress from the status row', () => {
        const challenge = makeChallenge({ title: '4月チャレンジ' });
        const participantStatuses: ParticipantStatusItem[] = [{
            memberId: 'member-1',
            name: 'あい',
            progressLabel: '2回目・1/3',
            subLabel: '再挑戦中',
            attemptLabel: '2回目',
            windowLabel: '4/17まで',
            completed: false,
            progress: 1,
            completedAt: null,
            attemptNo: 2,
        }];

        const detail = buildParticipantDetail(
            challenge,
            'member-1',
            participantStatuses,
            [
                makeAttempt('member-1', 1, {
                    status: 'completed',
                    effectiveStartDate: '2026-04-01',
                    effectiveEndDate: '2026-04-07',
                    completedAt: '2026-04-07T10:00:00.000Z',
                }),
                makeAttempt('member-1', 2, {
                    status: 'active',
                    effectiveStartDate: '2026-04-11',
                    effectiveEndDate: '2026-04-17',
                }),
                makeAttempt('other-member', 3),
                makeAttempt('member-1', 3, { challengeId: 'other-challenge' }),
            ],
        );

        expect(detail).toMatchObject({
            memberId: 'member-1',
            name: 'あい',
            challengeTitle: '4月チャレンジ',
            latestAttemptLabel: '2回目',
            latestStatusLabel: '再挑戦中',
            latestProgressLabel: '2回目・1/3',
            latestWindowLabel: '4/17まで',
            previousClearLabel: '4/7にクリア',
        });
        expect(detail?.attempts).toEqual([
            {
                id: 'attempt-member-1-2',
                attemptLabel: '2回目の挑戦',
                statusLabel: '進めているよ',
                progressLabel: '2回目・1/3',
                periodLabel: '4/11〜17 の期間',
                completedLabel: null,
                isLatest: true,
            },
            {
                id: 'attempt-member-1-1',
                attemptLabel: '1回目の挑戦',
                statusLabel: 'クリア',
                progressLabel: 'クリア',
                periodLabel: '4/1〜7 の期間',
                completedLabel: '4/7にクリア',
                isLatest: false,
            },
        ]);
    });

    it('returns null for unknown participants and falls back to status data when attempt rows are absent', () => {
        const challenge = makeChallenge();
        const participantStatuses: ParticipantStatusItem[] = [{
            memberId: 'legacy-member',
            name: 'そら',
            progressLabel: 'クリア',
            subLabel: 'ごほうびゲット',
            attemptLabel: '1回目',
            windowLabel: '4/9にクリア',
            completed: true,
            progress: 3,
            completedAt: '2026-04-09T12:00:00.000Z',
            attemptNo: 1,
        }];

        expect(buildParticipantDetail(challenge, 'missing-member', participantStatuses, [])).toBeNull();
        expect(buildParticipantDetail(challenge, 'legacy-member', participantStatuses, [])?.attempts).toEqual([{
            id: 'challenge-1-legacy-member-legacy',
            attemptLabel: '1回目',
            statusLabel: 'ごほうびゲット',
            progressLabel: 'クリア',
            periodLabel: '4/9にクリア',
            completedLabel: '4/9にクリア',
            isLatest: true,
        }]);
    });
});
