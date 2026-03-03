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

        let interval = setInterval(load, 5000);
        const handleVisibility = () => {
            clearInterval(interval);
            if (document.visibilityState === 'visible') {
                load();
                interval = setInterval(load, 5000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
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
                if (session.date !== todayStr) {
                    return false;
                }
                return !session.userIds || session.userIds.includes(user.id);
            });

            const trained = userSessions.reduce((acc, session) => acc + session.totalSeconds, 0);
            const consumed = user.consumedMagicDate === todayStr ? (user.consumedMagicSeconds || 0) : 0;
            const userTarget = (user.dailyTargetMinutes || 10) * 60;

            return {
                userId: user.id,
                userName: user.name,
                displaySeconds: Math.max(0, trained - consumed),
                targetSeconds: userTarget,
            };
        });
    }, [activeUsers, allSessions, todayStr]);

    const todaySeconds = todaySessions.reduce((acc, session) => acc + session.totalSeconds, 0);

    const consumedSeconds = activeUsers.reduce((sum, user) => {
        if (user.consumedMagicDate === todayStr) {
            return sum + (user.consumedMagicSeconds || 0);
        }
        return sum;
    }, 0);

    const displaySeconds = Math.max(0, todaySeconds - consumedSeconds);

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
