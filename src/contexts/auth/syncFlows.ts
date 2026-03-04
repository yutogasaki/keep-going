import {
    initialSync,
    pullAndMerge,
} from '../../lib/sync';
import { useAppStore } from '../../store/useAppStore';
import type { LoginContext } from './types';
import { SYNCED_ACCOUNT_KEY } from './constants';
import { getAppSettingsSnapshot } from './settingsSnapshot';

interface SettingsLoginSyncParams {
    accountId: string;
    setIsSyncing: (syncing: boolean) => void;
    setToastMessage: (message: string | null) => void;
    setLoginContext: (ctx: LoginContext) => void;
}

export async function runSettingsLoginSync({
    accountId,
    setIsSyncing,
    setToastMessage,
    setLoginContext,
}: SettingsLoginSyncParams): Promise<void> {
    setIsSyncing(true);

    try {
        // Push local data first, then merge with cloud
        const state = useAppStore.getState();
        if (state.users.length > 0) {
            await initialSync(state.users, getAppSettingsSnapshot());
        }

        await pullAndMerge(accountId);
        localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
        setToastMessage('同期が完了しました');
    } catch (error) {
        console.warn('[auth] handleSettingsLogin failed:', error);
        setToastMessage('同期に失敗しました');
    } finally {
        setIsSyncing(false);
        setLoginContext(null);
    }
}
