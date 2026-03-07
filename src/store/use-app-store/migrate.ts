import { getTodayKey } from '../../lib/db';
import type { AppState } from './types';

export const APP_STATE_VERSION = 12;

export function migrateAppState(persistedState: any, version: number): AppState {
    if (version === 0) {
        if (persistedState.requiredExercises && !persistedState.requiredExercises.includes('S07')) {
            persistedState.requiredExercises.push('S07');
        }
    }

    if (version < 2) {
        persistedState.bgmEnabled = persistedState.bgmEnabled ?? true;
        persistedState.hapticEnabled = persistedState.hapticEnabled ?? true;
    }

    if (version < 3) {
        if (!persistedState.users || persistedState.users.length === 0) {
            const legacyUser: any = {
                id: crypto.randomUUID(),
                name: persistedState.fuwafuwaName || 'ゲスト',
                classLevel: persistedState.classLevel || '初級',
                fuwafuwaBirthDate: persistedState.fuwafuwaBirthDate || getTodayKey(),
                fuwafuwaType: persistedState.fuwafuwaType || Math.floor(Math.random() * 10),
                fuwafuwaCycleCount: persistedState.fuwafuwaCycleCount || 1,
                fuwafuwaName: persistedState.fuwafuwaName || null,
                pastFuwafuwas: persistedState.pastFuwafuwas || [],
                notifiedFuwafuwaStages: persistedState.notifiedFuwafuwaStages || [],
            };

            persistedState.users = [legacyUser];
            persistedState.sessionUserIds = [legacyUser.id];
        }

        delete persistedState.classLevel;
        delete persistedState.fuwafuwaBirthDate;
        delete persistedState.fuwafuwaType;
        delete persistedState.fuwafuwaCycleCount;
        delete persistedState.fuwafuwaName;
        delete persistedState.pastFuwafuwas;
        delete persistedState.notifiedFuwafuwaStages;
    }

    if (version < 4) {
        if (!persistedState.excludedExercises || persistedState.excludedExercises.length === 0) {
            persistedState.excludedExercises = ['C01', 'C02'];
        }
    }

    if (version < 5) {
        const globalTarget = persistedState.dailyTargetMinutes ?? 10;
        const globalExcluded = persistedState.excludedExercises ?? ['C01', 'C02'];
        const globalRequired = persistedState.requiredExercises ?? ['S01', 'S02', 'S07'];

        if (persistedState.users && Array.isArray(persistedState.users)) {
            persistedState.users = persistedState.users.map((user: any, index: number) => {
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

        delete persistedState.dailyTargetMinutes;
        delete persistedState.excludedExercises;
        delete persistedState.requiredExercises;
    }

    if (version < 6) {
        if (persistedState.users && Array.isArray(persistedState.users)) {
            persistedState.users = persistedState.users.map((user: any) => ({
                ...user,
                consumedMagicDate: user.consumedMagicDate || '',
                consumedMagicSeconds: user.consumedMagicSeconds || 0,
            }));
        }
    }

    if (version < 8) {
        if (persistedState.users && Array.isArray(persistedState.users)) {
            persistedState.users = persistedState.users.map((user: any) => ({
                ...user,
                chibifuwas: user.chibifuwas ?? [],
            }));
        }
    }

    if (version < 9) {
        persistedState.joinedChallengeIds = persistedState.joinedChallengeIds ?? [];
    }

    if (version < 10) {
        const oldIds: string[] = Array.isArray(persistedState.joinedChallengeIds)
            ? persistedState.joinedChallengeIds
            : [];

        const newRecord: Record<string, string[]> = {};
        if (oldIds.length > 0 && persistedState.users && Array.isArray(persistedState.users)) {
            for (const user of persistedState.users) {
                newRecord[user.id] = [...oldIds];
            }
        }

        persistedState.joinedChallengeIds = newRecord;
    }

    if (version < 11) {
        // ハードコードされた旧デフォルト値を削除し、先生ダッシュボード設定が適用されるようにする
        // ユーザーが明示的に追加した他の種目は残す
        const OLD_REQUIRED = ['S01', 'S02', 'S07'];
        const OLD_EXCLUDED = ['C01', 'C02'];
        if (persistedState.users && Array.isArray(persistedState.users)) {
            persistedState.users = persistedState.users.map((user: any) => ({
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
        // 魔法エネルギーをデイリーリセットから蓄積方式に変更
        // consumedMagicDate は不要になったため削除
        if (persistedState.users && Array.isArray(persistedState.users)) {
            persistedState.users = persistedState.users.map((user: any) => {
                const { consumedMagicDate: _, ...rest } = user;
                return rest;
            });
        }
    }

    return persistedState as AppState;
}

export function partializeAppState(state: AppState): Partial<AppState> {
    return {
        users: state.users,
        onboardingCompleted: state.onboardingCompleted,
        soundVolume: state.soundVolume,
        ttsEnabled: state.ttsEnabled,
        bgmEnabled: state.bgmEnabled,
        hapticEnabled: state.hapticEnabled,
        notificationsEnabled: state.notificationsEnabled,
        notificationTime: state.notificationTime,
        debugFuwafuwaStage: state.debugFuwafuwaStage,
        debugFuwafuwaType: state.debugFuwafuwaType,
        debugActiveDays: state.debugActiveDays,
        debugFuwafuwaScale: state.debugFuwafuwaScale,
        joinedChallengeIds: state.joinedChallengeIds,
    };
}
