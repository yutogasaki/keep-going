import {
    getChallengeEmoji,
    type Challenge,
    type ChallengeCompletion,
    type ChallengeRewardGrant,
    type ChallengeRewardKind,
} from '../../lib/challenges';
import type { TeacherExercise } from '../../lib/teacherContent';
import type { UserProfileStore } from '../../store/useAppStore';

export interface ChallengeRewardScene {
    id: string;
    challengeId: string;
    source: 'teacher' | 'personal';
    title: string;
    memberId: string;
    memberName: string | null;
    rewardKind: ChallengeRewardKind;
    rewardValue: number;
    accentEmoji: string;
}

interface TeacherChallengeCompletedTodayParams {
    challengeId: string;
    activeUserIds: string[];
    completions: Pick<ChallengeCompletion, 'challengeId' | 'memberId' | 'completedAt'>[];
    today: string;
}

interface BuildTeacherChallengeRewardScenesParams {
    rewardGrants: ChallengeRewardGrant[];
    challenges: Challenge[];
    users: UserProfileStore[];
    teacherExercises?: TeacherExercise[];
}

export function isTeacherChallengeCompletedToday({
    challengeId,
    activeUserIds,
    completions,
    today,
}: TeacherChallengeCompletedTodayParams): boolean {
    const relevantCompletions = completions.filter((completion) => (
        completion.challengeId === challengeId && activeUserIds.includes(completion.memberId)
    ));

    if (relevantCompletions.length === 0) {
        return false;
    }

    const completedUserIds = new Set(relevantCompletions.map((completion) => completion.memberId));
    if (!activeUserIds.every((userId) => completedUserIds.has(userId))) {
        return false;
    }

    const latestCompletedAt = relevantCompletions.reduce(
        (latest, completion) => (completion.completedAt > latest ? completion.completedAt : latest),
        '',
    );

    return latestCompletedAt.slice(0, 10) === today;
}

export function buildTeacherChallengeRewardScenes({
    rewardGrants,
    challenges,
    users,
    teacherExercises = [],
}: BuildTeacherChallengeRewardScenesParams): ChallengeRewardScene[] {
    const challengesById = new Map(challenges.map((challenge) => [challenge.id, challenge]));
    const usersById = new Map(users.map((user) => [user.id, user]));

    return rewardGrants.flatMap((grant) => {
        const challenge = challengesById.get(grant.challengeId);
        if (!challenge) {
            return [];
        }

        return [{
            id: `teacher:${grant.id}`,
            challengeId: challenge.id,
            source: 'teacher' as const,
            title: challenge.title,
            memberId: grant.memberId,
            memberName: usersById.get(grant.memberId)?.name ?? null,
            rewardKind: challenge.rewardKind,
            rewardValue: challenge.rewardValue,
            accentEmoji: getChallengeEmoji(challenge, teacherExercises),
        }];
    });
}
