import { getTodayKey } from '../../lib/db';
import type { AppState } from './types';
import { sanitizePersistedState, sanitizeSessionDraft } from './migrateHelpers';

export const APP_STATE_VERSION = 16;

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
    'sessionDraft',
    'debugFuwafuwaStage',
    'debugFuwafuwaType',
    'debugActiveDays',
    'debugFuwafuwaScale',
    'joinedChallengeIds',
] as const satisfies ReadonlyArray<keyof PersistedAppState>;

export function migrateAppState(persistedState: any, version: number): AppState {
    const state = persistedState as any;

    if (version === 0) {
        if (state.requiredExercises && !state.requiredExercises.includes('S07')) {
            state.requiredExercises.push('S07');
        }
    }

    if (version < 2) {
        state.bgmEnabled = state.bgmEnabled ?? true;
        state.hapticEnabled = state.hapticEnabled ?? true;
    }

    if (version < 3) {
        if (!state.users || state.users.length === 0) {
            const legacyUser: any = {
                id: crypto.randomUUID(),
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
            state.sessionUserIds = [legacyUser.id];
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
        if (!state.excludedExercises || state.excludedExercises.length === 0) {
            state.excludedExercises = ['C01', 'C02'];
        }
    }

    if (version < 5) {
        const globalTarget = state.dailyTargetMinutes ?? 10;
        const globalExcluded = state.excludedExercises ?? ['C01', 'C02'];
        const globalRequired = state.requiredExercises ?? ['S01', 'S02', 'S07'];

        if (state.users && Array.isArray(state.users)) {
            state.users = state.users.map((user: any, index: number) => {
                if (index === 0) {
                    return {
                        ...user,
                        dailyTargetMinutes: user.dailyTargetMinutes ?? globalTarget,
                        excludedExercises: user.excludedExercises ?? globalExcluded,
                        requiredExercises: user.requiredExercises ?? globalRequired,
                    };
                }

                return {
                    ...user,
                    dailyTargetMinutes: user.dailyTargetMinutes ?? 10,
                    excludedExercises: user.excludedExercises ?? ['C01', 'C02'],
                    requiredExercises: user.requiredExercises ?? ['S01', 'S02', 'S07'],
                };
            });
        }

        delete state.dailyTargetMinutes;
        delete state.excludedExercises;
        delete state.requiredExercises;
    }

    if (version < 6) {
        if (state.users && Array.isArray(state.users)) {
            state.users = state.users.map((user: any) => ({
                ...user,
                consumedMagicDate: user.consumedMagicDate || '',
                consumedMagicSeconds: user.consumedMagicSeconds || 0,
            }));
        }
    }

    if (version < 8) {
        if (state.users && Array.isArray(state.users)) {
            state.users = state.users.map((user: any) => ({
                ...user,
                chibifuwas: user.chibifuwas ?? [],
            }));
        }
    }

    if (version < 9) {
        state.joinedChallengeIds = state.joinedChallengeIds ?? [];
    }

    if (version < 10) {
        const oldIds: string[] = Array.isArray(state.joinedChallengeIds)
            ? state.joinedChallengeIds
            : [];

        const newRecord: Record<string, string[]> = {};
        if (oldIds.length > 0 && state.users && Array.isArray(state.users)) {
            for (const user of state.users) {
                newRecord[user.id] = [...oldIds];
            }
        }

        state.joinedChallengeIds = newRecord;
    }

    if (version < 11) {
        const OLD_REQUIRED = ['S01', 'S02', 'S07'];
        const OLD_EXCLUDED = ['C01', 'C02'];
        if (state.users && Array.isArray(state.users)) {
            state.users = state.users.map((user: any) => ({
                ...user,
                requiredExercises: (user.requiredExercises ?? []).filter(
                    (id: string) => !OLD_REQUIRED.includes(id)
                ),
                excludedExercises: (user.excludedExercises ?? []).filter(
                    (id: string) => !OLD_EXCLUDED.includes(id)
                ),
            }));
        }
    }

    if (version < 12) {
        if (state.users && Array.isArray(state.users)) {
            state.users = state.users.map((user: any) => {
                const rest = { ...user };
                delete rest.consumedMagicDate;
                return rest;
            });
        }
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

    sanitizePersistedState(state as Record<string, unknown>);
    return state as AppState;
}

export function partializeAppState(state: AppState): PersistedAppState {
    return Object.fromEntries(
        PERSISTED_APP_STATE_KEYS.map((key) => [key, state[key]]),
    ) as PersistedAppState;
}

