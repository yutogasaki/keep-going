import { supabase } from '../supabase';
import type { Database } from '../supabase-types';
import type { CustomExercise, SessionRecord } from '../db';
import {
    clearCustomExercisesDB,
    clearHistoryDB,
    getAllSessions,
    getCustomExercises,
    saveCustomExerciseDirect,
    saveSessionDirect,
} from '../db';
import { clearGroupsDB, getCustomGroups, saveCustomGroupDirect } from '../customGroups';
import type { MenuGroup } from '../../data/menuGroups';
import type { UserProfileStore } from '../../store/useAppStore';
import {
    toLocalCustomExercise,
    toLocalCustomMenuGroup,
    toLocalSessionRecord,
    toLocalUserFromCloudFamily,
} from './mappers';
import { isPulling, setPulling } from './authState';
import { getRegisteredStoreState, setRegisteredStoreState } from './storeAccess';
import { pushCustomExercise, pushFamilyMember, pushMenuGroup, pushSession } from './push';

type CloudFamilyMember = Database['public']['Tables']['family_members']['Row'];
type CloudAppSettings = Database['public']['Tables']['app_settings']['Row'];

export interface PullResult {
    success: boolean;
    error?: string;
    hadData: boolean;
}

export interface CloudSyncSnapshot {
    families: CloudFamilyMember[];
    sessions: SessionRecord[];
    exercises: CustomExercise[];
    groups: MenuGroup[];
    settings: CloudAppSettings | null;
}

interface PullOptions {
    pushLocalOnly?: boolean;
}

function getLocalStateRecord(): Record<string, unknown> {
    return (getRegisteredStoreState() ?? {}) as Record<string, unknown>;
}

function getLocalUsers(localState: Record<string, unknown>): UserProfileStore[] {
    return Array.isArray(localState['users']) ? (localState['users'] as UserProfileStore[]) : [];
}

function getStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function getNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' ? value : fallback;
}

function getBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function getString(value: unknown, fallback: string): string {
    return typeof value === 'string' ? value : fallback;
}

function deriveSessionUserIds(localState: Record<string, unknown>, users: UserProfileStore[]): string[] {
    const existing = getStringArray(localState['sessionUserIds']);
    const valid = existing.filter((id) => users.some((user) => user.id === id));
    if (valid.length > 0) {
        return valid;
    }
    return users[0] ? [users[0].id] : [];
}

function filterJoinedChallengeIds(
    localState: Record<string, unknown>,
    users: UserProfileStore[],
): Record<string, string[]> {
    const source = localState['joinedChallengeIds'];
    if (!source || typeof source !== 'object') {
        return {};
    }

    const validUserIds = new Set(users.map((user) => user.id));
    const result: Record<string, string[]> = {};

    for (const [userId, value] of Object.entries(source as Record<string, unknown>)) {
        if (!validUserIds.has(userId)) continue;
        result[userId] = getStringArray(value);
    }

    return result;
}

export function buildRestoredStoreState({
    localState,
    users,
    settings,
}: {
    localState: Record<string, unknown>;
    users: UserProfileStore[];
    settings: CloudAppSettings | null;
}): Record<string, unknown> {
    const hasUsers = users.length > 0;

    return {
        users,
        sessionUserIds: deriveSessionUserIds(localState, users),
        joinedChallengeIds: filterJoinedChallengeIds(localState, users),
        onboardingCompleted: hasUsers
            ? settings?.onboarding_completed ?? true
            : false,
        soundVolume: settings?.sound_volume ?? getNumber(localState['soundVolume'], 1.0),
        ttsEnabled: settings?.tts_enabled ?? getBoolean(localState['ttsEnabled'], true),
        bgmEnabled: settings?.bgm_enabled ?? getBoolean(localState['bgmEnabled'], true),
        hapticEnabled: settings?.haptic_enabled ?? getBoolean(localState['hapticEnabled'], true),
        notificationsEnabled: settings?.notifications_enabled ?? getBoolean(localState['notificationsEnabled'], false),
        notificationTime: settings?.notification_time ?? getString(localState['notificationTime'], '21:00'),
    };
}

function buildMergedSettingsState(
    localState: Record<string, unknown>,
    settings: CloudAppSettings | null,
): Record<string, unknown> {
    return {
        onboardingCompleted: settings?.onboarding_completed ?? getBoolean(localState['onboardingCompleted'], false),
        soundVolume: settings?.sound_volume ?? getNumber(localState['soundVolume'], 1.0),
        ttsEnabled: settings?.tts_enabled ?? getBoolean(localState['ttsEnabled'], true),
        bgmEnabled: settings?.bgm_enabled ?? getBoolean(localState['bgmEnabled'], true),
        hapticEnabled: settings?.haptic_enabled ?? getBoolean(localState['hapticEnabled'], true),
        notificationsEnabled: settings?.notifications_enabled ?? getBoolean(localState['notificationsEnabled'], false),
        notificationTime: settings?.notification_time ?? getString(localState['notificationTime'], '21:00'),
    };
}

