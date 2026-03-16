import React, { useState } from 'react';
import { ChevronRight, Loader2, Pencil, Trash2 } from 'lucide-react';
import { countChallengeProgressFromSessions } from '../../../lib/challenge-engine';
import { getTodayKey } from '../../../lib/db';
import { CLASS_EMOJI, EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import {
    getChallengeActiveWindow,
    getChallengeCardText,
    getChallengeDailyCapLabel,
    getChallengeGoalLabel,
    getChallengeInviteWindowLabel,
    getChallengeProgressLabel,
    getChallengePublishLabel,
    getChallengeRetryStats,
    getChallengeRewardLabel,
    getChallengeTargetLabel,
    type Challenge,
    type ChallengeAttempt,
    type ChallengeCompletion,
    type ChallengeEnrollment,
    getLatestChallengeAttempts,
} from '../../../lib/challenges';
import type { StudentSession } from '../../../lib/teacher';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import { getTeacherVisibilityLabel } from '../../../lib/teacherExerciseMetadata';
import {
    ChallengeParticipantDetailSheet,
    type ChallengeParticipantAttemptDetail,
    type ChallengeParticipantDetailData,
} from './ChallengeParticipantDetailSheet';

interface ChallengeListProps {
    loading: boolean;
    challenges: Challenge[];
    challengeCompletions: ChallengeCompletion[];
    challengeEnrollments: ChallengeEnrollment[];
    challengeAttempts: ChallengeAttempt[];
    memberNameMap: ReadonlyMap<string, string>;
    sessionsByMemberId: ReadonlyMap<string, StudentSession[]>;
    teacherMenus: TeacherMenu[];
    teacherExercises: TeacherExercise[];
    onOpenStudentRecord: (memberId: string) => void;
    onEdit: (challenge: Challenge) => void;
    onDelete: (challengeId: string) => void;
}

interface ParticipantStatusItem {
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

    const [year, month, day] = date.split('-');
    void year;
    if (!month || !day) {
        return `${date}${suffix}`;
    }

    return `${Number(month)}/${Number(day)}${suffix}`;
}

function buildParticipantStatusItems(
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
            challenge,
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
            ? (attemptNo > 1 ? 'もう一回クリア' : 'ごほうびゲット')
            : latestAttempt?.status === 'expired'
                ? '期間が終わった'
            : attemptNo > 1
                ? '再挑戦中'
                : progress > 0
                    ? '参加中'
                    : '参加したよ';
        const windowLabel = completed
            ? formatDateLabel((completion?.completedAt ?? latestAttempt?.completedAt ?? null)?.split('T')[0] ?? null, 'にクリア')
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

function buildParticipantDetail(
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
        const statusLabel = attempt.status === 'completed'
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
        attempts: attemptDetails.length > 0
            ? attemptDetails
            : [{
                id: `${challenge.id}-${memberId}-legacy`,
                attemptLabel: participant.attemptLabel,
                statusLabel: participant.subLabel,
                progressLabel: participant.progressLabel,
                periodLabel: participant.windowLabel,
                completedLabel: participant.completedAt ? formatCompletedAtLabel(participant.completedAt) : null,
                isLatest: true,
            }],
    };
}

export const ChallengeList: React.FC<ChallengeListProps> = ({
    loading,
    challenges,
    challengeCompletions,
    challengeEnrollments,
    challengeAttempts,
    memberNameMap,
    sessionsByMemberId,
    teacherMenus,
    teacherExercises,
    onOpenStudentRecord,
    onEdit,
    onDelete,
}) => {
    const today = getTodayKey();
    const teacherMenuMap = new Map(teacherMenus.map((menu) => [menu.id, menu]));
    const teacherExerciseMap = new Map(teacherExercises.map((exercise) => [exercise.id, exercise]));
    const [expandedParticipantLists, setExpandedParticipantLists] = useState<Record<string, boolean>>({});
    const [selectedParticipant, setSelectedParticipant] = useState<ChallengeParticipantDetailData | null>(null);
    const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 48, color: '#8395A7' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, margin: '12px 0 0' }}>
                    読み込み中...
                </p>
            </div>
        );
    }

    if (challenges.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: '#8395A7', margin: 0 }}>
                    チャレンジがありません
                </p>
            </div>
        );
    }

    return (
        <>
            {challenges.map((challenge) => {
                const exercise = challenge.exerciseId
                    ? EXERCISES.find((item) => item.id === challenge.exerciseId)
                        ?? teacherExerciseMap.get(challenge.exerciseId)
                    : null;
                const presetMenu = challenge.targetMenuId
                    ? PRESET_GROUPS.find((menu) => menu.id === challenge.targetMenuId)
                    : null;
                const teacherMenu = challenge.targetMenuId
                    ? teacherMenuMap.get(challenge.targetMenuId)
                    : null;
                const targetLabel = challenge.challengeType === 'menu'
                    ? (challenge.menuSource === 'preset' ? presetMenu?.name : teacherMenu?.name) ?? challenge.targetMenuId ?? 'メニュー'
                    : getChallengeTargetLabel(challenge, teacherExercises);
                const targetMetadata = challenge.challengeType === 'menu'
                    ? teacherMenu
                    : challenge.challengeType === 'exercise'
                        ? teacherExerciseMap.get(challenge.exerciseId ?? '')
                        : null;
                const isActive = challenge.startDate <= today && challenge.endDate >= today;
                const isPast = challenge.endDate < today;
                const cardText = getChallengeCardText(challenge);
                const goalLabel = getChallengeGoalLabel(challenge, targetLabel);
                const windowLabel = getChallengeInviteWindowLabel(challenge);
                const participantStatuses = buildParticipantStatusItems(
                    challenge,
                    challengeCompletions,
                    challengeEnrollments,
                    challengeAttempts,
                    memberNameMap,
                    sessionsByMemberId,
                );
                const challengeAttemptStats = getChallengeRetryStats(
                    challengeAttempts.filter((attempt) => attempt.challengeId === challenge.id),
                );
                const completedCount = participantStatuses.filter((item) => item.completed).length;
                const isParticipantListExpanded = expandedParticipantLists[challenge.id] === true;
                const visibleParticipants = isParticipantListExpanded
                    ? participantStatuses
                    : participantStatuses.slice(0, 6);
                const hiddenParticipantCount = isParticipantListExpanded
                    ? 0
                    : Math.max(0, participantStatuses.length - visibleParticipants.length);
                const participantDetailsByMemberId = new Map(
                    participantStatuses.map((item) => [
                        item.memberId,
                        buildParticipantDetail(challenge, item.memberId, participantStatuses, challengeAttempts),
                    ]),
                );

                return (
                    <div key={challenge.id} className="card" style={{
                        padding: '14px 16px',
                        opacity: isPast ? 0.5 : 1,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>
                                {challenge.iconEmoji ?? exercise?.emoji ?? presetMenu?.emoji ?? teacherMenu?.emoji ?? '🎯'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                }}>
                                    {challenge.title}
                                    {isActive && (
                                        <span style={{
                                            fontSize: 10,
                                            padding: '2px 6px',
                                            borderRadius: 6,
                                            background: '#E8F8F0',
                                            color: '#2BBAA0',
                                            fontWeight: 700,
                                        }}>
                                            開催中
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    marginTop: 2,
                                }}>
                                    {goalLabel} ・
                                    {getChallengeDailyCapLabel(challenge)} ・
                                    {getChallengeRewardLabel(challenge)} ・
                                    {windowLabel}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#94A3B8',
                                    marginTop: 2,
                                }}>
                                    {getChallengePublishLabel(challenge)}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#52606D',
                                    marginTop: 4,
                                    fontWeight: 700,
                                }}>
                                    {participantStatuses.length > 0
                                        ? `参加 ${participantStatuses.length}人 ・ クリア ${completedCount}人`
                                        : 'まだ参加している人はいません'}
                                </div>
                                {challengeAttemptStats.totalAttempts > 0 ? (
                                    <div style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 10,
                                        color: '#8395A7',
                                        marginTop: 4,
                                    }}>
                                        {`これまで ${challengeAttemptStats.totalAttempts}回挑戦 ・ 再挑戦中 ${challengeAttemptStats.retryingMemberCount}人${
                                            challengeAttemptStats.repeatCompletionCount > 0
                                                ? ` ・ もう一回クリア ${challengeAttemptStats.repeatCompletionCount}回`
                                                : ''
                                        }`}
                                    </div>
                                ) : null}
                                {cardText && (
                                    <div style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#52606D',
                                        marginTop: 4,
                                    }}>
                                        {cardText}
                                    </div>
                                )}
                                {participantStatuses.length > 0 ? (
                                    <div style={{
                                        display: 'grid',
                                        gap: 6,
                                        marginTop: 6,
                                    }}>
                                        {visibleParticipants.map((item) => (
                                            <button
                                                type="button"
                                                key={`${challenge.id}-${item.memberId}`}
                                                onClick={() => {
                                                    setSelectedChallenge(challenge);
                                                    setSelectedParticipant(participantDetailsByMemberId.get(item.memberId) ?? null);
                                                }}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                                                    gap: 6,
                                                    alignItems: 'center',
                                                    padding: '7px 9px',
                                                    borderRadius: 10,
                                                    background: item.completed
                                                        ? '#E8F8F0'
                                                        : item.subLabel === '期間が終わった'
                                                            ? '#F5F5F5'
                                                                : item.progress > 0
                                                                    ? 'rgba(9, 132, 227, 0.08)'
                                                                    : '#F8FAFC',
                                                    border: 'none',
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{
                                                        fontFamily: "'Noto Sans JP', sans-serif",
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: '#2D3436',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        flexWrap: 'wrap',
                                                    }}>
                                                        <span>{item.name}</span>
                                                        <span style={{
                                                            fontSize: 10,
                                                            padding: '1px 6px',
                                                            borderRadius: 999,
                                                            background: '#FFFFFF',
                                                            color: '#52606D',
                                                            border: '1px solid rgba(0,0,0,0.05)',
                                                        }}>
                                                            {item.attemptLabel}
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        fontFamily: "'Noto Sans JP', sans-serif",
                                                        fontSize: 10,
                                                        color: '#6B7280',
                                                        marginTop: 2,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        flexWrap: 'wrap',
                                                    }}>
                                                        <span>{item.subLabel}</span>
                                                        <span style={{ color: '#CBD5E1' }}>•</span>
                                                        <span>{item.windowLabel}</span>
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 11,
                                                    fontWeight: 700,
                                                    color: item.completed
                                                        ? '#1E7F6D'
                                                        : item.subLabel === '期間が終わった'
                                                            ? '#94A3B8'
                                                            : item.progress > 0
                                                                ? '#0984E3'
                                                                : '#636E72',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {item.progressLabel}
                                                </div>
                                                <ChevronRight size={14} color="#94A3B8" />
                                            </button>
                                        ))}
                                        {hiddenParticipantCount > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setExpandedParticipantLists((current) => ({
                                                    ...current,
                                                    [challenge.id]: true,
                                                }))}
                                                style={{
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: '#8395A7',
                                                    background: '#F0F3F5',
                                                    borderRadius: 999,
                                                    padding: '4px 8px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    justifySelf: 'start',
                                                }}
                                            >
                                                +{hiddenParticipantCount}人 つづきを見る
                                            </button>
                                        ) : null}
                                        {isParticipantListExpanded && participantStatuses.length > 6 ? (
                                            <button
                                                type="button"
                                                onClick={() => setExpandedParticipantLists((current) => ({
                                                    ...current,
                                                    [challenge.id]: false,
                                                }))}
                                                style={{
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    color: '#64748B',
                                                    background: '#FFFFFF',
                                                    borderRadius: 999,
                                                    padding: '4px 8px',
                                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                                    cursor: 'pointer',
                                                    justifySelf: 'start',
                                                }}
                                            >
                                                参加者をたたむ
                                            </button>
                                        ) : null}
                                    </div>
                                ) : null}
                                <div style={{
                                    display: 'flex',
                                    gap: 4,
                                    flexWrap: 'wrap',
                                    marginTop: 4,
                                }}>
                                    <span style={{
                                        fontSize: 10,
                                        padding: '1px 6px',
                                        borderRadius: 6,
                                        background: challenge.tier === 'small' ? '#FFF8E1' : '#FFF3CC',
                                        color: challenge.tier === 'small' ? '#C58B00' : '#B8860B',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontWeight: 700,
                                    }}>
                                        {challenge.tier === 'small' ? 'ちょい' : '大きい'}
                                    </span>
                                    {challenge.classLevels.length === 0 ? (
                                        <span style={{
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 6,
                                            background: '#F0F3F5',
                                            color: '#8395A7',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontWeight: 600,
                                        }}>
                                            全クラス
                                        </span>
                                    ) : (
                                        challenge.classLevels.map((classLevel) => (
                                            <span key={classLevel} style={{
                                                fontSize: 10,
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                background: '#F3EEFF',
                                                color: '#6C5CE7',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontWeight: 600,
                                            }}>
                                                {CLASS_EMOJI[classLevel] ?? ''}{classLevel}
                                            </span>
                                        ))
                                    )}
                                    {targetMetadata?.recommended ? (
                                        <span style={{
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 6,
                                            background: '#E8F8F0',
                                            color: '#2BBAA0',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontWeight: 700,
                                        }}>
                                            {targetMetadata.recommendedOrder != null ? `おすすめ ${targetMetadata.recommendedOrder}` : 'おすすめ'}
                                        </span>
                                    ) : null}
                                    {targetMetadata?.visibility && targetMetadata.visibility !== 'public' ? (
                                        <span style={{
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 6,
                                            background: 'rgba(9, 132, 227, 0.1)',
                                            color: '#0984E3',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontWeight: 700,
                                        }}>
                                            {getTeacherVisibilityLabel(targetMetadata.visibility)}
                                        </span>
                                    ) : null}
                                </div>
                                {participantStatuses.length > 0 ? (
                                    <div style={{
                                        marginTop: 6,
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 10,
                                        color: '#8395A7',
                                    }}>
                                        {`${participantStatuses[0].name} は ${participantStatuses[0].attemptLabel}で ${participantStatuses[0].progressLabel} ・ ${participantStatuses[0].windowLabel}`}
                                    </div>
                                ) : null}
                            </div>
                            <button
                                onClick={() => onEdit(challenge)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#F0F3F5',
                                    color: '#8395A7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => onDelete(challenge.id)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#FFF0F0',
                                    color: '#E17055',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                );
            })}
            <ChallengeParticipantDetailSheet
                open={selectedParticipant !== null}
                challenge={selectedChallenge}
                participant={selectedParticipant}
                onOpenStudentRecord={(memberId) => {
                    onOpenStudentRecord(memberId);
                    setSelectedParticipant(null);
                    setSelectedChallenge(null);
                }}
                onClose={() => {
                    setSelectedParticipant(null);
                    setSelectedChallenge(null);
                }}
            />
        </>
    );
};
