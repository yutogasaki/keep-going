import React, { useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { CLASS_EMOJI, EXERCISES } from '@/data/exercises';
import { PRESET_GROUPS } from '@/data/menuGroups';
import {
    getChallengeCardText,
    getChallengeDailyCapLabel,
    getChallengeGoalLabel,
    getChallengeInviteWindowLabel,
    getChallengePublishLabel,
    getChallengeRetryStats,
    getChallengeRewardLabel,
    getChallengeTargetLabel,
    type Challenge,
    type ChallengeAttempt,
    type ChallengeCompletion,
    type ChallengeEnrollment,
} from '@/lib/challenges';
import { getTodayKey } from '@/lib/db';
import type { StudentSession } from '@/lib/teacher';
import type { TeacherExercise, TeacherMenu } from '@/lib/teacherContent';
import { getTeacherVisibilityLabel } from '@/lib/teacherExerciseMetadata';
import { ChallengeParticipantList } from './ChallengeParticipantList';
import {
    ChallengeParticipantDetailSheet,
    type ChallengeParticipantDetailData,
} from './ChallengeParticipantDetailSheet';
import { buildParticipantStatusItems } from './challengeParticipantListUtils';

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
                    ? (EXERCISES.find((item) => item.id === challenge.exerciseId) ??
                      teacherExerciseMap.get(challenge.exerciseId))
                    : null;
                const presetMenu = challenge.targetMenuId
                    ? PRESET_GROUPS.find((menu) => menu.id === challenge.targetMenuId)
                    : null;
                const teacherMenu = challenge.targetMenuId ? teacherMenuMap.get(challenge.targetMenuId) : null;
                const targetLabel =
                    challenge.challengeType === 'menu'
                        ? ((challenge.menuSource === 'preset' ? presetMenu?.name : teacherMenu?.name) ??
                          challenge.targetMenuId ??
                          'メニュー')
                        : getChallengeTargetLabel(challenge, teacherExercises);
                const targetMetadata =
                    challenge.challengeType === 'menu'
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

                return (
                    <div
                        key={challenge.id}
                        className="card"
                        style={{
                            padding: '14px 16px',
                            opacity: isPast ? 0.5 : 1,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>
                                {challenge.iconEmoji ??
                                    exercise?.emoji ??
                                    presetMenu?.emoji ??
                                    teacherMenu?.emoji ??
                                    '🎯'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        flexWrap: 'wrap',
                                    }}
                                >
                                    {challenge.title}
                                    {isActive && (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                padding: '2px 6px',
                                                borderRadius: 6,
                                                background: '#E8F8F0',
                                                color: '#2BBAA0',
                                                fontWeight: 700,
                                            }}
                                        >
                                            開催中
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#8395A7',
                                        marginTop: 2,
                                    }}
                                >
                                    {goalLabel} ・{getChallengeDailyCapLabel(challenge)} ・
                                    {getChallengeRewardLabel(challenge)} ・{windowLabel}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#94A3B8',
                                        marginTop: 2,
                                    }}
                                >
                                    {getChallengePublishLabel(challenge)}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        color: '#52606D',
                                        marginTop: 4,
                                        fontWeight: 700,
                                    }}
                                >
                                    {participantStatuses.length > 0
                                        ? `参加 ${participantStatuses.length}人 ・ クリア ${completedCount}人`
                                        : 'まだ参加している人はいません'}
                                </div>
                                {challengeAttemptStats.totalAttempts > 0 ? (
                                    <div
                                        style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 10,
                                            color: '#8395A7',
                                            marginTop: 4,
                                        }}
                                    >
                                        {`これまで ${challengeAttemptStats.totalAttempts}回挑戦 ・ 再挑戦中 ${challengeAttemptStats.retryingMemberCount}人${
                                            challengeAttemptStats.repeatCompletionCount > 0
                                                ? ` ・ もう一回クリア ${challengeAttemptStats.repeatCompletionCount}回`
                                                : ''
                                        }`}
                                    </div>
                                ) : null}
                                {cardText && (
                                    <div
                                        style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 11,
                                            color: '#52606D',
                                            marginTop: 4,
                                        }}
                                    >
                                        {cardText}
                                    </div>
                                )}
                                <ChallengeParticipantList
                                    challenge={challenge}
                                    challengeAttempts={challengeAttempts}
                                    participantStatuses={participantStatuses}
                                    expanded={isParticipantListExpanded}
                                    onExpandedChange={(expanded) =>
                                        setExpandedParticipantLists((current) => ({
                                            ...current,
                                            [challenge.id]: expanded,
                                        }))
                                    }
                                    onSelectParticipant={(participant) => {
                                        setSelectedChallenge(challenge);
                                        setSelectedParticipant(participant);
                                    }}
                                />
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 4,
                                        flexWrap: 'wrap',
                                        marginTop: 4,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 6,
                                            background: challenge.tier === 'small' ? '#FFF8E1' : '#FFF3CC',
                                            color: challenge.tier === 'small' ? '#C58B00' : '#B8860B',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontWeight: 700,
                                        }}
                                    >
                                        {challenge.tier === 'small' ? 'ちょい' : '大きい'}
                                    </span>
                                    {challenge.classLevels.length === 0 ? (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                background: '#F0F3F5',
                                                color: '#8395A7',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontWeight: 600,
                                            }}
                                        >
                                            全クラス
                                        </span>
                                    ) : (
                                        challenge.classLevels.map((classLevel) => (
                                            <span
                                                key={classLevel}
                                                style={{
                                                    fontSize: 10,
                                                    padding: '1px 6px',
                                                    borderRadius: 6,
                                                    background: '#F3EEFF',
                                                    color: '#6C5CE7',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {CLASS_EMOJI[classLevel] ?? ''}
                                                {classLevel}
                                            </span>
                                        ))
                                    )}
                                    {targetMetadata?.recommended ? (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                background: '#E8F8F0',
                                                color: '#2BBAA0',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {targetMetadata.recommendedOrder != null
                                                ? `おすすめ ${targetMetadata.recommendedOrder}`
                                                : 'おすすめ'}
                                        </span>
                                    ) : null}
                                    {targetMetadata?.visibility && targetMetadata.visibility !== 'public' ? (
                                        <span
                                            style={{
                                                fontSize: 10,
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                background: 'rgba(9, 132, 227, 0.1)',
                                                color: '#0984E3',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontWeight: 700,
                                            }}
                                        >
                                            {getTeacherVisibilityLabel(targetMetadata.visibility)}
                                        </span>
                                    ) : null}
                                </div>
                                {participantStatuses.length > 0 ? (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 10,
                                            color: '#8395A7',
                                        }}
                                    >
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
