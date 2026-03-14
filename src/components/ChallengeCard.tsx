import React, { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ChallengeDetailSheet } from './ChallengeDetailSheet';
import { ExpiredChallengeCard } from './challenge-card/ExpiredChallengeCard';
import { InviteChallengeCard } from './challenge-card/InviteChallengeCard';
import { ProgressChallengeCard } from './challenge-card/ProgressChallengeCard';
import { useChallengeProgress } from './challenge-card/useChallengeProgress';
import type { ChallengeCardProps } from './challenge-card/types';
import {
    createRollingChallengeWindow,
    getChallengeDailyCapLabel,
    getChallengeDeadlineLabel,
    getChallengeEmoji,
    getChallengeGoalLabel,
    getChallengeGoalTarget,
    getChallengeInviteWindowLabel,
    getChallengePeriodLabel,
    getChallengeProgressLabel,
    getChallengeTargetLabel,
    markChallengeJoined,
} from '../lib/challenges';
import type { ChallengeProgressWindow } from '../lib/challenge-engine';

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    completions,
    teacherExercises = [],
    onCompleted,
    expired,
}) => {
    const [detailOpen, setDetailOpen] = useState(false);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const users = useAppStore((state) => state.users);
    const addChibifuwa = useAppStore((state) => state.addChibifuwa);
    const addChallengeStars = useAppStore((state) => state.addChallengeStars);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);
    const challengeEnrollmentWindows = useAppStore((state) => state.challengeEnrollmentWindows);
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

    const effectiveWindow = useMemo<ChallengeProgressWindow | null>(() => {
        for (const userId of activeUserIds) {
            const window = challengeEnrollmentWindows[userId]?.[challenge.id];
            if (window) {
                return window;
            }
        }

        return null;
    }, [activeUserIds, challenge.id, challengeEnrollmentWindows]);

    const progress = useChallengeProgress({
        challenge,
        isJoined,
        allCompleted,
        activeUserIds,
        completedUserIds,
        effectiveWindow,
        addChibifuwa,
        addChallengeStars,
        onCompleted,
    });

    const emoji = getChallengeEmoji(challenge, teacherExercises);
    const targetLabel = getChallengeTargetLabel(challenge, teacherExercises);
    const goalTarget = getChallengeGoalTarget(challenge);
    const ratio = Math.min(progress / goalTarget, 1);
    const goalLabel = getChallengeGoalLabel(challenge, targetLabel);
    const progressLabel = getChallengeProgressLabel(challenge, progress);
    const dailyRuleLabel = getChallengeDailyCapLabel(challenge);
    const inviteWindowLabel = getChallengeInviteWindowLabel(challenge);
    const activeWindowLabel = getChallengePeriodLabel(challenge, effectiveWindow);
    const deadlineLabel = getChallengeDeadlineLabel(challenge, effectiveWindow);
    const handleJoin = () => {
        const nextWindow = challenge.windowType === 'rolling'
            ? createRollingChallengeWindow(challenge)
            : null;

        activeUserIds.forEach((userId) => {
            joinChallenge(userId, challenge.id, nextWindow);

            const effectiveWindow = nextWindow ?? {
                startDate: challenge.startDate,
                endDate: challenge.endDate,
            };

            markChallengeJoined(challenge.id, userId, effectiveWindow).catch((error) => {
                console.warn('[challenges] markChallengeJoined failed:', error);
            });
        });
        setDetailOpen(false);
    };

    if (expired) {
        const wasCompleted = activeUserIds.some((userId) => completedUserIds.has(userId));

        return (
            <>
                <ExpiredChallengeCard
                    challenge={challenge}
                    emoji={emoji}
                    goalLabel={goalLabel}
                    periodLabel={activeWindowLabel}
                    wasCompleted={wasCompleted}
                    dailyRuleLabel={dailyRuleLabel}
                    onOpenDetail={() => setDetailOpen(true)}
                />
                <ChallengeDetailSheet
                    open={detailOpen}
                    challenge={challenge}
                    teacherExercises={teacherExercises}
                    progress={progress}
                    effectiveWindow={effectiveWindow}
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
                    goalLabel={goalLabel}
                    periodLabel={inviteWindowLabel}
                    dailyRuleLabel={dailyRuleLabel}
                    onJoin={handleJoin}
                    onOpenDetail={() => setDetailOpen(true)}
                />
                <ChallengeDetailSheet
                    open={detailOpen}
                    challenge={challenge}
                    teacherExercises={teacherExercises}
                    progress={progress}
                    effectiveWindow={effectiveWindow}
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
                goalLabel={goalLabel}
                deadlineLabel={deadlineLabel}
                ratio={ratio}
                progressLabel={progressLabel}
                allCompleted={allCompleted}
                dailyRuleLabel={dailyRuleLabel}
                onOpenDetail={() => setDetailOpen(true)}
            />
            <ChallengeDetailSheet
                open={detailOpen}
                challenge={challenge}
                teacherExercises={teacherExercises}
                progress={progress}
                effectiveWindow={effectiveWindow}
                joined
                completed={allCompleted}
                onClose={() => setDetailOpen(false)}
                onJoin={handleJoin}
            />
        </>
    );
};
