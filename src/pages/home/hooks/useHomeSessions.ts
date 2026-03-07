import { useEffect, useMemo, useState } from 'react';
import { getAllSessions, getTodayKey, type SessionRecord } from '../../../lib/db';
import type { UserProfileStore } from '../../../store/useAppStore';
import type { PerUserMagic } from '../types';

interface UseHomeSessionsParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
}

export function useHomeSessions({ users, sessionUserIds }: UseHomeSessionsParams) {
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);

    useEffect(() => {
        const load = () => {
            getAllSessions()
                .then((sessions) => {
                    setAllSessions(sessions);
                })
                .catch(console.warn);
        };

        load();

        // Refresh when a session is saved (event fired by db.saveSession)
        // or when the tab becomes visible again (e.g. returning from another app)
        const handleSessionSaved = () => { load(); };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                load();
            }
        };

        window.addEventListener('sessionSaved', handleSessionSaved);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('sessionSaved', handleSessionSaved);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    const todayStr = getTodayKey();
    const isTogetherMode = sessionUserIds.length > 1;

    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);

    const todaySessions = useMemo(
        () => allSessions.filter((session) => {
            if (session.date !== todayStr) {
                return false;
            }

            if (isTogetherMode) {
                return !session.userIds || session.userIds.some((id) => sessionUserIdSet.has(id));
            }

            return !session.userIds || session.userIds.includes(sessionUserIds[0]);
        }),
        [allSessions, todayStr, isTogetherMode, sessionUserIdSet, sessionUserIds],
    );

    const activeUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [users, sessionUserIds],
    );

    const singleUserTargetMinutes =
        activeUsers.length > 0
            ? (activeUsers[0].dailyTargetMinutes || 10)
            : (users.length > 0 ? (users[0].dailyTargetMinutes || 10) : 10);

    const targetSeconds = singleUserTargetMinutes * 60;

    const perUserMagic = useMemo<PerUserMagic[]>(() => {
        return activeUsers.map((user) => {
            const userSessions = allSessions.filter((session) => {
                return !session.userIds || session.userIds.includes(user.id);
            });

            const trained = userSessions.reduce((acc, session) => acc + session.totalSeconds, 0);
            const consumed = user.consumedMagicSeconds || 0;
            const userTarget = (user.dailyTargetMinutes || 10) * 60;

            return {
                userId: user.id,
                userName: user.name,
                displaySeconds: Math.max(0, trained - consumed),
                targetSeconds: userTarget,
            };
        });
    }, [activeUsers, allSessions]);




    const allTimeSeconds = useMemo(
        () => allSessions
            .filter((session) => {
                if (isTogetherMode) {
                    return !session.userIds || session.userIds.some((id) => sessionUserIdSet.has(id));
                }
                return !session.userIds || session.userIds.includes(sessionUserIds[0]);
            })
            .reduce((acc, session) => acc + session.totalSeconds, 0),
        [allSessions, isTogetherMode, sessionUserIdSet, sessionUserIds],
    );

    const consumedSeconds = activeUsers.reduce((sum, user) => {
        return sum + (user.consumedMagicSeconds || 0);
    }, 0);

    const displaySeconds = Math.max(0, allTimeSeconds - consumedSeconds);

    return {
        allSessions,
        todayStr,
        isTogetherMode,
        todaySessions,
        activeUsers,
        targetSeconds,
        perUserMagic,
        displaySeconds,
    };
}
