import { useCallback, useEffect, useState } from 'react';
import { audio } from '../../lib/audio';
import { haptics } from '../../lib/haptics';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import type { ChallengeRewardScene } from './challengeRewardUtils';

const lazyConfetti = () => import('canvas-confetti').then((module) => module.default);

interface UseHomeRewardQueueParams {
    currentTab: string;
    activeMilestoneModal: FuwafuwaMilestoneEvent | null;
}

export function useHomeRewardQueue({
    currentTab,
    activeMilestoneModal,
}: UseHomeRewardQueueParams) {
    const [pendingChallengeRewardScenes, setPendingChallengeRewardScenes] = useState<ChallengeRewardScene[]>([]);
    const [activeChallengeRewardScene, setActiveChallengeRewardScene] = useState<ChallengeRewardScene | null>(null);

    const queueChallengeRewardScene = useCallback((scene: ChallengeRewardScene) => {
        setPendingChallengeRewardScenes((current) => (
            current.some((item) => item.id === scene.id) || activeChallengeRewardScene?.id === scene.id
                ? current
                : [...current, scene]
        ));
    }, [activeChallengeRewardScene]);

    useEffect(() => {
        if (
            currentTab !== 'home'
            || activeMilestoneModal
            || activeChallengeRewardScene
            || pendingChallengeRewardScenes.length === 0
        ) {
            return;
        }

        setPendingChallengeRewardScenes((current) => {
            const [nextScene, ...rest] = current;
            setActiveChallengeRewardScene(nextScene ?? null);
            return rest;
        });
    }, [
        activeChallengeRewardScene,
        activeMilestoneModal,
        currentTab,
        pendingChallengeRewardScenes.length,
    ]);

    useEffect(() => {
        if (!activeChallengeRewardScene) {
            return;
        }

        haptics.success();
        audio.playSuccess();
        lazyConfetti().then((confetti) => confetti({
            particleCount: 36,
            spread: 64,
            startVelocity: 24,
            origin: { y: 0.78 },
            colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
        }));
    }, [activeChallengeRewardScene]);

    return {
        activeChallengeRewardScene,
        queueChallengeRewardScene,
        closeActiveChallengeRewardScene: () => setActiveChallengeRewardScene(null),
    };
}
