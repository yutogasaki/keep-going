import { countChallengeProgressFromSessions } from '@/lib/challenge-engine';
import {
    getChallengeActiveWindow,
    getChallengeProgressLabel,
    getLatestChallengeAttempts,
    toChallengeEngineInput,
    type Challenge,
    type ChallengeAttempt,
    type ChallengeCompletion,
    type ChallengeEnrollment,
} from '@/lib/challenges';
import type { StudentSession } from '@/lib/teacher';
import type {
    ChallengeParticipantAttemptDetail,
    ChallengeParticipantDetailData,
} from './ChallengeParticipantDetailSheet';

export interface ParticipantStatusItem {
    memberId: string;
    name: string;
    progressLabel: string;
    subLabel: string;
    attemptLabel: string;
    windowLabel: string;
    completed: boolean;
    progress: number;
    completedAt: string | null;
    attemptNo: number;
}

function formatDateRangeLabel(startDate: string | null | undefined, endDate: string | null | undefined): string {
    if (!startDate || !endDate) {
        return '期間を確認中';
    }

    const [, startMonth, startDay] = startDate.split('-');
    const [, endMonth, endDay] = endDate.split('-');
    if (!startMonth || !startDay || !endMonth || !endDay) {
        return `${startDate} 〜 ${endDate}`;
    }

    return startMonth === endMonth
        ? `${Number(startMonth)}/${Number(startDay)}〜${Number(endDay)}`
        : `${Number(startMonth)}/${Number(startDay)}〜${Number(endMonth)}/${Number(endDay)}`;
}

function formatCompletedAtLabel(completedAt: string | null): string | null {
    if (!completedAt) {
        return null;
    }

    const [datePart] = completedAt.split('T');
    return formatDateLabel(datePart, 'にクリア');
}

function formatDateLabel(date: string | null | undefined, suffix: string): string {
    if (!date) {
        return suffix;
    }

    const [, month, day] = date.split('-');
    if (!month || !day) {
        return `${date}${suffix}`;
    }

    return `${Number(month)}/${Number(day)}${suffix}`;
}

export function buildParticipantStatusItems(
    challenge: Challenge,
    completions: ChallengeCompletion[],
    enrollments: ChallengeEnrollment[],
    attempts: ChallengeAttempt[],
    memberNameMap: ReadonlyMap<string, string>,
    sessionsByMemberId: ReadonlyMap<string, StudentSession[]>,
): ParticipantStatusItem[] {
    const completionMap = new Map(
        completions
            .filter((completion) => completion.challengeId === challenge.id)
            .map((completion) => [completion.memberId, completion]),
    );
    const enrollmentMap = new Map(
        enrollments
            .filter((enrollment) => enrollment.challengeId === challenge.id)
            .map((enrollment) => [enrollment.memberId, enrollment]),
    );
    const latestAttemptMap = getLatestChallengeAttempts(
        attempts.filter((attempt) => attempt.challengeId === challenge.id),
    );
    const participantIds = new Set<string>([
        ...completionMap.keys(),
        ...enrollmentMap.keys(),
        ...latestAttemptMap.keys(),
    ]);

    const items = [...participantIds].map((memberId) => {
        const completion = completionMap.get(memberId) ?? null;
        const enrollment = enrollmentMap.get(memberId) ?? null;
        const latestAttempt = latestAttemptMap.get(memberId) ?? null;
        const effectiveWindow = enrollment
            ? {
                  startDate: enrollment.effectiveStartDate,
                  endDate: enrollment.effectiveEndDate,
              }
            : latestAttempt
              ? {
                    startDate: latestAttempt.effectiveStartDate,
                    endDate: latestAttempt.effectiveEndDate,
                }
              : null;
        const sessions = sessionsByMemberId.get(memberId) ?? [];
        const progress = countChallengeProgressFromSessions(
            toChallengeEngineInput(challenge),
            sessions,
            [memberId],
            getChallengeActiveWindow(challenge, effectiveWindow),
        );
        const completed = completion !== null;
        const attemptNo = latestAttempt?.attemptNo ?? 1;
        const baseProgressLabel = completed ? 'クリア' : getChallengeProgressLabel(challenge, progress);
        const progressLabel = attemptNo > 1 ? `${attemptNo}回目・${baseProgressLabel}` : baseProgressLabel;
        const attemptLabel = attemptNo > 1 ? `${attemptNo}回目` : '1回目';
        const subLabel = completed
            ? attemptNo > 1
                ? 'もう一回クリア'
                : 'ごほうびゲット'
            : latestAttempt?.status === 'expired'
              ? '期間が終わった'
              : attemptNo > 1
                ? '再挑戦中'
                : progress > 0
                  ? '参加中'
                  : '参加したよ';
        const windowLabel = completed
            ? formatDateLabel(
                  (completion?.completedAt ?? latestAttempt?.completedAt ?? null)?.split('T')[0] ?? null,
                  'にクリア',
              )
            : formatDateLabel(effectiveWindow?.endDate ?? null, 'まで');

        return {
            memberId,
            name: memberNameMap.get(memberId) ?? '生徒',
            progressLabel,
            subLabel,
            attemptLabel,
            windowLabel,
            completed,
            progress,
            completedAt: completion?.completedAt ?? null,
            attemptNo,
        };
    });

    items.sort((left, right) => {
        if (left.completed !== right.completed) {
            return Number(left.completed) - Number(right.completed);
        }
        if (!left.completed && left.progress !== right.progress) {
            return right.progress - left.progress;
        }
        if (left.completed && right.completed && left.completedAt !== right.completedAt) {
            return (right.completedAt ?? '').localeCompare(left.completedAt ?? '');
        }
        return left.name.localeCompare(right.name, 'ja');
    });

    return items;
}

