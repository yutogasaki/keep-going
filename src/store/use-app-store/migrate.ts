import { getTodayKey } from '../../lib/db';
import type { AppState } from './types';
import { sanitizePersistedState, sanitizeSessionDraft } from './migrateHelpers';

export const APP_STATE_VERSION = 20;

export type PersistedAppState = Pick<
    AppState,
    | 'users'
    | 'sessionUserIds'
    | 'onboardingCompleted'
    | 'soundVolume'
    | 'ttsEnabled'
    | 'bgmEnabled'
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
>;

export const PERSISTED_APP_STATE_KEYS = [
    'users',
    'sessionUserIds',
    'onboardingCompleted',
    'soundVolume',
    'ttsEnabled',
    'bgmEnabled',
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
] as const satisfies ReadonlyArray<keyof PersistedAppState>;

type MigrationUser = Record<string, unknown> & {
    id?: string;
    name?: string;
    classLevel?: string;
    fuwafuwaBirthDate?: string;
    fuwafuwaType?: number;
    fuwafuwaCycleCount?: number;
    fuwafuwaName?: string | null;
    pastFuwafuwas?: unknown[];
    notifiedFuwafuwaStages?: unknown[];
    dailyTargetMinutes?: number;
    excludedExercises?: unknown;
    requiredExercises?: unknown;
    consumedMagicDate?: unknown;
    consumedMagicSeconds?: number;
    challengeStars?: unknown;
    avatarUrl?: unknown;
    chibifuwas?: unknown;
};

type MigrationState = Record<string, unknown> & Omit<
    Partial<PersistedAppState>,
    'users' | 'joinedChallengeIds' | 'sessionDraft' | 'homeVisitMemory'
> & {
    users?: MigrationUser[];
    classLevel?: string;
    fuwafuwaBirthDate?: string;
    fuwafuwaType?: number;
    fuwafuwaCycleCount?: number;
    fuwafuwaName?: string | null;
    pastFuwafuwas?: unknown[];
    notifiedFuwafuwaStages?: unknown[];
    requiredExercises?: unknown;
    excludedExercises?: unknown;
    dailyTargetMinutes?: number;
    joinedChallengeIds?: unknown;
    sessionDraft?: unknown;
    homeVisitMemory?: unknown;
    ttsRate?: unknown;
    ttsPitch?: unknown;
};

function toMigrationState(persistedState: unknown): MigrationState {
    if (!persistedState || typeof persistedState !== 'object' || Array.isArray(persistedState)) {
        return {};
    }

    return persistedState as MigrationState;
}

function toStringArray(value: unknown, fallback: string[]): string[] {
    if (!Array.isArray(value)) {
        return fallback;
    }

    return value.filter((item): item is string => typeof item === 'string');
}

function mapUsers(
    state: MigrationState,
    mapper: (user: MigrationUser, index: number) => MigrationUser,
): void {
    if (!Array.isArray(state.users)) {
        return;
    }

    state.users = state.users.map(mapper);
}

