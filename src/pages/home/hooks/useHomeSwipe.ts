import { useCallback, useEffect, useMemo } from 'react';
import type { UserProfileStore } from '../../../store/useAppStore';
import type { SwipePage } from '../types';

interface UseHomeSwipeParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    setSessionUserIds: (ids: string[]) => void;
}

export function useHomeSwipe({ users, sessionUserIds, setSessionUserIds }: UseHomeSwipeParams) {
    const isTogetherMode = sessionUserIds.length > 1;

    const swipePages = useMemo<SwipePage[]>(() => {
        const pages: SwipePage[] = users.map((user) => ({
            kind: 'user',
            id: user.id,
            name: user.name,
            user,
        }));

        if (users.length >= 2) {
            pages.push({ kind: 'together', id: 'TOGETHER', name: 'みんなで！' });
        }

        return pages;
    }, [users]);

    const currentPageIndex = useMemo(() => {
        if (swipePages.length === 0) {
            return 0;
        }

        if (sessionUserIds.length > 1) {
            const index = swipePages.findIndex((page) => page.kind === 'together');
            return index === -1 ? 0 : index;
        }

        if (sessionUserIds.length === 1) {
            const index = swipePages.findIndex(
                (page) => page.kind === 'user' && page.user.id === sessionUserIds[0],
            );
            return index === -1 ? 0 : index;
        }

        return 0;
    }, [sessionUserIds, swipePages]);

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

    const handleDragEnd = useCallback(
        (_event: unknown, info: { offset: { x: number } }) => {
            const threshold = 50;
            let newIndex = currentPageIndex;

            if (info.offset.x < -threshold && currentPageIndex < swipePages.length - 1) {
                newIndex = currentPageIndex + 1;
            } else if (info.offset.x > threshold && currentPageIndex > 0) {
                newIndex = currentPageIndex - 1;
            }

            if (newIndex !== currentPageIndex) {
                const page = swipePages[newIndex];
                if (page.kind === 'together') {
                    setSessionUserIds(users.map((user) => user.id));
                } else {
                    setSessionUserIds([page.user.id]);
                }
            }
        },
        [currentPageIndex, swipePages, users, setSessionUserIds],
    );

    return {
        isTogetherMode,
        swipePages,
        currentPageIndex,
        handleDragEnd,
    };
}
