import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
const lazyConfetti = () => import('canvas-confetti').then((module) => module.default);
import { audio } from '../../lib/audio';
import {
    getMilestoneStage,
    useHomeMilestoneWatcher,
} from './hooks/useHomeMilestoneWatcher';
import {
    getHomeVisitRecency,
    type HomeVisitRecency,
} from './homeVisitMemory';
import type { HomeAfterglow } from './homeAfterglow';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { SessionRecord } from '../../lib/db';
import type { UserProfileStore, FuwafuwaMilestoneEvent } from '../../store/useAppStore';

interface UseHomeFuwafuwaStateParams {
    users: UserProfileStore[];
    allSessions: SessionRecord[];
    activeUsers: UserProfileStore[];
    currentUsers: UserProfileStore[];
    selectedUser: UserProfileStore | null;
    isTogetherMode: boolean;
    currentTab: string;
    activeMilestoneModal: FuwafuwaMilestoneEvent | null;
    setActiveMilestoneModal: (event: FuwafuwaMilestoneEvent | null) => void;
    updateUser: (userId: string, updates: Partial<UserProfileStore>) => void;
    homeVisitMemory: {
        soloByUserId: Record<string, string | null | undefined>;
        familyByUserSet: Record<string, string | null | undefined>;
    };
    markSoloHomeVisit: (userId: string, at: string) => void;
    markFamilyHomeVisit: (userIds: string[], at: string) => void;
    familyVisitKey: string;
    currentHomeContextKey: string;
    displaySeconds: number;
    targetSeconds: number;
    consumeUserMagicEnergy: (userId: string, amount: number) => void;
    homeAnnouncement: HomeAnnouncement | null;
    dismissHomeAnnouncement: (announcementId: string) => void;
}

