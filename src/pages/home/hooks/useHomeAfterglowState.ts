import { useCallback, useEffect, useRef, useState } from 'react';
import { audio } from '../../../lib/audio';
import type { TabId, UserProfileStore } from '../../../store/useAppStore';
import type { HomeAfterglow } from '../homeAfterglow';
import type { HomeAnnouncement } from '../homeAnnouncementUtils';

const lazyConfetti = () => import('canvas-confetti').then((m) => m.default);

interface UseHomeAfterglowStateArgs {
    activeUsers: UserProfileStore[];
    consumeUserMagicEnergy: (id: string, seconds: number) => void;
    currentHomeContextKey: string;
    dismissHomeAnnouncement: (id: string) => void;
    displaySeconds: number;
    homeAnnouncement: HomeAnnouncement | null;
    setTab: (tab: TabId) => void;
    targetSeconds: number;
}

export function useHomeAfterglowState({
    activeUsers,
    consumeUserMagicEnergy,
    currentHomeContextKey,
    dismissHomeAnnouncement,
    displaySeconds,
    homeAnnouncement,
    setTab,
    targetSeconds,
}: UseHomeAfterglowStateArgs) {
    const [recentAfterglow, setRecentAfterglow] = useState<HomeAfterglow | null>(null);
    const [activeMagicDeliveryContextKey, setActiveMagicDeliveryContextKey] = useState<string | null>(null);
    const magicDeliveryTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!recentAfterglow) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRecentAfterglow((current) => (
                current?.kind === recentAfterglow.kind && current.contextKey === recentAfterglow.contextKey
                    ? null
                    : current
            ));
        }, 10000);

        return () => window.clearTimeout(timerId);
    }, [recentAfterglow]);

    useEffect(() => {
        return () => {
            if (magicDeliveryTimerRef.current !== null) {
                window.clearTimeout(magicDeliveryTimerRef.current);
                magicDeliveryTimerRef.current = null;
            }
        };
    }, []);

    const handleTankReset = useCallback(() => {
        if (displaySeconds < targetSeconds || magicDeliveryTimerRef.current !== null) {
            return;
        }

        const deliveryContextKey = currentHomeContextKey;
        const deliveryTargets = activeUsers.map((user) => ({
            userId: user.id,
            targetSeconds: (user.dailyTargetMinutes || 10) * 60,
        }));

        if (deliveryContextKey) {
            setActiveMagicDeliveryContextKey(deliveryContextKey);
        }

        const duration = 3000;
        const end = Date.now() + duration;

        lazyConfetti().then((confetti) => {
            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#2BBAA0', '#A8E6CF', '#FFEAA7', '#FDCB6E'],
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            frame();
        });
        audio.playSuccess();

        magicDeliveryTimerRef.current = window.setTimeout(() => {
            deliveryTargets.forEach((target) => {
                consumeUserMagicEnergy(target.userId, target.targetSeconds);
            });

            if (deliveryContextKey) {
                setRecentAfterglow({
                    kind: 'magic_delivery',
                    contextKey: deliveryContextKey,
                });
            }

            setActiveMagicDeliveryContextKey((current) => (
                current === deliveryContextKey ? null : current
            ));
            magicDeliveryTimerRef.current = null;
        }, 900);
    }, [activeUsers, consumeUserMagicEnergy, currentHomeContextKey, displaySeconds, targetSeconds]);

    const handleAnnouncementAction = useCallback(() => {
        if (!homeAnnouncement) {
            return;
        }

        if (currentHomeContextKey) {
            setRecentAfterglow({
                kind: 'announcement',
                contextKey: currentHomeContextKey,
                announcement: homeAnnouncement,
            });
        }

        dismissHomeAnnouncement(homeAnnouncement.id);

        if (homeAnnouncement.kind === 'challenge') {
            document.getElementById('home-challenges-section')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            return;
        }

        setTab('menu');
    }, [currentHomeContextKey, dismissHomeAnnouncement, homeAnnouncement, setTab]);

    return {
        activeMagicDeliveryContextKey,
        handleAnnouncementAction,
        handleTankReset,
        recentAfterglow,
    };
}
