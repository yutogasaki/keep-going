import type { HomeVisitMemory } from '../types';
import { sanitizeStringArray } from './primitives';

export function sanitizeJoinedChallengeIds(
    value: unknown,
    validUserIds: Set<string>,
): Record<string, string[]> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const result: Record<string, string[]> = {};
    for (const [userId, ids] of Object.entries(value as Record<string, unknown>)) {
        if (!validUserIds.has(userId)) {
            continue;
        }
        result[userId] = sanitizeStringArray(ids);
    }

    return result;
}

function sanitizeTimestampRecord(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const result: Record<string, string> = {};
    for (const [key, timestamp] of Object.entries(value as Record<string, unknown>)) {
        if (typeof key !== 'string' || key.length === 0 || typeof timestamp !== 'string') {
            continue;
        }

        const timestampMs = new Date(timestamp).getTime();
        if (!Number.isFinite(timestampMs)) {
            continue;
        }

        result[key] = timestamp;
    }

    return result;
}

export function sanitizeHomeVisitMemory(
    value: unknown,
    validUserIds: Set<string>,
): HomeVisitMemory {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {
            soloByUserId: {},
            familyByUserSet: {},
        };
    }

    const candidate = value as Record<string, unknown>;
    const soloByUserId = Object.fromEntries(
        Object.entries(sanitizeTimestampRecord(candidate.soloByUserId)).filter(([userId]) => validUserIds.has(userId)),
    );
    const familyByUserSet = Object.fromEntries(
        Object.entries(sanitizeTimestampRecord(candidate.familyByUserSet)).filter(([key]) => (
            key.split('|').every((userId) => validUserIds.has(userId))
        )),
    );

    return {
        soloByUserId,
        familyByUserSet,
    };
}
