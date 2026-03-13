import { useEffect, useRef, useState } from 'react';
import type { UserProfileStore } from '../../../store/useAppStore';
import type { HomeVisitMemory } from '../../../store/use-app-store/types';
import {
    getHomeVisitRecency,
    type HomeVisitRecency,
} from '../homeVisitMemory';

interface UseHomeVisitRecencyArgs {
    currentUsers: UserProfileStore[];
    familyVisitKey: string;
    homeVisitMemory: HomeVisitMemory;
    isTogetherMode: boolean;
    markFamilyHomeVisit: (userIds: string[], visitedAt: string) => void;
    markSoloHomeVisit: (userId: string, visitedAt: string) => void;
    selectedUser: UserProfileStore | null;
}

export function useHomeVisitRecency({
    currentUsers,
    familyVisitKey,
    homeVisitMemory,
    isTogetherMode,
    markFamilyHomeVisit,
    markSoloHomeVisit,
    selectedUser,
}: UseHomeVisitRecencyArgs) {
    const [selectedUserVisitRecency, setSelectedUserVisitRecency] = useState<HomeVisitRecency>('first');
    const [familyVisitRecency, setFamilyVisitRecency] = useState<HomeVisitRecency>('first');
    const lastSoloVisitKeyRef = useRef('');
    const lastFamilyVisitKeyRef = useRef('');

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

    return {
        familyVisitRecency,
        selectedUserVisitRecency,
    };
}
