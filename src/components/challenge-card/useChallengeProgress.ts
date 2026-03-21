import { useEffect, useRef, useState } from 'react';
import {
    countChallengeProgress,
    markChallengeRewardGranted,
    getChallengeGoalTarget,
    markChallengeComplete,
    type Challenge,
} from '../../lib/challenges';
import type { ChibifuwaRecord } from '../../store/useAppStore';
import type { ChallengeProgressWindow } from '../../lib/challenge-engine';

interface UseChallengeProgressParams {
    challenge: Challenge;
    enabled?: boolean;
    isJoined: boolean;
    allCompleted: boolean;
    activeUserIds: string[];
    completedUserIds: Set<string>;
    rewardGrantedUserIds: Set<string>;
    effectiveWindow?: ChallengeProgressWindow | null;
    addChibifuwa: (userId: string, record: Omit<ChibifuwaRecord, 'id'>) => void;
    addChallengeStars: (userId: string, amount: number) => void;
    onCompleted: () => void;
    onRewardGranted?: (memberId: string) => void;
}

export function useChallengeProgress({
    challenge,
    enabled = true,
    isJoined,
    allCompleted,
    activeUserIds,
    completedUserIds,
    rewardGrantedUserIds,
    effectiveWindow,
    addChibifuwa,
    addChallengeStars,
    onCompleted,
    onRewardGranted,
}: UseChallengeProgressParams) {
    const [progress, setProgress] = useState(0);
    const checkingRef = useRef(false);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        if (!isJoined) {
            setProgress(0);
            return;
        }

        let cancelled = false;
        let requestId = 0;

        const refreshProgress = () => {
            const currentRequestId = requestId + 1;
            requestId = currentRequestId;

            countChallengeProgress(challenge, activeUserIds, effectiveWindow).then((count) => {
                if (!cancelled && currentRequestId === requestId) {
                    setProgress(count);
                }
            }).catch((error) => {
                console.warn('[challenges] Failed to refresh challenge progress:', error);
            });
        };

        refreshProgress();

        const handleSessionSaved = () => {
            refreshProgress();
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                refreshProgress();
            }
        };

        window.addEventListener('sessionSaved', handleSessionSaved);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            cancelled = true;
            window.removeEventListener('sessionSaved', handleSessionSaved);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [challenge, activeUserIds, effectiveWindow, enabled, isJoined]);

    useEffect(() => {
        const goalTarget = getChallengeGoalTarget(challenge);
        if (!isJoined) return;
        if (progress < goalTarget || allCompleted || checkingRef.current) return;

        checkingRef.current = true;
        (async () => {
            for (const userId of activeUserIds) {
                if (!completedUserIds.has(userId)) {
                    await markChallengeComplete(challenge.id, userId).catch(console.warn);
                    if (!rewardGrantedUserIds.has(userId)) {
                        await markChallengeRewardGranted(challenge.id, userId).catch(console.warn);
                        if (challenge.rewardKind === 'star') {
                            addChallengeStars(userId, challenge.rewardValue);
                        } else if (challenge.rewardFuwafuwaType != null) {
                            addChibifuwa(userId, {
                                type: challenge.rewardFuwafuwaType,
                                challengeTitle: challenge.title,
                                earnedDate: new Date().toISOString().split('T')[0],
                            });
                        }
                        onRewardGranted?.(userId);
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
        rewardGrantedUserIds,
        addChibifuwa,
        addChallengeStars,
        onCompleted,
        onRewardGranted,
        isJoined,
    ]);

    return progress;
}
