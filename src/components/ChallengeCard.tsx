import React, { useMemo } from 'react';
import { EXERCISES } from '../data/exercises';
import { useAppStore } from '../store/useAppStore';
import { ExpiredChallengeCard } from './challenge-card/ExpiredChallengeCard';
import { InviteChallengeCard } from './challenge-card/InviteChallengeCard';
import { ProgressChallengeCard } from './challenge-card/ProgressChallengeCard';
import { getChallengeDateLabel, getChallengeDaysLeft } from './challenge-card/challengeCardUtils';
import { useChallengeProgress } from './challenge-card/useChallengeProgress';
import type { ChallengeCardProps } from './challenge-card/types';

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    completions,
    onCompleted,
    expired,
}) => {
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const users = useAppStore((state) => state.users);
    const addChibifuwa = useAppStore((state) => state.addChibifuwa);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);
    const joinChallenge = useAppStore((state) => state.joinChallenge);

    const activeUserIds = useMemo(
        () => (sessionUserIds.length > 0 ? sessionUserIds : users.map((user) => user.id)),
        [sessionUserIds, users],
    );

    const isJoined = activeUserIds.some(
        (userId) => (joinedChallengeIds[userId] || []).includes(challenge.id),
    );

    const completedUserIds = useMemo(
        () => new Set(
            completions
                .filter((completion) => completion.challengeId === challenge.id)
                .map((completion) => completion.memberId),
        ),
        [completions, challenge.id],
    );

    const allCompleted = activeUserIds.every((userId) => completedUserIds.has(userId));

    const progress = useChallengeProgress({
        challenge,
        isJoined,
        allCompleted,
        activeUserIds,
        completedUserIds,
        addChibifuwa,
        onCompleted,
    });

    const exercise = EXERCISES.find((item) => item.id === challenge.exerciseId);
    const emoji = exercise?.emoji || '🎯';
    const exerciseName = exercise?.name || challenge.exerciseId;
    const ratio = Math.min(progress / challenge.targetCount, 1);

    const dateLabel = getChallengeDateLabel(challenge.startDate, challenge.endDate);
    const daysLeft = getChallengeDaysLeft(challenge.endDate);

    if (expired) {
        const wasCompleted = activeUserIds.some((userId) => completedUserIds.has(userId));

        return (
            <ExpiredChallengeCard
                challenge={challenge}
                emoji={emoji}
                exerciseName={exerciseName}
                dateLabel={dateLabel}
                wasCompleted={wasCompleted}
            />
        );
    }

    if (!isJoined) {
        return (
            <InviteChallengeCard
                challenge={challenge}
                emoji={emoji}
                exerciseName={exerciseName}
                dateLabel={dateLabel}
                onJoin={() => activeUserIds.forEach((userId) => joinChallenge(userId, challenge.id))}
            />
        );
    }

    return (
        <ProgressChallengeCard
            challenge={challenge}
            emoji={emoji}
            exerciseName={exerciseName}
            daysLeft={daysLeft}
            ratio={ratio}
            progress={progress}
            allCompleted={allCompleted}
        />
    );
};
