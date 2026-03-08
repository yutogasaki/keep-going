import type { SessionRecord } from '../../lib/db';
import { getSessionCompletedExerciseTotal, getSessionExerciseCounts, getSessionSkippedCounts } from '../../lib/sessionRecords';

export interface RecordExerciseSummary {
    id: string;
    name: string;
    emoji: string;
    count: number;
}

export interface RecordSessionHistoryItem {
    id: string;
    startedAt: string;
    totalSeconds: number;
    completedTotal: number;
    userNames: string[];
    completedExercises: RecordExerciseSummary[];
    skippedExercises: RecordExerciseSummary[];
}

export interface RecordSessionHistoryDay {
    date: string;
    sessionCount: number;
    totalSeconds: number;
    completedTotal: number;
    items: RecordSessionHistoryItem[];
}

interface ExerciseDisplayInfo {
    name: string;
    emoji: string;
}

function buildExerciseSummaries(
    counts: Record<string, number>,
    exerciseMap: Map<string, ExerciseDisplayInfo>,
    limit = 2,
): RecordExerciseSummary[] {
    return Object.entries(counts)
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }

            const aName = exerciseMap.get(a[0])?.name ?? a[0];
            const bName = exerciseMap.get(b[0])?.name ?? b[0];
            return aName.localeCompare(bName, 'ja');
        })
        .slice(0, limit)
        .map(([id, count]) => {
            const info = exerciseMap.get(id);
            return {
                id,
                count,
                name: info?.name ?? '種目',
                emoji: info?.emoji ?? '🪄',
            };
        });
}

function resolveUserNames(record: SessionRecord, userNameMap: Map<string, string>): string[] {
    if (!record.userIds || record.userIds.length === 0) {
        return [];
    }

    return record.userIds
        .map((userId) => userNameMap.get(userId))
        .filter((name): name is string => Boolean(name));
}

export function buildRecordHistoryDays({
    groupedEntries,
    exerciseMap,
    userNameMap,
}: {
    groupedEntries: [string, SessionRecord[]][];
    exerciseMap: Map<string, ExerciseDisplayInfo>;
    userNameMap: Map<string, string>;
}): RecordSessionHistoryDay[] {
    return groupedEntries.map(([date, records]) => ({
        date,
        sessionCount: records.length,
        totalSeconds: records.reduce((sum, record) => sum + record.totalSeconds, 0),
        completedTotal: records.reduce((sum, record) => sum + getSessionCompletedExerciseTotal(record), 0),
        items: records.map((record) => ({
            id: record.id,
            startedAt: record.startedAt,
            totalSeconds: record.totalSeconds,
            completedTotal: getSessionCompletedExerciseTotal(record),
            userNames: resolveUserNames(record, userNameMap),
            completedExercises: buildExerciseSummaries(getSessionExerciseCounts(record), exerciseMap),
            skippedExercises: buildExerciseSummaries(getSessionSkippedCounts(record), exerciseMap),
        })),
    }));
}
