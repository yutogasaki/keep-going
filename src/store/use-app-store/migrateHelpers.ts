import { getTodayKey } from '../../lib/db';
import { DEFAULT_BGM_TRACK_ID } from '../../lib/bgmTracks';
import type {
    AppState,
    ChallengeEnrollmentWindow,
    ChibifuwaRecord,
    HomeVisitMemory,
    PastFuwafuwaRecord,
    SessionDraft,
    SessionMenuSource,
    TabId,
    UserProfileStore,
} from './types';

const VALID_TABS = new Set<TabId>(['home', 'record', 'menu', 'settings']);
const VALID_SESSION_MENU_SOURCES = new Set<SessionMenuSource>(['preset', 'teacher', 'custom', 'public']);
const VALID_CLASS_LEVELS = new Set(['先生', 'プレ', '初級', '中級', '上級', 'その他']);
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

function sanitizeOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function sanitizeNonNegativeNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, value);
}

function sanitizePositiveNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return fallback;
    }

    return value;
}

function sanitizeNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set<number>();
    const result: number[] = [];
    for (const item of value) {
        if (typeof item !== 'number' || !Number.isFinite(item) || seen.has(item)) {
            continue;
        }
        seen.add(item);
        result.push(item);
    }
    return result;
}

function sanitizePastFuwafuwas(value: unknown): PastFuwafuwaRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((record) => {
        if (!record || typeof record !== 'object') {
            return [];
        }

        const candidate = record as Record<string, unknown>;
        if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
            return [];
        }

        return [{
            id: candidate.id,
            name: sanitizeOptionalString(candidate.name),
            type: sanitizeNonNegativeNumber(candidate.type, 0),
            activeDays: sanitizeNonNegativeNumber(candidate.activeDays, 0),
            finalStage: sanitizeNonNegativeNumber(candidate.finalStage, 0),
            sayonaraDate: typeof candidate.sayonaraDate === 'string' && candidate.sayonaraDate.length > 0
                ? candidate.sayonaraDate
                : getTodayKey(),
        }];
    });
}

function sanitizeChibifuwas(value: unknown): ChibifuwaRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((record) => {
        if (!record || typeof record !== 'object') {
            return [];
        }

        const candidate = record as Record<string, unknown>;
        if (
            typeof candidate.id !== 'string' ||
            candidate.id.length === 0 ||
            typeof candidate.challengeTitle !== 'string' ||
            candidate.challengeTitle.length === 0 ||
            typeof candidate.earnedDate !== 'string' ||
            candidate.earnedDate.length === 0
        ) {
            return [];
        }

        return [{
            id: candidate.id,
            type: sanitizeNonNegativeNumber(candidate.type, 0),
            challengeTitle: candidate.challengeTitle,
            earnedDate: candidate.earnedDate,
        }];
    });
}

function sanitizeUsers(value: unknown): UserProfileStore[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((user) => {
        if (!user || typeof user !== 'object') {
            return [];
        }

        const candidate = user as Record<string, unknown>;
        if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
            return [];
        }

        const classLevel = typeof candidate.classLevel === 'string' && VALID_CLASS_LEVELS.has(candidate.classLevel)
            ? candidate.classLevel as UserProfileStore['classLevel']
            : '初級';

        return [{
            id: candidate.id,
            name: typeof candidate.name === 'string' && candidate.name.length > 0 ? candidate.name : 'ゲスト',
            classLevel,
            fuwafuwaBirthDate: typeof candidate.fuwafuwaBirthDate === 'string' && candidate.fuwafuwaBirthDate.length > 0
                ? candidate.fuwafuwaBirthDate
                : getTodayKey(),
            fuwafuwaType: sanitizeNonNegativeNumber(candidate.fuwafuwaType, 0),
            fuwafuwaCycleCount: sanitizePositiveNumber(candidate.fuwafuwaCycleCount, 1),
            fuwafuwaName: sanitizeOptionalString(candidate.fuwafuwaName),
            pastFuwafuwas: sanitizePastFuwafuwas(candidate.pastFuwafuwas),
            notifiedFuwafuwaStages: sanitizeNumberArray(candidate.notifiedFuwafuwaStages),
            dailyTargetMinutes: sanitizePositiveNumber(candidate.dailyTargetMinutes, 10),
            excludedExercises: sanitizeStringArray(candidate.excludedExercises),
            requiredExercises: sanitizeStringArray(candidate.requiredExercises),
            consumedMagicSeconds: sanitizeNonNegativeNumber(candidate.consumedMagicSeconds, 0),
            challengeStars: sanitizeNonNegativeNumber(candidate.challengeStars, 0),
            avatarUrl: typeof candidate.avatarUrl === 'string' && candidate.avatarUrl.length > 0 ? candidate.avatarUrl : undefined,
            chibifuwas: sanitizeChibifuwas(candidate.chibifuwas),
        }];
    });
}

