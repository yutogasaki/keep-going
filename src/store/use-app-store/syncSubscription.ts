import { getAccountId, isPulling } from '../../lib/sync/authState';
import {
    deleteFamilyMember as syncDeleteFamilyMember,
    pushAppSettings,
    pushFamilyMember,
} from '../../lib/sync/push';
import { registerStoreAccessor } from '../../lib/sync/storeAccess';
import type { AppState } from './types';

interface SyncableStore {
    getState: () => AppState;
    setState: (partial: Record<string, unknown>) => void;
    subscribe: (listener: (state: AppState, prevState: AppState) => void) => () => void;
}

function toAppSettingsPayload(state: AppState) {
    return {
        onboardingCompleted: state.onboardingCompleted,
        soundVolume: state.soundVolume,
        ttsEnabled: state.ttsEnabled,
        bgmEnabled: state.bgmEnabled,
        hapticEnabled: state.hapticEnabled,
        notificationsEnabled: state.notificationsEnabled,
        notificationTime: state.notificationTime,
    };
}

export function setupStoreSyncSubscription(store: SyncableStore): void {
    registerStoreAccessor(store.getState as any, store.setState as any);

    store.subscribe((state, prevState) => {
        if (!getAccountId()) return;
        if (isPulling()) return;

        if (state.users !== prevState.users) {
            const prevIds = new Set(prevState.users.map((user) => user.id));
            const currentIds = new Set(state.users.map((user) => user.id));

            for (const user of state.users) {
                const previous = prevState.users.find((prevUser) => prevUser.id === user.id);
                if (!previous || previous !== user) {
                    pushFamilyMember(user).catch(console.warn);
                }
            }

            for (const id of prevIds) {
                if (!currentIds.has(id)) {
                    syncDeleteFamilyMember(id).catch(console.warn);
                }
            }
        }

        const settingsChanged =
            state.onboardingCompleted !== prevState.onboardingCompleted ||
            state.soundVolume !== prevState.soundVolume ||
            state.ttsEnabled !== prevState.ttsEnabled ||
            state.bgmEnabled !== prevState.bgmEnabled ||
            state.hapticEnabled !== prevState.hapticEnabled ||
            state.notificationsEnabled !== prevState.notificationsEnabled ||
            state.notificationTime !== prevState.notificationTime;

        if (settingsChanged) {
            pushAppSettings(toAppSettingsPayload(state)).catch(console.warn);
        }
    });
}
