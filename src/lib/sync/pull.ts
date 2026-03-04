import { supabase } from '../supabase';
import type { CustomExercise, SessionRecord } from '../db';
import {
    clearCustomExercisesDB,
    clearHistoryDB,
    saveCustomExerciseDirect,
    saveSessionDirect,
} from '../db';
import {
    clearGroupsDB,
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

export interface PullResult {
    success: boolean;
    error?: string;
    hadData: boolean;
}

export async function pullAllData(accountId: string): Promise<PullResult> {
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
        if (families.length === 0) {
            return { success: true, hadData: false };
        }

        const localUsers = (getRegisteredStoreState()?.users ?? []) as UserProfileStore[];

        const users: UserProfileStore[] = families.map((family) => {
            const localUser = localUsers.find((user) => user.id === family.id);
            return toLocalUserFromCloudFamily(family, localUser);
        });

        const sessions: SessionRecord[] = (sessionsRes.data ?? []).map(toLocalSessionRecord);
        const exercises: CustomExercise[] = (exercisesRes.data ?? []).map(toLocalCustomExercise);
        const groups: MenuGroup[] = (groupsRes.data ?? [])
            .filter((group) => !group.is_preset)
            .map(toLocalCustomMenuGroup);

        const cloudSettings = settingsRes.data;

        await clearHistoryDB();
        for (const session of sessions) {
            await saveSessionDirect(session);
        }

        await clearCustomExercisesDB();
        for (const exercise of exercises) {
            await saveCustomExerciseDirect(exercise);
        }

        await clearGroupsDB();
        for (const group of groups) {
            await saveCustomGroupDirect(group);
        }

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

        return { success: true, hadData: true };
    } catch (error) {
        console.error('[sync] pullAllData failed:', error);
        return { success: false, error: String(error), hadData: false };
    } finally {
        setPulling(false);
    }
}
