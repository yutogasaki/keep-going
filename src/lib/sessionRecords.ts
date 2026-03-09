export type SessionCountMap = Record<string, number>;

export interface SessionRecordLike {
    exerciseIds: string[];
    plannedExerciseIds?: string[];
    skippedIds: string[];
    exerciseCounts?: SessionCountMap;
    skippedCounts?: SessionCountMap;
}

export function countSessionIds(ids: string[]): SessionCountMap {
    return ids.reduce<SessionCountMap>((counts, id) => {
        counts[id] = (counts[id] ?? 0) + 1;
        return counts;
    }, {});
}

export function normalizeSessionRecord<T extends SessionRecordLike>(
    record: T,
): T & { exerciseCounts: SessionCountMap; skippedCounts: SessionCountMap } {
    return {
        ...record,
        exerciseCounts: countSessionIds(record.exerciseIds),
        skippedCounts: countSessionIds(record.skippedIds),
    };
}

export function getSessionExerciseCounts(record: SessionRecordLike): SessionCountMap {
    return countSessionIds(record.exerciseIds);
}

export function getSessionSkippedCounts(record: SessionRecordLike): SessionCountMap {
    return countSessionIds(record.skippedIds);
}

export function getSessionCompletedExerciseTotal(record: SessionRecordLike): number {
    return Object.values(getSessionExerciseCounts(record)).reduce((sum, count) => sum + count, 0);
}

export function hasCompletedExercises(record: SessionRecordLike): boolean {
    return getSessionCompletedExerciseTotal(record) > 0;
}

export function hasCompletedPlannedExercises(record: SessionRecordLike): boolean {
    if (!Array.isArray(record.plannedExerciseIds) || record.plannedExerciseIds.length === 0) {
        return false;
    }

    const plannedCounts = countSessionIds(record.plannedExerciseIds);
    const completedCounts = getSessionExerciseCounts(record);
    return Object.entries(plannedCounts).every(([id, count]) => (completedCounts[id] ?? 0) >= count);
}
