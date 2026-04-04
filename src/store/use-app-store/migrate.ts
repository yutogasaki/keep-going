import { getTodayKey } from '../../lib/db';
import { DEFAULT_BGM_TRACK_ID } from '../../lib/bgmTracks';
import { FUWAFUWA_TYPE_COUNT } from '../../lib/fuwafuwa';
import type { AppState } from './types';
import { sanitizePersistedState, sanitizeSessionDraft } from './migrateHelpers';

type LegacyUserRecord = Record<string, unknown>;
type MutableMigratingState = Record<string, unknown> & {
    users?: unknown;
    sessionUserIds?: unknown;
    requiredExercises?: unknown;
    excludedExercises?: unknown;
    dailyTargetMinutes?: unknown;
    bgmEnabled?: unknown;
    bgmVolume?: unknown;
    bgmTrackId?: unknown;
    hapticEnabled?: unknown;
    joinedChallengeIds?: unknown;
    dismissedHomeAnnouncementIds?: unknown;
    homeVisitMemory?: unknown;
    challengeEnrollmentWindows?: unknown;
    sessionDraft?: unknown;
    hasSeenSessionControlsHint?: unknown;
    ttsRate?: unknown;
    ttsPitch?: unknown;
    classLevel?: unknown;
    fuwafuwaBirthDate?: unknown;
    fuwafuwaType?: unknown;
    fuwafuwaCycleCount?: unknown;
    fuwafuwaName?: unknown;
    pastFuwafuwas?: unknown;
    notifiedFuwafuwaStages?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getLegacyUsers(value: unknown): LegacyUserRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isRecord);
}

function mapLegacyUsers(
    state: MutableMigratingState,
    mapper: (user: LegacyUserRecord, index: number) => LegacyUserRecord,
): void {
    const users = getLegacyUsers(state.users);
    if (users.length === 0) {
        return;
    }

    state.users = users.map(mapper);
}

function getStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
}

function getFiniteNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function getNonEmptyString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function getNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

export const APP_STATE_VERSION = 22;

export type PersistedAppState = Pick<
    AppState,
    | 'users'
    | 'sessionUserIds'
    | 'onboardingCompleted'
    | 'soundVolume'
    | 'ttsEnabled'
    | 'bgmEnabled'
    | 'bgmVolume'
    | 'bgmTrackId'
    | 'hapticEnabled'
    | 'notificationsEnabled'
    | 'notificationTime'
    | 'hasSeenSessionControlsHint'
    | 'dismissedHomeAnnouncementIds'
    | 'homeVisitMemory'
    | 'sessionDraft'
    | 'debugFuwafuwaStage'
    | 'debugFuwafuwaType'
    | 'debugActiveDays'
    | 'debugFuwafuwaScale'
    | 'joinedChallengeIds'
    | 'challengeEnrollmentWindows'
>;

export const PERSISTED_APP_STATE_KEYS = [
    'users',
    'sessionUserIds',
    'onboardingCompleted',
    'soundVolume',
    'ttsEnabled',
    'bgmEnabled',
    'bgmVolume',
    'bgmTrackId',
    'hapticEnabled',
    'notificationsEnabled',
    'notificationTime',
    'hasSeenSessionControlsHint',
    'dismissedHomeAnnouncementIds',
    'homeVisitMemory',
    'sessionDraft',
    'debugFuwafuwaStage',
    'debugFuwafuwaType',
    'debugActiveDays',
    'debugFuwafuwaScale',
    'joinedChallengeIds',
    'challengeEnrollmentWindows',
] as const satisfies ReadonlyArray<keyof PersistedAppState>;