export function migrateAppState(persistedState: unknown, version: number): AppState {
    const state = toMigrationState(persistedState);

    if (version === 0) {
        if (Array.isArray(state.requiredExercises) && !state.requiredExercises.includes('S07')) {
            state.requiredExercises.push('S07');
        }
    }

    if (version < 2) {
        state.bgmEnabled = state.bgmEnabled ?? true;
        state.hapticEnabled = state.hapticEnabled ?? true;
    }

    if (version < 3) {
        if (!Array.isArray(state.users) || state.users.length === 0) {
            const legacyUserId = crypto.randomUUID();
            const legacyUser: MigrationUser = {
                id: legacyUserId,
                name: state.fuwafuwaName || 'ゲスト',
                classLevel: state.classLevel || '初級',
                fuwafuwaBirthDate: state.fuwafuwaBirthDate || getTodayKey(),
                fuwafuwaType: state.fuwafuwaType || Math.floor(Math.random() * 10),
                fuwafuwaCycleCount: state.fuwafuwaCycleCount || 1,
                fuwafuwaName: state.fuwafuwaName || null,
                pastFuwafuwas: state.pastFuwafuwas || [],
                notifiedFuwafuwaStages: state.notifiedFuwafuwaStages || [],
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
        if (!Array.isArray(state.excludedExercises) || state.excludedExercises.length === 0) {
            state.excludedExercises = ['C01', 'C02'];
        }
    }

    if (version < 5) {
        const globalTarget = state.dailyTargetMinutes ?? 10;
        const globalExcluded = toStringArray(state.excludedExercises, ['C01', 'C02']);
        const globalRequired = toStringArray(state.requiredExercises, ['S01', 'S02', 'S07']);

        mapUsers(state, (user, index) => {
            if (index === 0) {
                return {
                    ...user,
                    dailyTargetMinutes: user.dailyTargetMinutes ?? globalTarget,
                    excludedExercises: Array.isArray(user.excludedExercises) ? user.excludedExercises : globalExcluded,
                    requiredExercises: Array.isArray(user.requiredExercises) ? user.requiredExercises : globalRequired,
                };
            }

            return {
                ...user,
                dailyTargetMinutes: user.dailyTargetMinutes ?? 10,
                excludedExercises: Array.isArray(user.excludedExercises) ? user.excludedExercises : [],
                requiredExercises: Array.isArray(user.requiredExercises) ? user.requiredExercises : [],
            };
        });

        delete state.dailyTargetMinutes;
        delete state.excludedExercises;
        delete state.requiredExercises;
    }

    if (version < 6) {
        mapUsers(state, (user) => ({
            ...user,
            consumedMagicDate: user.consumedMagicDate || '',
            consumedMagicSeconds: user.consumedMagicSeconds || 0,
        }));
    }

    if (version < 8) {
        mapUsers(state, (user) => ({
            ...user,
            chibifuwas: user.chibifuwas ?? [],
        }));
    }

    if (version < 9) {
        state.joinedChallengeIds = state.joinedChallengeIds ?? [];
    }

    if (version < 10) {
        const oldIds = Array.isArray(state.joinedChallengeIds)
            ? state.joinedChallengeIds.filter((id): id is string => typeof id === 'string')
            : [];

        const newRecord: Record<string, string[]> = {};
        if (oldIds.length > 0 && Array.isArray(state.users)) {
            for (const user of state.users) {
                if (typeof user.id === 'string') {
                    newRecord[user.id] = [...oldIds];
                }
            }
        }

        state.joinedChallengeIds = newRecord;
    }

    if (version < 11) {
        const OLD_REQUIRED = ['S01', 'S02', 'S07'];
        const OLD_EXCLUDED = ['C01', 'C02'];
        mapUsers(state, (user) => ({
            ...user,
            requiredExercises: toStringArray(user.requiredExercises, []).filter((id) => !OLD_REQUIRED.includes(id)),
            excludedExercises: toStringArray(user.excludedExercises, []).filter((id) => !OLD_EXCLUDED.includes(id)),
        }));
    }

    if (version < 12) {
        mapUsers(state, ({ consumedMagicDate: _consumedMagicDate, ...user }) => user);
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
        mapUsers(state, (user) => ({
            ...user,
            challengeStars: typeof user.challengeStars === 'number' && Number.isFinite(user.challengeStars)
                ? Math.max(0, user.challengeStars)
                : 0,
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

    sanitizePersistedState(state as Record<string, unknown>);
    return state as unknown as AppState;
}

export function partializeAppState(state: AppState): PersistedAppState;
export function partializeAppState(state: PersistedAppState): PersistedAppState;
export function partializeAppState(state: AppState | PersistedAppState): PersistedAppState {
    return Object.fromEntries(
        PERSISTED_APP_STATE_KEYS.map((key) => [key, state[key]]),
    ) as PersistedAppState;
}
