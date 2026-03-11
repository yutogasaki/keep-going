export type HomeVisitRecency = 'first' | 'recent' | 'today' | 'returning';

const RECENT_VISIT_MS = 15 * 60 * 1000;
const TODAY_VISIT_MS = 24 * 60 * 60 * 1000;

export function getFamilyVisitMemoryKey(userIds: string[]): string {
    return [...new Set(userIds)]
        .filter((id) => id.length > 0)
        .sort()
        .join('|');
}

export function getHomeVisitRecency(lastVisitedAt: string | null, now = Date.now()): HomeVisitRecency {
    if (!lastVisitedAt) {
        return 'first';
    }

    const visitedAtMs = new Date(lastVisitedAt).getTime();
    if (!Number.isFinite(visitedAtMs) || visitedAtMs > now) {
        return 'first';
    }

    const elapsedMs = now - visitedAtMs;
    if (elapsedMs <= RECENT_VISIT_MS) {
        return 'recent';
    }

    if (elapsedMs <= TODAY_VISIT_MS) {
        return 'today';
    }

    return 'returning';
}