export function sanitizeSessionDraft(draft: unknown, validUserIdSet?: Set<string>): SessionDraft | null {
    if (!draft || typeof draft !== 'object') {
        return null;
    }

    const candidate = draft as Record<string, unknown>;
    if (candidate.kind !== 'auto') {
        return null;
    }

    if (typeof candidate.date !== 'string') {
        return null;
    }

    const exerciseIds = sanitizeStringArray(candidate.exerciseIds);
    const userIds = sanitizeStringArray(candidate.userIds).filter((id) => !validUserIdSet || validUserIdSet.has(id));
    const returnTab = candidate.returnTab;
    if (!VALID_TABS.has(returnTab as TabId)) {
        return null;
    }

    const sourceMenuId = sanitizeOptionalString(candidate.sourceMenuId);
    const sourceMenuSource = VALID_SESSION_MENU_SOURCES.has(candidate.sourceMenuSource as SessionMenuSource)
        ? candidate.sourceMenuSource as SessionMenuSource
        : null;
    const sourceMenuName = sanitizeOptionalString(candidate.sourceMenuName);

    return {
        kind: 'auto',
        date: candidate.date,
        exerciseIds,
        userIds,
        returnTab: returnTab as TabId,
        ...(sourceMenuId ? { sourceMenuId } : {}),
        ...(sourceMenuSource ? { sourceMenuSource } : {}),
        ...(sourceMenuName ? { sourceMenuName } : {}),
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

function sanitizeChallengeEnrollmentWindow(value: unknown): ChallengeEnrollmentWindow | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    if (typeof candidate.startDate !== 'string' || typeof candidate.endDate !== 'string') {
        return null;
    }

    const startDate = candidate.startDate.trim();
    const endDate = candidate.endDate.trim();
    const joinedAt = typeof candidate.joinedAt === 'string' && !Number.isNaN(Date.parse(candidate.joinedAt))
        ? candidate.joinedAt
        : undefined;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate) {
        return null;
    }

    return { startDate, endDate, ...(joinedAt ? { joinedAt } : {}) };
}

export function sanitizeChallengeEnrollmentWindows(
    value: unknown,
    validUserIds: Set<string>,
): Record<string, Record<string, ChallengeEnrollmentWindow>> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    const result: Record<string, Record<string, ChallengeEnrollmentWindow>> = {};

    for (const [userId, rawChallengeMap] of Object.entries(value as Record<string, unknown>)) {
        if (!validUserIds.has(userId) || !rawChallengeMap || typeof rawChallengeMap !== 'object' || Array.isArray(rawChallengeMap)) {
            continue;
        }

        const challengeMap: Record<string, ChallengeEnrollmentWindow> = {};
        for (const [challengeId, rawWindow] of Object.entries(rawChallengeMap as Record<string, unknown>)) {
            if (typeof challengeId !== 'string' || challengeId.length === 0) {
                continue;
            }

            const window = sanitizeChallengeEnrollmentWindow(rawWindow);
            if (window) {
                challengeMap[challengeId] = window;
            }
        }

        if (Object.keys(challengeMap).length > 0) {
            result[userId] = challengeMap;
        }
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

export function sanitizeBgmTrackId(value: unknown): string {
    return typeof value === 'string' && value.length > 0 ? value : DEFAULT_BGM_TRACK_ID;
}

export function sanitizeNullableNumber(value: unknown): number | null {
    if (value == null) {
        return null;
    }

    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function sanitizePersistedState(state: Record<string, unknown>): void {
    const users = sanitizeUsers(state.users);
    const validUserIds = users.map((user) => user.id);
    const validUserIdSet = new Set(validUserIds);

    state.users = users;
    state.onboardingCompleted = sanitizeBooleanSetting(state.onboardingCompleted, false);
    state.soundVolume = sanitizeSoundVolume(state.soundVolume);
    state.ttsEnabled = sanitizeBooleanSetting(state.ttsEnabled, true);
    state.bgmEnabled = sanitizeBooleanSetting(state.bgmEnabled, true);
    state.bgmVolume = sanitizeSoundVolume(state.bgmVolume ?? 0.3);
    state.bgmTrackId = sanitizeBgmTrackId(state.bgmTrackId);
    state.hapticEnabled = sanitizeBooleanSetting(state.hapticEnabled, true);
    state.notificationsEnabled = sanitizeBooleanSetting(state.notificationsEnabled, false);
    state.notificationTime = sanitizeNotificationTime(state.notificationTime);
    state.hasSeenSessionControlsHint = sanitizeBooleanSetting(state.hasSeenSessionControlsHint, false);
    state.dismissedHomeAnnouncementIds = sanitizeStringArray(state.dismissedHomeAnnouncementIds);
    state.debugFuwafuwaStage = sanitizeNullableNumber(state.debugFuwafuwaStage);
    state.debugFuwafuwaType = sanitizeNullableNumber(state.debugFuwafuwaType);
    state.debugActiveDays = sanitizeNullableNumber(state.debugActiveDays);
    state.debugFuwafuwaScale = sanitizeNullableNumber(state.debugFuwafuwaScale);
    state.joinedChallengeIds = sanitizeJoinedChallengeIds(state.joinedChallengeIds, validUserIdSet);
    state.challengeEnrollmentWindows = sanitizeChallengeEnrollmentWindows(
        state.challengeEnrollmentWindows,
        validUserIdSet,
    );
    state.homeVisitMemory = sanitizeHomeVisitMemory(state.homeVisitMemory, validUserIdSet);
    state.sessionUserIds = sanitizeSessionUserIds(state.sessionUserIds, validUserIds);
    state.sessionDraft = sanitizeSessionDraft(state.sessionDraft, validUserIdSet);
}

export type PersistedAppStateRecord = Record<string, unknown> & Partial<AppState>;
