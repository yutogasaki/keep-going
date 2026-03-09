import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ChallengeDetailSheet } from './ChallengeDetailSheet';
import { ExpiredChallengeCard } from './challenge-card/ExpiredChallengeCard';
import { InviteChallengeCard } from './challenge-card/InviteChallengeCard';
import { ProgressChallengeCard } from './challenge-card/ProgressChallengeCard';
import { getChallengeDateLabel, getChallengeDaysLeft } from './challenge-card/challengeCardUtils';
import { useChallengeProgress } from './challenge-card/useChallengeProgress';
import type { ChallengeCardProps } from './challenge-card/types';
import { getChallengeDailyCapLabel, getChallengeEmoji, getChallengeTargetLabel } from '../lib/challenges';

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    completions,
    onCompleted,
    expired,
}) => {
    const [detailOpen, setDetailOpen] = useState(false);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const users = useAppStore((state) => state.users);
    const addChibifuwa = useAppStore((state) => state.addChibifuwa);
    const addChallengeStars = useAppStore((state) => state.addChallengeStars);
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
        addChallengeStars,
        onCompleted,
    });

    const emoji = getChallengeEmoji(challenge);
    const targetLabel = getChallengeTargetLabel(challenge);
    const ratio = Math.min(progress / challenge.targetCount, 1);

    const dateLabel = getChallengeDateLabel(challenge.startDate, challenge.endDate);
    const daysLeft = getChallengeDaysLeft(challenge.endDate);
    const handleJoin = () => {
        activeUserIds.forEach((userId) => joinChallenge(userId, challenge.id));
        setDetailOpen(false);
    };

    if (expired) {
        const wasCompleted = activeUserIds.some((userId) => completedUserIds.has(userId));

        return (
            <>
                <ExpiredChallengeCard
                    challenge={challenge}
                    emoji={emoji}
                    targetLabel={targetLabel}
                    dateLabel={dateLabel}
                    wasCompleted={wasCompleted}
                    dailyCapLabel={getChallengeDailyCapLabel(challenge)}
                    onOpenDetail={() => setDetailOpen(true)}
                />
                <ChallengeDetailSheet
                    open={detailOpen}
                    challenge={challenge}
                    progress={progress}
                    joined={isJoined}
                    completed={wasCompleted}
                    onClose={() => setDetailOpen(false)}
                    onJoin={handleJoin}
                />
            </>
        );
    }

    if (!isJoined) {
        return (
            <>
                <InviteChallengeCard
                    challenge={challenge}
                    emoji={emoji}
                    targetLabel={targetLabel}
                    dateLabel={dateLabel}
                    dailyCapLabel={getChallengeDailyCapLabel(challenge)}
                    onJoin={handleJoin}
                    onOpenDetail={() => setDetailOpen(true)}
                />
                <ChallengeDetailSheet
                    open={detailOpen}
                    challenge={challenge}
                    progress={progress}
                    joined={false}
                    completed={false}
                    onClose={() => setDetailOpen(false)}
                    onJoin={handleJoin}
                />
            </>
        );
    }

    return (
        <>
            <ProgressChallengeCard
                challenge={challenge}
                emoji={emoji}
                targetLabel={targetLabel}
                daysLeft={daysLeft}
                ratio={ratio}
                progress={progress}
                allCompleted={allCompleted}
                dailyCapLabel={getChallengeDailyCapLabel(challenge)}
                onOpenDetail={() => setDetailOpen(true)}
            />
            <ChallengeDetailSheet
                open={detailOpen}
                challenge={challenge}
                progress={progress}
                joined
                completed={allCompleted}
                onClose={() => setDetailOpen(false)}
                onJoin={handleJoin}
            />
        </>
    );
};
