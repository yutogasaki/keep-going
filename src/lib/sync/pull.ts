import { supabase } from '../supabase';
import type { CustomExercise, SessionRecord } from '../db';
import {
    getAllSessions,
    getCustomExercises,
    saveCustomExerciseDirect,
    saveSessionDirect,
} from '../db';
import {
    getCustomGroups,
    saveCustomGroupDirect,
    type MenuGroup,
} from '../../data/menuGroups';
import type { UserProfileStore } from '../../store/useAppStore';
import {
    toLocalCustomExercise,
    toLocalCustomMenuGroup,
    toLocalSessionRecord,
    toLocalUserFromCloudFamily,
} from './mappers';
import { isPulling, setPulling } from './authState';
import { getRegisteredStoreState, setRegisteredStoreState } from './storeAccess';
import { pushSession, pushCustomExercise, pushMenuGroup, pushFamilyMember } from './push';

export interface PullResult {
    success: boolean;
    error?: string;
    hadData: boolean;
}

/**
 * Union-merge sync: fetches cloud data, merges with local, pushes local-only items up.
 * - Sessions: append-only union (both cloud + local kept)
 * - Exercises / Groups: cloud wins on same ID, local-only pushed to cloud
 * - Users: cloud wins with local fuwafuwa array merge
 * - Settings: cloud wins (fallback to local if null)
 */
export async function pullAndMerge(accountId: string): Promise<PullResult> {
    if (!supabase) {
        return { success: false, error: 'Supabase not configured', hadData: false };
    }

    // Guard against concurrent pulls
    if (isPulling()) {
        console.warn('[sync] pullAndMerge already in progress, skipping');
        return { success: false, error: 'Pull already in progress', hadData: false };
    }

    setPulling(true);

    try {
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

        const families = familyRes.data ?? [];
        const cloudSessions: SessionRecord[] = (sessionsRes.data ?? []).map(toLocalSessionRecord);
        const cloudExercises: CustomExercise[] = (exercisesRes.data ?? []).map(toLocalCustomExercise);
        const cloudGroups: MenuGroup[] = (groupsRes.data ?? [])
            .filter((g) => !g.is_preset)
            .map(toLocalCustomMenuGroup);
        const cloudSettings = settingsRes.data;

        // --- Sessions: union merge ---
        const localSessions = await getAllSessions();
        const localSessionIds = new Set(localSessions.map((s) => s.id));
        const cloudSessionIds = new Set(cloudSessions.map((s) => s.id));

        for (const cs of cloudSessions) {
            if (!localSessionIds.has(cs.id)) {
                await saveSessionDirect(cs);
            }
        }
        for (const ls of localSessions) {
            if (!cloudSessionIds.has(ls.id)) {
                pushSession(ls).catch(() => {}); // fire-and-forget, queue handles retries
            }
        }

        // --- Exercises: cloud wins, push local-only ---
        const localExercises = await getCustomExercises();
        const cloudExerciseIds = new Set(cloudExercises.map((e) => e.id));

        for (const ce of cloudExercises) {
            await saveCustomExerciseDirect(ce);
        }
        for (const le of localExercises) {
            if (!cloudExerciseIds.has(le.id)) {
                pushCustomExercise(le).catch(() => {});
            }
        }

        // --- Groups: cloud wins, push local-only ---
        const localGroups = await getCustomGroups();
        const cloudGroupIds = new Set(cloudGroups.map((g) => g.id));

        for (const cg of cloudGroups) {
            await saveCustomGroupDirect(cg);
        }
        for (const lg of localGroups) {
            if (!lg.isPreset && !cloudGroupIds.has(lg.id)) {
                pushMenuGroup(lg).catch(() => {});
            }
        }

        // --- Users: cloud wins with local array merge ---
        const localState = (getRegisteredStoreState() ?? {}) as Record<string, unknown>;

        if (families.length > 0) {
            const localUsers = (localState['users'] ?? []) as UserProfileStore[];

            const cloudUserIds = new Set(families.map((f) => f.id));
            const users: UserProfileStore[] = families.map((family) => {
                const localUser = localUsers.find((u) => u.id === family.id);
                return toLocalUserFromCloudFamily(family, localUser);
            });

            // Keep local-only users and push them to cloud
            for (const lu of localUsers) {
                if (!cloudUserIds.has(lu.id)) {
                    users.push(lu);
                    pushFamilyMember(lu).catch(() => {});
                }
            }

            // Preserve existing sessionUserIds if they are valid, otherwise default to first user
            const existingSessionUserIds = (localState['sessionUserIds'] ?? []) as string[];
            const validSessionUserIds = existingSessionUserIds.filter((id) =>
                users.some((u) => u.id === id),
            );
            const sessionUserIds = validSessionUserIds.length > 0
                ? validSessionUserIds
                : [users[0]?.id].filter(Boolean);

            setRegisteredStoreState({
                users,
                sessionUserIds,
                onboardingCompleted: cloudSettings?.onboarding_completed ?? localState['onboardingCompleted'] ?? true,
                soundVolume: cloudSettings?.sound_volume ?? localState['soundVolume'] ?? 1.0,
                ttsEnabled: cloudSettings?.tts_enabled ?? localState['ttsEnabled'] ?? true,
                bgmEnabled: cloudSettings?.bgm_enabled ?? localState['bgmEnabled'] ?? true,
                hapticEnabled: cloudSettings?.haptic_enabled ?? localState['hapticEnabled'] ?? true,
                notificationsEnabled: cloudSettings?.notifications_enabled ?? localState['notificationsEnabled'] ?? false,
                notificationTime: cloudSettings?.notification_time ?? localState['notificationTime'] ?? '21:00',
            });
        } else if (cloudSettings) {
            // No family members but cloud settings exist — restore settings
            // This handles the case where a user logs in on a new browser
            // and family_members sync failed but settings were saved
            console.warn('[sync] No family_members but cloud settings found, restoring settings only');
            setRegisteredStoreState({
                onboardingCompleted: cloudSettings.onboarding_completed ?? localState['onboardingCompleted'] ?? true,
                soundVolume: cloudSettings.sound_volume ?? localState['soundVolume'] ?? 1.0,
                ttsEnabled: cloudSettings.tts_enabled ?? localState['ttsEnabled'] ?? true,
                bgmEnabled: cloudSettings.bgm_enabled ?? localState['bgmEnabled'] ?? true,
                hapticEnabled: cloudSettings.haptic_enabled ?? localState['hapticEnabled'] ?? true,
                notificationsEnabled: cloudSettings.notifications_enabled ?? localState['notificationsEnabled'] ?? false,
                notificationTime: cloudSettings.notification_time ?? localState['notificationTime'] ?? '21:00',
            });
        }

        const hadData = families.length > 0 || cloudSessions.length > 0 || cloudSettings != null;
        return { success: true, hadData };
    } catch (error) {
        console.error('[sync] pullAndMerge failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}
