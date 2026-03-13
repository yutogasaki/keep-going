import type { StoreApi } from 'zustand';
import { getAccountId, isPulling } from '../../lib/sync/authState';
import {
    deleteFamilyMember as syncDeleteFamilyMember,
    pushAppSettings,
    pushFamilyMember,
} from '../../lib/sync/push';
import { registerStoreAccessor } from '../../lib/sync/storeAccess';
import { useSyncStatus } from '../useSyncStatus';
import type { AppState } from './types';

function onSyncError(error: unknown): void {
    console.warn('[sync]', error);
    useSyncStatus.getState().reportFailure(String(error));
}

type SyncableStore = Pick<StoreApi<AppState>, 'getState' | 'setState' | 'subscribe'>;

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
    registerStoreAccessor(store.getState, (partial) => {
        store.setState(partial);
    });

    store.subscribe((state, prevState) => {
        if (!getAccountId()) return;
        if (isPulling()) return;

        if (state.users !== prevState.users) {
            const prevIds = new Set(prevState.users.map((user) => user.id));
            const currentIds = new Set(state.users.map((user) => user.id));

            for (const user of state.users) {
                const previous = prevState.users.find((prevUser) => prevUser.id === user.id);
                if (!previous || previous !== user) {
                    pushFamilyMember(user).catch(onSyncError);
                }
            }

            for (const id of prevIds) {
                if (!currentIds.has(id)) {
                    syncDeleteFamilyMember(id).catch(onSyncError);
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
            pushAppSettings(toAppSettingsPayload(state)).catch(onSyncError);
        }
    });
}
