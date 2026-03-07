import { getAllSessions, getCustomExercises } from '../db';
import { getCustomGroups } from '../customGroups';
import { fetchCloudSyncSnapshot } from './pull';
import { getRegisteredStoreState } from './storeAccess';

export interface SyncDataSummary {
    users: number;
    sessions: number;
    customExercises: number;
    customGroups: number;
    hasSettings: boolean;
}

export interface SyncConflictPromptData {
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
}

export type SyncConflictResolution = 'cloud' | 'local';
export type LoginSyncPlanKind = 'none' | 'restore_from_cloud' | 'push_local' | 'merge' | 'conflict';

export interface LoginSyncPlan {
    kind: LoginSyncPlanKind;
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
}

function isMeaningfulLocalData(summary: SyncDataSummary): boolean {
    return summary.users > 0 ||
        summary.sessions > 0 ||
        summary.customExercises > 0 ||
        summary.customGroups > 0;
}

export function hasCloudData(summary: SyncDataSummary): boolean {
    return isMeaningfulLocalData(summary) || summary.hasSettings;
}

function hasCustomSettings(localState: Record<string, unknown>): boolean {
    return Boolean(localState['onboardingCompleted']) ||
        Number(localState['soundVolume'] ?? 1) !== 1 ||
        Boolean(localState['notificationsEnabled']) ||
        String(localState['notificationTime'] ?? '21:00') !== '21:00' ||
        Boolean(localState['hasSeenSessionControlsHint']);
}

export function decideLoginSyncPlan({
    localSummary,
    cloudSummary,
    alreadySynced,
}: {
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
    alreadySynced: boolean;
}): LoginSyncPlan {
    const localHasData = isMeaningfulLocalData(localSummary);
    const cloudHasData = hasCloudData(cloudSummary);

    if (alreadySynced && (localHasData || cloudHasData)) {
        return { kind: 'merge', localSummary, cloudSummary };
    }

    if (cloudHasData && !localHasData) {
        return { kind: 'restore_from_cloud', localSummary, cloudSummary };
    }

    if (localHasData && !cloudHasData) {
        return { kind: 'push_local', localSummary, cloudSummary };
    }

    if (localHasData && cloudHasData) {
        return { kind: 'conflict', localSummary, cloudSummary };
    }

    return { kind: 'none', localSummary, cloudSummary };
}

export async function inspectLoginSyncPlan(
    accountId: string,
    syncedAccountId: string | null,
): Promise<LoginSyncPlan> {
    const localState = (getRegisteredStoreState() ?? {}) as Record<string, unknown>;
    const [localSessions, localExercises, localGroups, cloudSnapshot] = await Promise.all([
        getAllSessions(),
        getCustomExercises(),
        getCustomGroups(),
        fetchCloudSyncSnapshot(accountId),
    ]);

    const localUsers = Array.isArray(localState['users']) ? localState['users'] : [];

    const localSummary: SyncDataSummary = {
        users: localUsers.length,
        sessions: localSessions.length,
        customExercises: localExercises.length,
        customGroups: localGroups.length,
        hasSettings: hasCustomSettings(localState),
    };

    const cloudSummary: SyncDataSummary = {
        users: cloudSnapshot.families.length,
        sessions: cloudSnapshot.sessions.length,
        customExercises: cloudSnapshot.exercises.length,
        customGroups: cloudSnapshot.groups.length,
        hasSettings: cloudSnapshot.settings != null,
    };

    return decideLoginSyncPlan({
        localSummary,
        cloudSummary,
        alreadySynced: syncedAccountId === accountId,
    });
}
