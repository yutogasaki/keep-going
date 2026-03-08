import {
    hasCloudData,
    initialSync,
    inspectLoginSyncPlan,
    pullAndMerge,
    restoreFromCloud,
    setAccountId,
    type LoginSyncPlanKind,
    type SyncConflictPromptData,
    type SyncConflictResolution,
} from '../../lib/sync';
import { useAppStore } from '../../store/useAppStore';
import type { LoginContext } from './types';
import { SYNCED_ACCOUNT_KEY } from './constants';
import { getAppSettingsSnapshot } from './settingsSnapshot';
import { getLoginSyncFailureMessage, getLoginSyncSuccessMessage } from './syncFlowMessages';

export interface LoginSyncOutcome {
    success: boolean;
    action: LoginSyncPlanKind;
    hadCloudData: boolean;
    resolution?: SyncConflictResolution;
    error?: string;
}

export type ResolveSyncConflict = (
    prompt: SyncConflictPromptData,
) => Promise<SyncConflictResolution>;

interface SettingsLoginSyncParams {
    accountId: string;
    resolveConflict: ResolveSyncConflict;
    setIsSyncing: (syncing: boolean) => void;
    setToastMessage: (message: string | null) => void;
    setLoginContext: (ctx: LoginContext) => void;
}

async function pushCurrentLocalState(): Promise<void> {
    const state = useAppStore.getState();
    await initialSync(state.users, getAppSettingsSnapshot());
}

function toFailureOutcome({
    action,
    error,
    hadCloudData,
    resolution,
}: {
    action: LoginSyncPlanKind;
    error: unknown;
    hadCloudData: boolean;
    resolution?: SyncConflictResolution;
}): LoginSyncOutcome {
    return {
        success: false,
        action,
        hadCloudData,
        resolution,
        error: String(error),
    };
}

async function restoreCloudData({
    accountId,
    action,
    hadCloudData,
    resolution,
}: {
    accountId: string;
    action: LoginSyncPlanKind;
    hadCloudData: boolean;
    resolution?: SyncConflictResolution;
}): Promise<LoginSyncOutcome> {
    try {
        const result = await restoreFromCloud(accountId);
        if (!result.success) {
            return toFailureOutcome({
                action,
                error: result.error ?? 'Cloud restore failed',
                hadCloudData,
                resolution,
            });
        }

        localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
        return {
            success: true,
            action,
            hadCloudData: result.hadData,
            resolution,
        };
    } catch (error) {
        return toFailureOutcome({ action, error, hadCloudData, resolution });
    }
}

async function mergeCloudData({
    accountId,
    hadCloudData,
    resolution,
}: {
    accountId: string;
    hadCloudData: boolean;
    resolution?: SyncConflictResolution;
}): Promise<LoginSyncOutcome> {
    try {
        const result = await pullAndMerge(accountId);
        if (!result.success) {
            return toFailureOutcome({
                action: 'merge',
                error: result.error ?? 'Merge failed',
                hadCloudData,
                resolution,
            });
        }

        localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
        return {
            success: true,
            action: 'merge',
            hadCloudData: result.hadData,
            resolution,
        };
    } catch (error) {
        return toFailureOutcome({ action: 'merge', error, hadCloudData, resolution });
    }
}

async function pushLocalData({
    accountId,
    hadCloudData,
    resolution,
}: {
    accountId: string;
    hadCloudData: boolean;
    resolution?: SyncConflictResolution;
}): Promise<LoginSyncOutcome> {
    try {
        await pushCurrentLocalState();
        localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
        return {
            success: true,
            action: 'push_local',
            hadCloudData,
            resolution,
        };
    } catch (error) {
        return toFailureOutcome({ action: 'push_local', error, hadCloudData, resolution });
    }
}

export async function runPostLoginSync({
    accountId,
    resolveConflict,
}: {
    accountId: string;
    resolveConflict: ResolveSyncConflict;
}): Promise<LoginSyncOutcome> {
    try {
        setAccountId(accountId);
        const syncedAccountId = localStorage.getItem(SYNCED_ACCOUNT_KEY);
        const plan = await inspectLoginSyncPlan(accountId, syncedAccountId);
        const hadCloudData = hasCloudData(plan.cloudSummary);

        switch (plan.kind) {
        case 'restore_from_cloud': {
            return restoreCloudData({
                accountId,
                action: plan.kind,
                hadCloudData,
            });
        }

        case 'push_local': {
            return pushLocalData({
                accountId,
                hadCloudData,
            });
        }

        case 'merge': {
            return mergeCloudData({
                accountId,
                hadCloudData,
            });
        }

        case 'conflict': {
            const resolution = await resolveConflict({
                localSummary: plan.localSummary,
                cloudSummary: plan.cloudSummary,
            });

            if (resolution === 'cloud') {
                return restoreCloudData({
                    accountId,
                    action: 'restore_from_cloud',
                    hadCloudData,
                    resolution,
                });
            }

            const pushed = await pushLocalData({
                accountId,
                hadCloudData,
                resolution,
            });
            if (!pushed.success) {
                return pushed;
            }

            return mergeCloudData({
                accountId,
                hadCloudData,
                resolution,
            });
        }

        case 'none':
        default:
            return {
                success: true,
                action: 'none',
                hadCloudData: false,
            };
        }
    } catch (error) {
        return {
            success: false,
            action: 'none',
            hadCloudData: false,
            error: String(error),
        };
    }
}

export async function runSettingsLoginSync({
    accountId,
    resolveConflict,
    setIsSyncing,
    setToastMessage,
    setLoginContext,
}: SettingsLoginSyncParams): Promise<void> {
    setIsSyncing(true);

    try {
        const outcome = await runPostLoginSync({ accountId, resolveConflict });
        if (!outcome.success) {
            setToastMessage(getLoginSyncFailureMessage(outcome));
            return;
        }

        setToastMessage(getLoginSyncSuccessMessage(outcome));
    } catch (error) {
        console.warn('[auth] handleSettingsLogin failed:', error);
        setToastMessage('同期に失敗しました');
    } finally {
        setIsSyncing(false);
        setLoginContext(null);
    }
}
