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

    const targetSeconds = useMemo(() => {
        if (perUserMagic.length === 0) {
            const fallbackTargetMinutes = users.length > 0 ? (users[0].dailyTargetMinutes || 10) : 10;
            return fallbackTargetMinutes * 60;
        }

        if (isTogetherMode) {
            return perUserMagic.reduce((sum, userMagic) => sum + userMagic.targetSeconds, 0);
        }

        return perUserMagic[0]?.targetSeconds ?? 10 * 60;
    }, [isTogetherMode, perUserMagic, users]);

    const displaySeconds = useMemo(() => {
        if (perUserMagic.length === 0) {
            return 0;
        }

        if (isTogetherMode) {
            return perUserMagic.reduce((sum, userMagic) => sum + userMagic.displaySeconds, 0);
        }

        return perUserMagic[0]?.displaySeconds ?? 0;
    }, [isTogetherMode, perUserMagic]);

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