export function useHomeFuwafuwaState({
    users,
    allSessions,
    activeUsers,
    currentUsers,
    selectedUser,
    isTogetherMode,
    currentTab,
    activeMilestoneModal,
    setActiveMilestoneModal,
    updateUser,
    homeVisitMemory,
    markSoloHomeVisit,
    markFamilyHomeVisit,
    familyVisitKey,
    currentHomeContextKey,
    displaySeconds,
    targetSeconds,
    consumeUserMagicEnergy,
    homeAnnouncement,
    dismissHomeAnnouncement,
}: UseHomeFuwafuwaStateParams) {
    const [pendingMilestoneEvents, setPendingMilestoneEvents] = useState<FuwafuwaMilestoneEvent[]>([]);
    const [recentMilestoneEvent, setRecentMilestoneEvent] = useState<FuwafuwaMilestoneEvent | null>(null);
    const [recentAfterglow, setRecentAfterglow] = useState<HomeAfterglow | null>(null);
    const [activeMagicDeliveryContextKey, setActiveMagicDeliveryContextKey] = useState<string | null>(null);
    const [selectedUserVisitRecency, setSelectedUserVisitRecency] = useState<HomeVisitRecency>('first');
    const [familyVisitRecency, setFamilyVisitRecency] = useState<HomeVisitRecency>('first');
    const lastSoloVisitKeyRef = useRef('');
    const lastFamilyVisitKeyRef = useRef('');
    const magicDeliveryTimerRef = useRef<number | null>(null);

    const activeMilestoneUser = useMemo(
        () => activeMilestoneModal
            ? users.find((user) => user.id === activeMilestoneModal.userId) ?? null
            : null,
        [activeMilestoneModal, users],
    );
    const pendingMilestoneEventsByUserId = useMemo(
        () => new Map(
            pendingMilestoneEvents.map((event) => [event.userId, event]),
        ),
        [pendingMilestoneEvents],
    );

    const queueMilestoneEvent = useCallback((event: FuwafuwaMilestoneEvent) => {
        setPendingMilestoneEvents((current) => (
            current.some((item) => item.userId === event.userId && item.kind === event.kind)
                ? current
                : [...current, event]
        ));
    }, []);

    const hasKnownMilestoneEvent = useCallback((event: FuwafuwaMilestoneEvent) => (
        pendingMilestoneEvents.some((item) => item.userId === event.userId && item.kind === event.kind)
        || (activeMilestoneModal?.userId === event.userId && activeMilestoneModal.kind === event.kind)
    ), [activeMilestoneModal, pendingMilestoneEvents]);

    useHomeMilestoneWatcher({
        allSessions,
        hasKnownMilestoneEvent,
        queueMilestoneEvent,
        users,
    });

    useEffect(() => {
        const validUserIds = new Set(users.map((user) => user.id));
        setPendingMilestoneEvents((current) => current.filter((event) => validUserIds.has(event.userId)));
    }, [users]);

    useEffect(() => {
        if (!recentMilestoneEvent) {
            return;
        }

        const timerId = window.setTimeout(() => {
            setRecentMilestoneEvent((current) => (
                current?.userId === recentMilestoneEvent.userId && current.kind === recentMilestoneEvent.kind
                    ? null
                    : current
            ));
        }, 12000);

        return () => window.clearTimeout(timerId);
    }, [recentMilestoneEvent]);

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

    useEffect(() => {
        if (isTogetherMode || !selectedUser) {
            lastSoloVisitKeyRef.current = '';
            setSelectedUserVisitRecency('first');
            return;
        }

        const visitKey = selectedUser.id;
        if (lastSoloVisitKeyRef.current === visitKey) {
            return;
        }

        lastSoloVisitKeyRef.current = visitKey;
        setSelectedUserVisitRecency(
            getHomeVisitRecency(homeVisitMemory.soloByUserId[visitKey] ?? null),
        );
        markSoloHomeVisit(visitKey, new Date().toISOString());
    }, [homeVisitMemory.soloByUserId, isTogetherMode, markSoloHomeVisit, selectedUser]);

    useEffect(() => {
        if (!isTogetherMode || familyVisitKey.length === 0) {
            lastFamilyVisitKeyRef.current = '';
            setFamilyVisitRecency('first');
            return;
        }

        if (lastFamilyVisitKeyRef.current === familyVisitKey) {
            return;
        }

        lastFamilyVisitKeyRef.current = familyVisitKey;
        setFamilyVisitRecency(
            getHomeVisitRecency(homeVisitMemory.familyByUserSet[familyVisitKey] ?? null),
        );
        markFamilyHomeVisit(currentUsers.map((user) => user.id), new Date().toISOString());
    }, [currentUsers, familyVisitKey, homeVisitMemory.familyByUserSet, isTogetherMode, markFamilyHomeVisit]);

    useEffect(() => {
        if (isTogetherMode || !selectedUser || activeMilestoneModal) {
            return;
        }

        const nextEvent = pendingMilestoneEvents.find((event) => event.userId === selectedUser.id);
        if (!nextEvent) {
            return;
        }

        setPendingMilestoneEvents((current) => current.filter(
            (event) => !(event.userId === nextEvent.userId && event.kind === nextEvent.kind),
        ));
        setActiveMilestoneModal(nextEvent);
    }, [activeMilestoneModal, isTogetherMode, pendingMilestoneEvents, selectedUser, setActiveMilestoneModal]);

    const handleMilestoneModalClose = useCallback(() => {
        if (activeMilestoneModal?.source === 'system' && activeMilestoneUser) {
            const stage = getMilestoneStage(activeMilestoneModal.kind);
            if (!(activeMilestoneUser.notifiedFuwafuwaStages || []).includes(stage)) {
                updateUser(activeMilestoneUser.id, {
                    notifiedFuwafuwaStages: [...(activeMilestoneUser.notifiedFuwafuwaStages || []), stage],
                });
            }
        }

        if (activeMilestoneModal) {
            setRecentMilestoneEvent(activeMilestoneModal);
        }
        setActiveMilestoneModal(null);
    }, [activeMilestoneModal, activeMilestoneUser, setActiveMilestoneModal, updateUser]);

    useEffect(() => {
        if (
            currentTab === 'menu'
            && homeAnnouncement
            && (homeAnnouncement.kind === 'teacher_menu' || homeAnnouncement.kind === 'teacher_exercise')
        ) {
            dismissHomeAnnouncement(homeAnnouncement.id);
        }
    }, [currentTab, dismissHomeAnnouncement, homeAnnouncement]);

    const handleTankReset = () => {
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
    };

    return {
        activeMilestoneUser,
        pendingMilestoneEventsByUserId,
        recentMilestoneEvent,
        recentAfterglow,
        setRecentAfterglow,
        activeMagicDeliveryContextKey,
        selectedUserVisitRecency,
        familyVisitRecency,
        handleMilestoneModalClose,
        handleTankReset,
    };
}
