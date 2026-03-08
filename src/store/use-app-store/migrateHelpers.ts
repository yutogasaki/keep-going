import type { AppState, SessionDraft, TabId } from './types';

const VALID_TABS = new Set<TabId>(['home', 'record', 'menu', 'settings']);
const DEFAULT_NOTIFICATION_TIME = '21:00';
const NOTIFICATION_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export function sanitizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of value) {
        if (typeof item !== 'string' || item.length === 0 || seen.has(item)) {
            continue;
        }
        seen.add(item);
        result.push(item);
    }
    return result;
}

export function sanitizeSessionDraft(draft: unknown): SessionDraft | null {
    if (!draft || typeof draft !== 'object') {
        return null;
    }

    const candidate = draft as Record<string, unknown>;
    if (typeof candidate.date !== 'string') {
        return null;
    }

    const exerciseIds = sanitizeStringArray(candidate.exerciseIds);
    const userIds = sanitizeStringArray(candidate.userIds);
    const returnTab = candidate.returnTab;
    if (!VALID_TABS.has(returnTab as TabId)) {
        return null;
    }

    return {
        date: candidate.date,
        exerciseIds,
        userIds,
        returnTab: returnTab as TabId,
    };
}

export function isValidNotificationTime(value: unknown): value is string {
    if (typeof value !== 'string') {
        return false;
    }

    const match = NOTIFICATION_TIME_PATTERN.exec(value);
    if (!match) {
        return false;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return false;
    }

    return true;
}

export function sanitizeNotificationTime(value: unknown): string {
    return isValidNotificationTime(value) ? value : DEFAULT_NOTIFICATION_TIME;
}

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

export function sanitizeSessionUserIds(value: unknown, validUserIds: string[]): string[] {
    const validSet = new Set(validUserIds);
    const filtered = sanitizeStringArray(value).filter((id) => validSet.has(id));
    if (filtered.length > 0) {
        return filtered;
    }

    return validUserIds[0] ? [validUserIds[0]] : [];
}

export function sanitizeBooleanSetting(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeSoundVolume(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 1;
    }

    return Math.min(1, Math.max(0, value));
}

export function sanitizeNullableNumber(value: unknown): number | null {
    if (value == null) {
        return null;
    }

    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function sanitizePersistedState(state: Record<string, unknown>): void {
    const users = Array.isArray(state.users)
        ? state.users.filter((user): user is { id: string } => Boolean(user) && typeof user === 'object' && typeof (user as { id?: unknown }).id === 'string')
        : [];
    const validUserIds = users.map((user) => user.id);
    const validUserIdSet = new Set(validUserIds);

    state.onboardingCompleted = sanitizeBooleanSetting(state.onboardingCompleted, false);
    state.soundVolume = sanitizeSoundVolume(state.soundVolume);
    state.ttsEnabled = sanitizeBooleanSetting(state.ttsEnabled, true);
    state.bgmEnabled = sanitizeBooleanSetting(state.bgmEnabled, true);
    state.hapticEnabled = sanitizeBooleanSetting(state.hapticEnabled, true);
    state.notificationsEnabled = sanitizeBooleanSetting(state.notificationsEnabled, false);
    state.notificationTime = sanitizeNotificationTime(state.notificationTime);
    state.hasSeenSessionControlsHint = sanitizeBooleanSetting(state.hasSeenSessionControlsHint, false);
    state.debugFuwafuwaStage = sanitizeNullableNumber(state.debugFuwafuwaStage);
    state.debugFuwafuwaType = sanitizeNullableNumber(state.debugFuwafuwaType);
    state.debugActiveDays = sanitizeNullableNumber(state.debugActiveDays);
    state.debugFuwafuwaScale = sanitizeNullableNumber(state.debugFuwafuwaScale);
    state.joinedChallengeIds = sanitizeJoinedChallengeIds(state.joinedChallengeIds, validUserIdSet);
    state.sessionUserIds = sanitizeSessionUserIds(state.sessionUserIds, validUserIds);
    state.sessionDraft = sanitizeSessionDraft(state.sessionDraft);
}

export type PersistedAppStateRecord = Record<string, unknown> & Partial<AppState>;
