import {
    buildSyncConflictPrompt,
    hasCloudData,
    inspectLoginSyncPlan,
    setAccountId,
    type SyncConflictPromptData,
    type SyncConflictResolution,
    type SyncDataSummary,
} from '../../lib/sync';
import type { LoginContext } from './types';
import { SYNCED_ACCOUNT_KEY } from './constants';
import { getLoginSyncFailureMessage, getLoginSyncSuccessMessage } from './syncFlowMessages';
import {
    type LoginSyncOutcome,
    mergeCloudData,
    pushLocalData,
    restoreCloudData,
    type SyncExecutionContext,
} from './syncFlowOperations';

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

function buildExecutionContext({
    accountId,
    hadCloudData,
    localSummary,
    cloudSummary,
}: {
    accountId: string;
    hadCloudData: boolean;
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
}): SyncExecutionContext {
    return {
        accountId,
        hadCloudData,
        localSummary,
        cloudSummary,
    };
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
        const context = buildExecutionContext({
            accountId,
            hadCloudData,
            localSummary: plan.localSummary,
            cloudSummary: plan.cloudSummary,
        });

        switch (plan.kind) {
        case 'restore_from_cloud': {
            return restoreCloudData({
                context,
                action: plan.kind,
            });
        }

        case 'push_local': {
            return pushLocalData({
                context,
            });
        }

        case 'merge': {
            return mergeCloudData({
                context,
            });
        }

        case 'conflict': {
            const resolution = await resolveConflict(buildSyncConflictPrompt({
                localSummary: plan.localSummary,
                cloudSummary: plan.cloudSummary,
            }));

            if (resolution === 'cloud') {
                return restoreCloudData({
                    context,
                    action: 'restore_from_cloud',
                    resolution,
                });
            }

            const pushed = await pushLocalData({
                context,
                resolution,
            });
            if (!pushed.success) {
                return pushed;
            }

            return mergeCloudData({
                context,
                resolution,
            });
        }

        case 'none':
        default:
            return {
                success: true,
                action: 'none',
                hadCloudData: false,
                localSummary: plan.localSummary,
                cloudSummary: plan.cloudSummary,
            };
        }
    } catch (error) {
        return {
            success: false,
            action: 'none',
            hadCloudData: false,
            localSummary: undefined,
            cloudSummary: undefined,
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
