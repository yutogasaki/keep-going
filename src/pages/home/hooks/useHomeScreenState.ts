import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FuwafuwaMilestoneEvent, TabId, UserProfileStore } from '../../../store/useAppStore';
import type { HomeVisitMemory } from '../../../store/use-app-store/types';
import type { HomeAnnouncement } from '../homeAnnouncementUtils';
import { useHomeAfterglowState } from './useHomeAfterglowState';
import { getMilestoneStage } from './useHomeMilestoneWatcher';
import { useHomeScreenSheetState } from './useHomeScreenSheetState';
import { useHomeSessionUserSync } from './useHomeSessionUserSync';
import { useHomeVisitRecency } from './useHomeVisitRecency';

interface UseHomeScreenStateArgs {
    users: UserProfileStore[];
    sessionUserIds: string[];
    setSessionUserIds: (ids: string[]) => void;
    currentUsers: UserProfileStore[];
    activeUsers: UserProfileStore[];
    selectedUser: UserProfileStore | null;
    currentTab: TabId;
    setTab: (tab: TabId) => void;
    updateUser: (id: string, updates: Partial<UserProfileStore>) => void;
    activeMilestoneModal: FuwafuwaMilestoneEvent | null;
    setActiveMilestoneModal: (modal: FuwafuwaMilestoneEvent | null) => void;
    consumeUserMagicEnergy: (id: string, seconds: number) => void;
    displaySeconds: number;
    targetSeconds: number;
    currentHomeContextKey: string;
    homeVisitMemory: HomeVisitMemory;
    markSoloHomeVisit: (userId: string, visitedAt: string) => void;
    markFamilyHomeVisit: (userIds: string[], visitedAt: string) => void;
    familyVisitKey: string;
    isTogetherMode: boolean;
    homeAnnouncement: HomeAnnouncement | null;
    dismissHomeAnnouncement: (id: string) => void;
}

export function useHomeScreenState({
    users,
    sessionUserIds,
    setSessionUserIds,
    currentUsers,
    activeUsers,
    selectedUser,
    currentTab,
    setTab,
    updateUser,
    activeMilestoneModal,
    setActiveMilestoneModal,
    consumeUserMagicEnergy,
    displaySeconds,
    targetSeconds,
    currentHomeContextKey,
    homeVisitMemory,
    markSoloHomeVisit,
    markFamilyHomeVisit,
    familyVisitKey,
    isTogetherMode,
    homeAnnouncement,
    dismissHomeAnnouncement,
}: UseHomeScreenStateArgs) {
    const [pendingMilestoneEvents, setPendingMilestoneEvents] = useState<FuwafuwaMilestoneEvent[]>([]);
    const [recentMilestoneEvent, setRecentMilestoneEvent] = useState<FuwafuwaMilestoneEvent | null>(null);

    const sheetState = useHomeScreenSheetState();
    const visitRecency = useHomeVisitRecency({
        currentUsers,
        familyVisitKey,
        homeVisitMemory,
        isTogetherMode,
        markFamilyHomeVisit,
        markSoloHomeVisit,
        selectedUser,
    });
    const afterglowState = useHomeAfterglowState({
        activeUsers,
        consumeUserMagicEnergy,
        currentHomeContextKey,
        dismissHomeAnnouncement,
        displaySeconds,
        homeAnnouncement,
        setTab,
        targetSeconds,
    });

    useHomeSessionUserSync({
        users,
        sessionUserIds,
        setSessionUserIds,
    });

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

    return {
        activeMilestoneUser,
        handleMilestoneModalClose,
        hasKnownMilestoneEvent,
        pendingMilestoneEventsByUserId,
        queueMilestoneEvent,
        recentMilestoneEvent,
        ...afterglowState,
        ...sheetState,
        ...visitRecency,
    };
}
