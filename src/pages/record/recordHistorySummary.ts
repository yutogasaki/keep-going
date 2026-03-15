import type { SessionRecord } from '../../lib/db';
import { getSessionCompletedExerciseTotal, getSessionExerciseCounts, getSessionSkippedCounts } from '../../lib/sessionRecords';
import type { ExercisePlacement } from '../../data/exercisePlacement';

export interface RecordExerciseSummary {
    id: string;
    name: string;
    emoji: string;
    count: number;
    sourceLabel?: string;
}

export interface RecordSessionHistoryItem {
    id: string;
    startedAt: string;
    totalSeconds: number;
    completedTotal: number;
    skippedTotal: number;
    sessionLabel: string;
    userNames: string[];
    completedExercises: RecordExerciseSummary[];
    skippedExercises: RecordExerciseSummary[];
}

export interface RecordSessionHistoryDay {
    date: string;
    sessionCount: number;
    totalSeconds: number;
    completedTotal: number;
    skippedTotal: number;
    items: RecordSessionHistoryItem[];
}

export interface RecordParticipantSummary {
    id: string;
    name: string;
    sessionCount: number;
    totalSeconds: number;
}

export interface RecordInsightSummary {
    focusLabel: string;
    summaryLine: string;
    detailLine: string;
    participants: RecordParticipantSummary[];
}

export interface ExerciseDisplayInfo {
    name: string;
    emoji: string;
    placement?: ExercisePlacement;
    source?: 'standard' | 'teacher' | 'custom';
    sourceLabel?: string;
    isInline?: boolean;
}

export function buildPlannedItemExerciseMap(
    record: Pick<SessionRecord, 'plannedItems'>,
): Map<string, ExerciseDisplayInfo> {
    const plannedMap = new Map<string, ExerciseDisplayInfo>();

    for (const item of record.plannedItems ?? []) {
        plannedMap.set(item.id, {
            name: item.name,
            emoji: item.emoji,
            placement: item.placement,
            sourceLabel: item.kind === 'inline_only' ? 'このメニューだけ' : undefined,
            isInline: item.kind === 'inline_only',
        });
    }

    return plannedMap;
}

function getTotalCount(counts: Record<string, number>): number {
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
}

function buildExerciseSummaries(
    counts: Record<string, number>,
    exerciseMap: Map<string, ExerciseDisplayInfo>,
    plannedItemMap: Map<string, ExerciseDisplayInfo>,
    limit = 2,
): RecordExerciseSummary[] {
    return Object.entries(counts)
        .sort((a, b) => {
            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }

            const aName = plannedItemMap.get(a[0])?.name ?? exerciseMap.get(a[0])?.name ?? a[0];
            const bName = plannedItemMap.get(b[0])?.name ?? exerciseMap.get(b[0])?.name ?? b[0];
            return aName.localeCompare(bName, 'ja');
        })
        .slice(0, limit)
        .map(([id, count]) => {
            const info = plannedItemMap.get(id) ?? exerciseMap.get(id);
            return {
                id,
                count,
                name: info?.name ?? '種目',
                emoji: info?.emoji ?? '🪄',
                sourceLabel: info?.sourceLabel,
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

function buildFocusLabel(viewUserNames: string[]): string {
    if (viewUserNames.length === 0) {
        return '家族みんなの記録';
    }

    if (viewUserNames.length === 1) {
        return `${viewUserNames[0]}の記録`;
    }

    if (viewUserNames.length === 2) {
        return `${viewUserNames[0]}・${viewUserNames[1]}の記録`;
    }

    return `${viewUserNames[0]}たちの記録`;
}

function buildSessionLabel(userNames: string[]): string {
    if (userNames.length === 0) {
        return 'だれでも';
    }

    if (userNames.length === 1) {
        return 'ひとり';
    }

    return 'みんなで';
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
        skippedTotal: records.reduce((sum, record) => sum + getTotalCount(getSessionSkippedCounts(record)), 0),
        items: records.map((record) => {
            const userNames = resolveUserNames(record, userNameMap);
            const skippedCounts = getSessionSkippedCounts(record);
            const plannedItemMap = buildPlannedItemExerciseMap(record);

            return {
                id: record.id,
                startedAt: record.startedAt,
                totalSeconds: record.totalSeconds,
                completedTotal: getSessionCompletedExerciseTotal(record),
                skippedTotal: getTotalCount(skippedCounts),
                sessionLabel: buildSessionLabel(userNames),
                userNames,
                completedExercises: buildExerciseSummaries(getSessionExerciseCounts(record), exerciseMap, plannedItemMap),
                skippedExercises: buildExerciseSummaries(skippedCounts, exerciseMap, plannedItemMap),
            };
        }),
    }));
}

export function buildRecordParticipantSummaries({
    sessions,
    userNameMap,
}: {
    sessions: SessionRecord[];
    userNameMap: Map<string, string>;
}): RecordParticipantSummary[] {
    const summaryMap = new Map<string, RecordParticipantSummary>();

    for (const session of sessions) {
        for (const userId of session.userIds ?? []) {
            const name = userNameMap.get(userId);
            if (!name) {
                continue;
            }

            const existing = summaryMap.get(userId);
            if (existing) {
                existing.sessionCount += 1;
                existing.totalSeconds += session.totalSeconds;
                continue;
            }

            summaryMap.set(userId, {
                id: userId,
                name,
                sessionCount: 1,
                totalSeconds: session.totalSeconds,
            });
        }
    }

    return Array.from(summaryMap.values()).sort((a, b) => {
        if (b.sessionCount !== a.sessionCount) {
            return b.sessionCount - a.sessionCount;
        }

        if (b.totalSeconds !== a.totalSeconds) {
            return b.totalSeconds - a.totalSeconds;
        }

        return a.name.localeCompare(b.name, 'ja');
    });
}

export function buildRecordInsightSummary({
    viewUserNames,
    totalSessions,
    totalMinutes,
    uniqueDays,
    skippedTotal,
    topExercise,
    participantSummaries,
}: {
    viewUserNames: string[];
    totalSessions: number;
    totalMinutes: number;
    uniqueDays: number;
    skippedTotal: number;
    topExercise?: { name?: string; count: number };
    participantSummaries: RecordParticipantSummary[];
}): RecordInsightSummary {
    const focusLabel = buildFocusLabel(viewUserNames);
    const summaryLine = `${uniqueDays}日で${totalSessions}回、合計${totalMinutes}分の記録です。`;
    const detailParts: string[] = [];

    if (topExercise?.name) {
        detailParts.push(`よくやったのは ${topExercise.name} ${topExercise.count}回`);
    }

    if (skippedTotal > 0) {
        detailParts.push(`おやすみは ${skippedTotal}回`);
    }

    if (participantSummaries.length > 1) {
        detailParts.push(`参加は ${participantSummaries.length}人分`);
    }

    return {
        focusLabel,
        summaryLine,
        detailLine: detailParts.join(' / '),
        participants: participantSummaries.slice(0, 3),
    };
}
