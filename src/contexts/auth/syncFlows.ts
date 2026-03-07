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

function getSuccessMessage(outcome: LoginSyncOutcome): string {
    if (outcome.resolution === 'cloud' || outcome.action === 'restore_from_cloud') {
        return 'クラウドのデータを復元しました';
    }

    if (outcome.resolution === 'local' || outcome.action === 'push_local') {
        return 'この端末のデータを同期しました';
    }

    if (outcome.action === 'merge') {
        return '同期が完了しました';
    }

    return 'ログインしました';
}

async function pushCurrentLocalState(): Promise<void> {
    const state = useAppStore.getState();
    await initialSync(state.users, getAppSettingsSnapshot());
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

        switch (plan.kind) {
        case 'restore_from_cloud': {
            const result = await restoreFromCloud(accountId);
            if (!result.success) {
                return {
                    success: false,
                    action: plan.kind,
                    hadCloudData: hasCloudData(plan.cloudSummary),
                    error: result.error,
                };
            }

            localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
            return {
                success: true,
                action: plan.kind,
                hadCloudData: result.hadData,
            };
        }

        case 'push_local': {
            await pushCurrentLocalState();
            localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
            return {
                success: true,
                action: plan.kind,
                hadCloudData: false,
            };
        }

        case 'merge': {
            const result = await pullAndMerge(accountId);
            if (!result.success) {
                return {
                    success: false,
                    action: plan.kind,
                    hadCloudData: hasCloudData(plan.cloudSummary),
                    error: result.error,
                };
            }

            localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
            return {
                success: true,
                action: plan.kind,
                hadCloudData: result.hadData,
            };
        }

        case 'conflict': {
            const resolution = await resolveConflict({
                localSummary: plan.localSummary,
                cloudSummary: plan.cloudSummary,
            });

            if (resolution === 'cloud') {
                const result = await restoreFromCloud(accountId);
                if (!result.success) {
                    return {
                        success: false,
                        action: 'restore_from_cloud',
                        hadCloudData: hasCloudData(plan.cloudSummary),
                        resolution,
                        error: result.error,
                    };
                }

                localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
                return {
                    success: true,
                    action: 'restore_from_cloud',
                    hadCloudData: result.hadData,
                    resolution,
                };
            }

            await pushCurrentLocalState();
            const result = await pullAndMerge(accountId);
            if (!result.success) {
                return {
                    success: false,
                    action: 'merge',
                    hadCloudData: hasCloudData(plan.cloudSummary),
                    resolution,
                    error: result.error,
                };
            }

            localStorage.setItem(SYNCED_ACCOUNT_KEY, accountId);
            return {
                success: true,
                action: 'merge',
                hadCloudData: result.hadData,
                resolution,
            };
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
            throw new Error(outcome.error ?? 'Unknown sync error');
        }

        setToastMessage(getSuccessMessage(outcome));
    } catch (error) {
        console.warn('[auth] handleSettingsLogin failed:', error);
        setToastMessage('同期に失敗しました');
    } finally {
        setIsSyncing(false);
        setLoginContext(null);
    }
}
