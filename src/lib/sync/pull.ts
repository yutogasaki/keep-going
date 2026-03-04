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
import { setPulling } from './authState';
import { getRegisteredStoreState, setRegisteredStoreState } from './storeAccess';
import { pushSession, pushCustomExercise, pushMenuGroup } from './push';

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
        if (families.length > 0) {
            const localUsers = (getRegisteredStoreState()?.users ?? []) as UserProfileStore[];

            const users: UserProfileStore[] = families.map((family) => {
                const localUser = localUsers.find((u) => u.id === family.id);
                return toLocalUserFromCloudFamily(family, localUser);
            });

            const localState = (getRegisteredStoreState() ?? {}) as Record<string, unknown>;

            setRegisteredStoreState({
                users,
                sessionUserIds: [users[0]?.id].filter(Boolean),
                onboardingCompleted: cloudSettings?.onboarding_completed ?? localState['onboardingCompleted'] ?? true,
                soundVolume: cloudSettings?.sound_volume ?? localState['soundVolume'] ?? 1.0,
                ttsEnabled: cloudSettings?.tts_enabled ?? localState['ttsEnabled'] ?? true,
                bgmEnabled: cloudSettings?.bgm_enabled ?? localState['bgmEnabled'] ?? true,
                hapticEnabled: cloudSettings?.haptic_enabled ?? localState['hapticEnabled'] ?? true,
                notificationsEnabled: cloudSettings?.notifications_enabled ?? localState['notificationsEnabled'] ?? false,
                notificationTime: cloudSettings?.notification_time ?? localState['notificationTime'] ?? '21:00',
            });
        }

        return { success: true, hadData: families.length > 0 };
    } catch (error) {
        console.error('[sync] pullAndMerge failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}