export function migrateAppState(persistedState: unknown, version: number): AppState {
    const state = (isRecord(persistedState) ? persistedState : {}) as MutableMigratingState;

    if (version === 0) {
        const requiredExercises = Array.isArray(state.requiredExercises)
            ? getStringArray(state.requiredExercises)
            : null;

        if (requiredExercises && !requiredExercises.includes('S07')) {
            requiredExercises.push('S07');
            state.requiredExercises = requiredExercises;
        }
    }

    if (version < 2) {
        state.bgmEnabled = state.bgmEnabled ?? true;
        state.hapticEnabled = state.hapticEnabled ?? true;
    }

    if (version < 3) {
        if (getLegacyUsers(state.users).length === 0) {
            const legacyUserId = crypto.randomUUID();
            const legacyUser: LegacyUserRecord = {
                id: legacyUserId,
                name: getNonEmptyString(state.fuwafuwaName, 'ゲスト'),
                classLevel: getNonEmptyString(state.classLevel, '初級'),
                fuwafuwaBirthDate: getNonEmptyString(state.fuwafuwaBirthDate, getTodayKey()),
                fuwafuwaType: getFiniteNumber(state.fuwafuwaType, Math.floor(Math.random() * FUWAFUWA_TYPE_COUNT)),
                fuwafuwaCycleCount: getFiniteNumber(state.fuwafuwaCycleCount, 1),
                fuwafuwaName: getNullableString(state.fuwafuwaName),
                pastFuwafuwas: Array.isArray(state.pastFuwafuwas) ? state.pastFuwafuwas : [],
                notifiedFuwafuwaStages: Array.isArray(state.notifiedFuwafuwaStages)
                    ? state.notifiedFuwafuwaStages
                    : [],
            };

            state.users = [legacyUser];
            state.sessionUserIds = [legacyUserId];
        }

        delete state.classLevel;
        delete state.fuwafuwaBirthDate;
        delete state.fuwafuwaType;
        delete state.fuwafuwaCycleCount;
        delete state.fuwafuwaName;
        delete state.pastFuwafuwas;
        delete state.notifiedFuwafuwaStages;
    }

    if (version < 4) {
        const excludedExercises = getStringArray(state.excludedExercises);
        if (excludedExercises.length === 0) {
            state.excludedExercises = ['C01', 'C02'];
        }
    }

    if (version < 5) {
        const globalTarget = getFiniteNumber(state.dailyTargetMinutes, 10);
        const globalExcluded = Array.isArray(state.excludedExercises)
            ? getStringArray(state.excludedExercises)
            : ['C01', 'C02'];
        const globalRequired = Array.isArray(state.requiredExercises)
            ? getStringArray(state.requiredExercises)
            : ['S01', 'S02', 'S07'];

        mapLegacyUsers(state, (user, index) => ({
            ...user,
            dailyTargetMinutes: getFiniteNumber(user.dailyTargetMinutes, index === 0 ? globalTarget : 10),
            excludedExercises: Array.isArray(user.excludedExercises)
                ? getStringArray(user.excludedExercises)
                : (index === 0 ? globalExcluded : ['C01', 'C02']),
            requiredExercises: Array.isArray(user.requiredExercises)
                ? getStringArray(user.requiredExercises)
                : (index === 0 ? globalRequired : ['S01', 'S02', 'S07']),
        }));

        delete state.dailyTargetMinutes;
        delete state.excludedExercises;
        delete state.requiredExercises;
    }

    if (version < 6) {
        mapLegacyUsers(state, (user) => ({
            ...user,
            consumedMagicDate: getNonEmptyString(user.consumedMagicDate, ''),
            consumedMagicSeconds: getFiniteNumber(user.consumedMagicSeconds, 0),
        }));
    }

    if (version < 8) {
        mapLegacyUsers(state, (user) => ({
            ...user,
            chibifuwas: Array.isArray(user.chibifuwas) ? user.chibifuwas : [],
        }));
    }

    if (version < 9) {
        state.joinedChallengeIds = state.joinedChallengeIds ?? [];
    }

    if (version < 10) {
        const oldIds = Array.isArray(state.joinedChallengeIds)
            ? getStringArray(state.joinedChallengeIds)
            : [];

        const newRecord: Record<string, string[]> = {};
        if (oldIds.length > 0) {
            for (const user of getLegacyUsers(state.users)) {
                if (typeof user.id !== 'string' || user.id.length === 0) {
                    continue;
                }

                newRecord[user.id] = [...oldIds];
            }
        }

        state.joinedChallengeIds = newRecord;
    }

    if (version < 11) {
        const OLD_REQUIRED = ['S01', 'S02', 'S07'];
        const OLD_EXCLUDED = ['C01', 'C02'];
        mapLegacyUsers(state, (user) => ({
            ...user,
            requiredExercises: getStringArray(user.requiredExercises).filter(
                (id) => !OLD_REQUIRED.includes(id),
            ),
            excludedExercises: getStringArray(user.excludedExercises).filter(
                (id) => !OLD_EXCLUDED.includes(id),
            ),
        }));
    }

    if (version < 12) {
        mapLegacyUsers(state, (user) => {
            const rest = { ...user };
            delete rest.consumedMagicDate;
            return rest;
        });
    }

    if (version < 13) {
        state.hasSeenSessionControlsHint = state.hasSeenSessionControlsHint ?? false;
    }

    if (version < 14) {
        state.sessionDraft = sanitizeSessionDraft(state.sessionDraft);
    }

    if (version < 16) {
        delete state.ttsRate;
        delete state.ttsPitch;
    }

    if (version < 17) {
        mapLegacyUsers(state, (user) => ({
            ...user,
            challengeStars: Math.max(0, getFiniteNumber(user.challengeStars, 0)),
        }));
    }

    if (version < 18) {
        state.dismissedHomeAnnouncementIds = Array.isArray(state.dismissedHomeAnnouncementIds)
            ? state.dismissedHomeAnnouncementIds
            : [];
    }

    if (version < 20) {
        state.homeVisitMemory = state.homeVisitMemory ?? {
            soloByUserId: {},
            familyByUserSet: {},
        };
    }

    if (version < 21) {
        state.challengeEnrollmentWindows = state.challengeEnrollmentWindows ?? {};
    }

    if (version < 22) {
        state.bgmVolume = state.bgmVolume ?? 0.3;
        state.bgmTrackId = state.bgmTrackId ?? DEFAULT_BGM_TRACK_ID;
    }

    sanitizePersistedState(state as Record<string, unknown>);
    return state as unknown as AppState;
}

export function partializeAppState(state: AppState): PersistedAppState {
    return Object.fromEntries(
        PERSISTED_APP_STATE_KEYS.map((key) => [key, state[key]]),
    ) as PersistedAppState;
}
