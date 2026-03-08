import {
    initialSync,
    pullAndMerge,
    restoreFromCloud,
    type LoginSyncPlanKind,
    type SyncConflictResolution,
    type SyncDataSummary,
} from '../../lib/sync';
import { useAppStore } from '../../store/useAppStore';
import { SYNCED_ACCOUNT_KEY } from './constants';
import { getAppSettingsSnapshot } from './settingsSnapshot';

export interface LoginSyncOutcome {
    success: boolean;
    action: LoginSyncPlanKind;
    hadCloudData: boolean;
    localSummary?: SyncDataSummary;
    cloudSummary?: SyncDataSummary;
    resolution?: SyncConflictResolution;
    error?: string;
}

export interface SyncExecutionContext {
    accountId: string;
    hadCloudData: boolean;
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
}

async function pushCurrentLocalState(): Promise<void> {
    const state = useAppStore.getState();
    await initialSync(state.users, getAppSettingsSnapshot());
}

function toFailureOutcome({
    context,
    action,
    error,
    resolution,
}: {
    context: SyncExecutionContext;
    action: LoginSyncPlanKind;
    error: unknown;
    resolution?: SyncConflictResolution;
}): LoginSyncOutcome {
    return {
        success: false,
        action,
        hadCloudData: context.hadCloudData,
        localSummary: context.localSummary,
        cloudSummary: context.cloudSummary,
        resolution,
        error: String(error),
    };
}

export async function restoreCloudData({
    context,
    action,
    resolution,
}: {
    context: SyncExecutionContext;
    action: LoginSyncPlanKind;
    resolution?: SyncConflictResolution;
}): Promise<LoginSyncOutcome> {
    try {
        const result = await restoreFromCloud(context.accountId);
        if (!result.success) {
            return toFailureOutcome({
                context,
                action,
                error: result.error ?? 'Cloud restore failed',
                resolution,
            });
        }

        localStorage.setItem(SYNCED_ACCOUNT_KEY, context.accountId);
        return {
            success: true,
            action,
            hadCloudData: result.hadData,
            localSummary: context.localSummary,
            cloudSummary: context.cloudSummary,
            resolution,
        };
    } catch (error) {
        return toFailureOutcome({
            context,
            action,
            error,
            resolution,
        });
    }
}

export async function mergeCloudData({
    context,
    resolution,
}: {
    context: SyncExecutionContext;
    resolution?: SyncConflictResolution;
}): Promise<LoginSyncOutcome> {
    try {
        const result = await pullAndMerge(context.accountId);
        if (!result.success) {
            return toFailureOutcome({
                context,
                action: 'merge',
                error: result.error ?? 'Merge failed',
                resolution,
            });
        }

        localStorage.setItem(SYNCED_ACCOUNT_KEY, context.accountId);
        return {
            success: true,
            action: 'merge',
            hadCloudData: result.hadData,
            localSummary: context.localSummary,
            cloudSummary: context.cloudSummary,
            resolution,
        };
    } catch (error) {
        return toFailureOutcome({
            context,
            action: 'merge',
            error,
            resolution,
        });
    }
}

export async function pushLocalData({
    context,
    resolution,
}: {
    context: SyncExecutionContext;
    resolution?: SyncConflictResolution;
}): Promise<LoginSyncOutcome> {
    try {
        await pushCurrentLocalState();
        localStorage.setItem(SYNCED_ACCOUNT_KEY, context.accountId);
        return {
            success: true,
            action: 'push_local',
            hadCloudData: context.hadCloudData,
            localSummary: context.localSummary,
            cloudSummary: context.cloudSummary,
            resolution,
        };
    } catch (error) {
        return toFailureOutcome({
            context,
            action: 'push_local',
            error,
            resolution,
        });
    }
}