export function buildParticipantDetail(
    challenge: Challenge,
    memberId: string,
    participantStatuses: ParticipantStatusItem[],
    challengeAttempts: ChallengeAttempt[],
): ChallengeParticipantDetailData | null {
    const participant = participantStatuses.find((item) => item.memberId === memberId) ?? null;
    if (!participant) {
        return null;
    }

    const attempts = challengeAttempts
        .filter((attempt) => attempt.challengeId === challenge.id && attempt.memberId === memberId)
        .sort((left, right) => right.attemptNo - left.attemptNo);

    const attemptDetails: ChallengeParticipantAttemptDetail[] = attempts.map((attempt, index) => {
        const statusLabel =
            attempt.status === 'completed'
                ? 'クリア'
                : attempt.status === 'expired'
                  ? '期間が終わった'
                  : '進めているよ';
        const progressLabel = index === 0 ? participant.progressLabel : statusLabel;
        return {
            id: attempt.id,
            attemptLabel: attempt.attemptNo > 1 ? `${attempt.attemptNo}回目の挑戦` : '1回目の挑戦',
            statusLabel,
            progressLabel,
            periodLabel: `${formatDateRangeLabel(attempt.effectiveStartDate, attempt.effectiveEndDate)} の期間`,
            completedLabel: formatCompletedAtLabel(attempt.completedAt),
            isLatest: index === 0,
        };
    });

    const previousCompletedAttempt = attempts.find((attempt) => attempt.status === 'completed');

    return {
        memberId: participant.memberId,
        name: participant.name,
        challengeTitle: challenge.title,
        latestAttemptLabel: participant.attemptLabel,
        latestStatusLabel: participant.subLabel,
        latestProgressLabel: participant.progressLabel,
        latestWindowLabel: participant.windowLabel,
        previousClearLabel: previousCompletedAttempt?.completedAt
            ? formatCompletedAtLabel(previousCompletedAttempt.completedAt)
            : null,
        attempts:
            attemptDetails.length > 0
                ? attemptDetails
                : [
                      {
                          id: `${challenge.id}-${memberId}-legacy`,
                          attemptLabel: participant.attemptLabel,
                          statusLabel: participant.subLabel,
                          progressLabel: participant.progressLabel,
                          periodLabel: participant.windowLabel,
                          completedLabel: participant.completedAt
                              ? formatCompletedAtLabel(participant.completedAt)
                              : null,
                          isLatest: true,
                      },
                  ],
    };
}