export async function fetchCloudSyncSnapshot(accountId: string): Promise<CloudSyncSnapshot> {
    if (!supabase) {
        return {
            families: [],
            sessions: [],
            exercises: [],
            groups: [],
            settings: null,
        };
    }

    const [familyRes, sessionsRes, exercisesRes, groupsRes, settingsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('account_id', accountId),
        supabase.from('sessions').select('*').eq('account_id', accountId),
        supabase.from('custom_exercises').select('*').eq('account_id', accountId),
        supabase.from('menu_groups').select('*').eq('account_id', accountId),
        supabase.from('app_settings').select('*').eq('account_id', accountId).maybeSingle(),
    ]);

    if (familyRes.error) throw new Error(`family_members: ${familyRes.error.message}`);
    if (sessionsRes.error) throw new Error(`sessions: ${sessionsRes.error.message}`);
    if (exercisesRes.error) throw new Error(`custom_exercises: ${exercisesRes.error.message}`);
    if (groupsRes.error) throw new Error(`menu_groups: ${groupsRes.error.message}`);
    if (settingsRes.error) throw new Error(`app_settings: ${settingsRes.error.message}`);

    return {
        families: familyRes.data ?? [],
        sessions: (sessionsRes.data ?? []).map(toLocalSessionRecord),
        exercises: (exercisesRes.data ?? []).map(toLocalCustomExercise),
        groups: (groupsRes.data ?? [])
            .filter((group) => !group.is_preset)
            .map(toLocalCustomMenuGroup),
        settings: settingsRes.data,
    };
}

async function applyCloudSnapshot(snapshot: CloudSyncSnapshot): Promise<void> {
    const localState = getLocalStateRecord();
    const users = snapshot.families.map((family) => toLocalUserFromCloudFamily(family));

    await Promise.all([
        clearHistoryDB(),
        clearCustomExercisesDB(),
        clearGroupsDB(),
    ]);

    await Promise.all(snapshot.sessions.map((record) => saveSessionDirect(record)));
    await Promise.all(snapshot.exercises.map((exercise) => saveCustomExerciseDirect(exercise)));
    await Promise.all(snapshot.groups.map((group) => saveCustomGroupDirect(group)));

    setRegisteredStoreState(buildRestoredStoreState({
        localState,
        users,
        settings: snapshot.settings,
    }));
}

/**
 * Cloud restore: replace local sync data with the cloud snapshot.
 * This is used for new-device restore and explicit "use cloud" conflict resolution.
 */
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

        const hadData = snapshot.families.length > 0 ||
            snapshot.sessions.length > 0 ||
            snapshot.exercises.length > 0 ||
            snapshot.groups.length > 0 ||
            snapshot.settings != null;

        return { success: true, hadData };
    } catch (error) {
        console.error('[sync] restoreFromCloud failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}

/**
 * Union-merge sync: fetches cloud data, merges with local, and optionally pushes local-only items up.
 * - Sessions: append-only union (both cloud + local kept)
 * - Exercises / Groups: cloud wins on same ID, local-only pushed to cloud when enabled
 * - Users: cloud wins with local array merge, local-only users can be pushed when enabled
 * - Settings: cloud wins (fallback to local if null)
 */
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
        const cloudSessions = snapshot.sessions;
        const cloudExercises = snapshot.exercises;
        const cloudGroups = snapshot.groups;
        const cloudSettings = snapshot.settings;

        const localSessions = await getAllSessions();
        const localSessionIds = new Set(localSessions.map((session) => session.id));
        const cloudSessionIds = new Set(cloudSessions.map((session) => session.id));

        for (const cloudSession of cloudSessions) {
            if (!localSessionIds.has(cloudSession.id)) {
                await saveSessionDirect(cloudSession);
            }
        }

        if (pushLocalOnly) {
            for (const localSession of localSessions) {
                if (!cloudSessionIds.has(localSession.id)) {
                    pushSession(localSession).catch(() => {});
                }
            }
        }

        const localExercises = await getCustomExercises();
        const cloudExerciseIds = new Set(cloudExercises.map((exercise) => exercise.id));

        for (const cloudExercise of cloudExercises) {
            await saveCustomExerciseDirect(cloudExercise);
        }

        if (pushLocalOnly) {
            for (const localExercise of localExercises) {
                if (!cloudExerciseIds.has(localExercise.id)) {
                    pushCustomExercise(localExercise).catch(() => {});
                }
            }
        }

        const localGroups = await getCustomGroups();
        const cloudGroupIds = new Set(cloudGroups.map((group) => group.id));

        for (const cloudGroup of cloudGroups) {
            await saveCustomGroupDirect(cloudGroup);
        }

        if (pushLocalOnly) {
            for (const localGroup of localGroups) {
                if (!localGroup.isPreset && !cloudGroupIds.has(localGroup.id)) {
                    pushMenuGroup(localGroup).catch(() => {});
                }
            }
        }

        const localState = getLocalStateRecord();
        const localUsers = getLocalUsers(localState);

        if (snapshot.families.length > 0) {
            const cloudUserIds = new Set(snapshot.families.map((family) => family.id));
            const users: UserProfileStore[] = snapshot.families.map((family) => {
                const localUser = localUsers.find((user) => user.id === family.id);
                return toLocalUserFromCloudFamily(family, localUser);
            });

            if (pushLocalOnly) {
                for (const localUser of localUsers) {
                    if (!cloudUserIds.has(localUser.id)) {
                        users.push(localUser);
                        pushFamilyMember(localUser).catch(() => {});
                    }
                }
            }

            setRegisteredStoreState({
                ...buildMergedSettingsState(localState, cloudSettings),
                users,
                sessionUserIds: deriveSessionUserIds(localState, users),
                joinedChallengeIds: filterJoinedChallengeIds(localState, users),
                onboardingCompleted: cloudSettings?.onboarding_completed ?? true,
            });
        } else if (cloudSettings) {
            console.warn('[sync] No family_members but cloud settings found, restoring settings only');
            setRegisteredStoreState(buildMergedSettingsState(localState, cloudSettings));
        }

        const hadData = snapshot.families.length > 0 ||
            cloudSessions.length > 0 ||
            cloudExercises.length > 0 ||
            cloudGroups.length > 0 ||
            cloudSettings != null;

        return { success: true, hadData };
    } catch (error) {
        console.error('[sync] pullAndMerge failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}
