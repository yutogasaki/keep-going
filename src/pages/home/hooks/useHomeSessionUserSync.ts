import { useEffect } from 'react';
import type { UserProfileStore } from '../../../store/useAppStore';

interface UseHomeSessionUserSyncArgs {
    users: UserProfileStore[];
    sessionUserIds: string[];
    setSessionUserIds: (ids: string[]) => void;
}

export function useHomeSessionUserSync({
    users,
    sessionUserIds,
    setSessionUserIds,
}: UseHomeSessionUserSyncArgs) {
    useEffect(() => {
        if (users.length === 0) {
            return;
        }

        if (sessionUserIds.length === 0) {
            setSessionUserIds([users[0].id]);
            return;
        }

        const userIdSet = new Set(users.map((user) => user.id));
        const validIds = sessionUserIds.filter((id) => userIdSet.has(id));
        if (validIds.length !== sessionUserIds.length) {
            setSessionUserIds(validIds.length > 0 ? validIds : [users[0].id]);
        }
    }, [users, sessionUserIds, setSessionUserIds]);
}
