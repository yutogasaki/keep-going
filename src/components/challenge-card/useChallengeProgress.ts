import { useEffect, useRef, useState } from 'react';
import { countExerciseInPeriod, markChallengeComplete, type Challenge } from '../../lib/challenges';
import type { ChibifuwaRecord } from '../../store/useAppStore';

interface UseChallengeProgressParams {
    challenge: Challenge;
    isJoined: boolean;
    allCompleted: boolean;
    activeUserIds: string[];
    completedUserIds: Set<string>;
    addChibifuwa: (userId: string, record: Omit<ChibifuwaRecord, 'id'>) => void;
    onCompleted: () => void;
}

export function useChallengeProgress({
    challenge,
    isJoined,
    allCompleted,
    activeUserIds,
    completedUserIds,
    addChibifuwa,
    onCompleted,
}: UseChallengeProgressParams) {
    const [progress, setProgress] = useState(0);
    const checkingRef = useRef(false);

    useEffect(() => {
        if (!isJoined) return;

        let cancelled = false;
        countExerciseInPeriod(
            challenge.exerciseId,
            challenge.startDate,
            challenge.endDate,
            activeUserIds,
        ).then((count) => {
            if (!cancelled) {
                setProgress(count);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [challenge.exerciseId, challenge.startDate, challenge.endDate, activeUserIds, isJoined]);

    useEffect(() => {
        if (!isJoined) return;
        if (progress < challenge.targetCount || allCompleted || checkingRef.current) return;

        checkingRef.current = true;
        (async () => {
            for (const userId of activeUserIds) {
                if (!completedUserIds.has(userId)) {
                    await markChallengeComplete(challenge.id, userId).catch(console.warn);
                    addChibifuwa(userId, {
                        type: challenge.rewardFuwafuwaType,
                        challengeTitle: challenge.title,
                        earnedDate: new Date().toISOString().split('T')[0],
                    });
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
        onCompleted,
        isJoined,
    ]);

    return progress;
}
