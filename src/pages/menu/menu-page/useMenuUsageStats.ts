import { useEffect, useMemo, useState } from 'react';
import { getAllSessions, type SessionRecord } from '../../../lib/db';
import { getSessionExerciseCounts } from '../../../lib/sessionRecords';

export interface MenuUsageStats {
    /** Map of menuGroupId → most recent startedAt ISO string */
    menuLastUsed: Map<string, string>;
    /** Map of exerciseId → total completed count across all sessions */
    exerciseUsageCount: Map<string, number>;
    /** Map of exerciseId → most recent startedAt ISO string */
    exerciseLastUsed: Map<string, string>;
}

const EMPTY_STATS: MenuUsageStats = {
    menuLastUsed: new Map(),
    exerciseUsageCount: new Map(),
    exerciseLastUsed: new Map(),
};

export function useMenuUsageStats(): MenuUsageStats {
    const [sessions, setSessions] = useState<SessionRecord[] | null>(null);

    useEffect(() => {
        getAllSessions().then(setSessions);
    }, []);

    return useMemo(() => {
        if (!sessions) return EMPTY_STATS;

        const menuLastUsed = new Map<string, string>();
        const exerciseUsageCount = new Map<string, number>();
        const exerciseLastUsed = new Map<string, string>();

        // Sessions are already sorted by startedAt descending from getAllSessions()
        for (const session of sessions) {
            // Menu group last used (first occurrence = most recent)
            if (session.sourceMenuId && !menuLastUsed.has(session.sourceMenuId)) {
                menuLastUsed.set(session.sourceMenuId, session.startedAt);
            }

            // Exercise usage counts
            const counts = getSessionExerciseCounts(session);
            for (const [exerciseId, count] of Object.entries(counts)) {
                exerciseUsageCount.set(
                    exerciseId,
                    (exerciseUsageCount.get(exerciseId) ?? 0) + count,
                );
            }

            // Exercise last used (first occurrence = most recent)
            for (const exerciseId of session.exerciseIds) {
                if (!exerciseLastUsed.has(exerciseId)) {
                    exerciseLastUsed.set(exerciseId, session.startedAt);
                }
            }
        }

        return { menuLastUsed, exerciseUsageCount, exerciseLastUsed };
    }, [sessions]);
}
