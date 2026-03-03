import {
    detectConflict,
    initialSync,
    mergeAppendData,
    pullAllData,
    type ConflictScenario,
} from '../../lib/sync';
import { useAppStore } from '../../store/useAppStore';
import type { LoginContext } from './types';
import { SYNCED_ACCOUNT_KEY } from './constants';
import { getAppSettingsSnapshot } from './settingsSnapshot';

interface SettingsLoginSyncParams {
    accountId: string;
    setIsSyncing: (syncing: boolean) => void;
    setConflictScenario: (scenario: ConflictScenario | null) => void;
    setToastMessage: (message: string | null) => void;
    setLoginContext: (ctx: LoginContext) => void;
}

export async function runSettingsLoginSync({
    accountId,
    setIsSyncing,
    setConflictScenario,
    setToastMessage,
    setLoginContext,
}: SettingsLoginSyncParams): Promise<void> {
    setIsSyncing(true);

    try {
        const previouslySynced = localStorage.getItem(SYNCED_ACCOUNT_KEY) === accountId;
        if (previouslySynced) {
            await mergeAppendData(accountId);
            return;
        }

        const scenario = await detectConflict(accountId);

        if (scenario === 'conflict') {
            setConflictScenario(scenario);
            return;
        }

        if (scenario === 'no_conflict_pull') {
            await pullAllData(accountId);
            await mergeAppendData(accountId);
            setToastMessage('データを復元しました');
        } else if (scenario === 'no_conflict_push') {
            const state = useAppStore.getState();
            await initialSync(state.users, getAppSettingsSnapshot());
            await mergeAppendData(accountId);
            setToastMessage('同期が完了しました');
        }

        localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
    } catch (error) {
        console.warn('[auth] handleSettingsLogin failed:', error);
        setToastMessage('同期に失敗しました');
    } finally {
        setIsSyncing(false);
        setLoginContext(null);
    }
}

interface ResolveConflictParams {
    userId: string;
    choice: 'cloud' | 'local';
    setIsSyncing: (syncing: boolean) => void;
    setConflictScenario: (scenario: ConflictScenario | null) => void;
    setToastMessage: (message: string | null) => void;
}

export async function runConflictResolution({
    userId,
    choice,
    setIsSyncing,
    setConflictScenario,
    setToastMessage,
}: ResolveConflictParams): Promise<void> {
    setConflictScenario(null);
    setIsSyncing(true);

    try {
        if (choice === 'cloud') {
            await pullAllData(userId);
            await mergeAppendData(userId);
            setToastMessage('クラウドのデータを復元しました');
        } else {
            const state = useAppStore.getState();
            await initialSync(state.users, getAppSettingsSnapshot());
            await mergeAppendData(userId);
            setToastMessage('このデバイスのデータで同期しました');
        }

        localStorage.setItem(SYNCED_ACCOUNT_KEY, userId);
    } catch (error) {
        console.warn('[auth] resolveConflict failed:', error);
        setToastMessage('同期に失敗しました');
    } finally {
        setIsSyncing(false);
    }
}
