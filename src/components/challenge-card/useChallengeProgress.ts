import { useEffect, useRef, useState } from 'react';
import {
    countChallengeProgress,
    getChallengeGoalTarget,
    markChallengeComplete,
    type Challenge,
} from '../../lib/challenges';
import type { ChibifuwaRecord } from '../../store/useAppStore';
import type { ChallengeProgressWindow } from '../../lib/challenge-engine';

interface UseChallengeProgressParams {
    challenge: Challenge;
    isJoined: boolean;
    allCompleted: boolean;
    activeUserIds: string[];
    completedUserIds: Set<string>;
    effectiveWindow?: ChallengeProgressWindow | null;
    addChibifuwa: (userId: string, record: Omit<ChibifuwaRecord, 'id'>) => void;
    addChallengeStars: (userId: string, amount: number) => void;
    onCompleted: () => void;
}

export function useChallengeProgress({
    challenge,
    isJoined,
    allCompleted,
    activeUserIds,
    completedUserIds,
    effectiveWindow,
    addChibifuwa,
    addChallengeStars,
    onCompleted,
}: UseChallengeProgressParams) {
    const [progress, setProgress] = useState(0);
    const checkingRef = useRef(false);

    useEffect(() => {
        if (!isJoined) return;

        let cancelled = false;
        countChallengeProgress(challenge, activeUserIds, effectiveWindow).then((count) => {
            if (!cancelled) {
                setProgress(count);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [challenge, activeUserIds, effectiveWindow, isJoined]);

    useEffect(() => {
        const goalTarget = getChallengeGoalTarget(challenge);
        if (!isJoined) return;
        if (progress < goalTarget || allCompleted || checkingRef.current) return;

        checkingRef.current = true;
        (async () => {
            for (const userId of activeUserIds) {
                if (!completedUserIds.has(userId)) {
                    await markChallengeComplete(challenge.id, userId).catch(console.warn);
                    if (challenge.rewardKind === 'star') {
                        addChallengeStars(userId, challenge.rewardValue);
                    } else if (challenge.rewardFuwafuwaType != null) {
                        addChibifuwa(userId, {
                            type: challenge.rewardFuwafuwaType,
                            challengeTitle: challenge.title,
                            earnedDate: new Date().toISOString().split('T')[0],
                        });
                    }
                }
            }
            onCompleted();
            checkingRef.current = false;
        })();
    }, [
        progress,
        challenge,
        allCompleted,
        activeUserIds,
        completedUserIds,
        addChibifuwa,
        addChallengeStars,
        onCompleted,
        isJoined,
    ]);

    return progress;
}
