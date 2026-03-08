import { getCustomGroups, saveCustomGroupDirect } from '../customGroups';
import {
    getAllSessions,
    getCustomExercises,
    saveCustomExerciseDirect,
    saveSessionDirect,
    type CustomExercise,
    type SessionRecord,
} from '../db';
import { supabase } from '../supabase';
import type { MenuGroup } from '../../data/menuGroups';
import type { UserProfileStore } from '../../store/useAppStore';
import { isPulling, setPulling } from './authState';
import {
    applyCloudSnapshot,
    fetchCloudSyncSnapshot,
    type CloudSyncSnapshot,
} from './pullSnapshot';
import {
    buildMergedSettingsState,
    buildRestoredStoreState,
    getLocalUsers,
    type LocalStateRecord,
} from './pullStoreState';
import { pushCustomExercise, pushFamilyMember, pushMenuGroup, pushSession } from './push';
import { getRegisteredStoreState, setRegisteredStoreState } from './storeAccess';
import { toLocalUserFromCloudFamily } from './mappers';

export { buildRestoredStoreState } from './pullStoreState';
export { fetchCloudSyncSnapshot } from './pullSnapshot';
export type { CloudSyncSnapshot } from './pullSnapshot';

export interface PullResult {
    success: boolean;
    error?: string;
    hadData: boolean;
}

interface PullOptions {
    pushLocalOnly?: boolean;
}

function getLocalStateRecord(): LocalStateRecord {
    return (getRegisteredStoreState() ?? {}) as LocalStateRecord;
}

async function mergeSessions(cloudSessions: SessionRecord[], pushLocalOnly: boolean): Promise<void> {
    const localSessions = await getAllSessions();
    const localSessionIds = new Set(localSessions.map((session) => session.id));
    const cloudSessionIds = new Set(cloudSessions.map((session) => session.id));

    for (const cloudSession of cloudSessions) {
        if (!localSessionIds.has(cloudSession.id)) {
            await saveSessionDirect(cloudSession);
        }
    }

    if (!pushLocalOnly) {
        return;
    }

    for (const localSession of localSessions) {
        if (!cloudSessionIds.has(localSession.id)) {
            pushSession(localSession).catch(() => {});
        }
    }
}

async function mergeExercises(cloudExercises: CustomExercise[], pushLocalOnly: boolean): Promise<void> {
    const localExercises = await getCustomExercises();
    const cloudExerciseIds = new Set(cloudExercises.map((exercise) => exercise.id));

    for (const cloudExercise of cloudExercises) {
        await saveCustomExerciseDirect(cloudExercise);
    }

    if (!pushLocalOnly) {
        return;
    }

    for (const localExercise of localExercises) {
        if (!cloudExerciseIds.has(localExercise.id)) {
            pushCustomExercise(localExercise).catch(() => {});
        }
    }
}

async function mergeGroups(cloudGroups: MenuGroup[], pushLocalOnly: boolean): Promise<void> {
    const localGroups = await getCustomGroups();
    const cloudGroupIds = new Set(cloudGroups.map((group) => group.id));

    for (const cloudGroup of cloudGroups) {
        await saveCustomGroupDirect(cloudGroup);
    }

    if (!pushLocalOnly) {
        return;
    }

    for (const localGroup of localGroups) {
        if (!localGroup.isPreset && !cloudGroupIds.has(localGroup.id)) {
            pushMenuGroup(localGroup).catch(() => {});
        }
    }
}

function mergeUsers(
    snapshot: CloudSyncSnapshot,
    localUsers: UserProfileStore[],
    pushLocalOnly: boolean,
): UserProfileStore[] {
    const cloudUserIds = new Set(snapshot.families.map((family) => family.id));
    const users = snapshot.families.map((family) => {
        const localUser = localUsers.find((user) => user.id === family.id);
        return toLocalUserFromCloudFamily(family, localUser);
    });

    if (!pushLocalOnly) {
        return users;
    }

    for (const localUser of localUsers) {
        if (!cloudUserIds.has(localUser.id)) {
            users.push(localUser);
            pushFamilyMember(localUser).catch(() => {});
        }
    }

    return users;
}

function hasSnapshotData(snapshot: CloudSyncSnapshot): boolean {
    return (
        snapshot.families.length > 0 ||
        snapshot.sessions.length > 0 ||
        snapshot.exercises.length > 0 ||
        snapshot.groups.length > 0 ||
        snapshot.settings != null
    );
}

export async function restoreFromCloud(accountId: string): Promise<PullResult> {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured', hadData: false };
    }

    if (isPulling()) {
        console.warn('[sync] restoreFromCloud already in progress, skipping');
        return { success: false, error: 'Pull already in progress', hadData: false };
    }

    setPulling(true);

    try {
        const snapshot = await fetchCloudSyncSnapshot(accountId);
        await applyCloudSnapshot(snapshot);
        return { success: true, hadData: hasSnapshotData(snapshot) };
    } catch (error) {
        console.error('[sync] restoreFromCloud failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}

export async function pullAndMerge(
    accountId: string,
    options: PullOptions = {},
): Promise<PullResult> {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured', hadData: false };
    }

    if (isPulling()) {
        console.warn('[sync] pullAndMerge already in progress, skipping');
        return { success: false, error: 'Pull already in progress', hadData: false };
    }

    const pushLocalOnly = options.pushLocalOnly ?? true;
    setPulling(true);

    try {
        const snapshot = await fetchCloudSyncSnapshot(accountId);
        await mergeSessions(snapshot.sessions, pushLocalOnly);
        await mergeExercises(snapshot.exercises, pushLocalOnly);
        await mergeGroups(snapshot.groups, pushLocalOnly);

        const localState = getLocalStateRecord();
        const localUsers = getLocalUsers(localState);

        if (snapshot.families.length > 0) {
            const users = mergeUsers(snapshot, localUsers, pushLocalOnly);
            const restoredState = buildRestoredStoreState({
                localState,
                users,
                settings: snapshot.settings,
            });

            setRegisteredStoreState({
                ...buildMergedSettingsState(localState, snapshot.settings),
                users,
                sessionUserIds: restoredState.sessionUserIds,
                joinedChallengeIds: restoredState.joinedChallengeIds,
                onboardingCompleted: snapshot.settings?.onboarding_completed ?? true,
            });
        } else if (snapshot.settings) {
            console.warn('[sync] No family_members but cloud settings found, restoring settings only');
            setRegisteredStoreState(buildMergedSettingsState(localState, snapshot.settings));
        }

        return { success: true, hadData: hasSnapshotData(snapshot) };
    } catch (error) {
        console.error('[sync] pullAndMerge failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}
