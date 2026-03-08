import type { UserProfileStore } from '../../store/useAppStore';
import type { Database } from '../supabase-types';

export type CloudAppSettings = Database['public']['Tables']['app_settings']['Row'];
export type LocalStateRecord = Record<string, unknown>;

export function getLocalUsers(localState: LocalStateRecord): UserProfileStore[] {
    return Array.isArray(localState.users) ? (localState.users as UserProfileStore[]) : [];
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

function deriveSessionUserIds(localState: LocalStateRecord, users: UserProfileStore[]): string[] {
    const existing = getStringArray(localState.sessionUserIds);
    const valid = existing.filter((id) => users.some((user) => user.id === id));
    if (valid.length > 0) {
        return valid;
    }
    return users[0] ? [users[0].id] : [];
}

function filterJoinedChallengeIds(
    localState: LocalStateRecord,
    users: UserProfileStore[],
): Record<string, string[]> {
    const source = localState.joinedChallengeIds;
    if (!source || typeof source !== 'object') {
        return {};
    }

    const validUserIds = new Set(users.map((user) => user.id));
    const result: Record<string, string[]> = {};

    for (const [userId, value] of Object.entries(source as Record<string, unknown>)) {
        if (!validUserIds.has(userId)) {
            continue;
        }
        result[userId] = getStringArray(value);
    }

    return result;
}

export function buildRestoredStoreState({
    localState,
    users,
    settings,
}: {
    localState: LocalStateRecord;
    users: UserProfileStore[];
    settings: CloudAppSettings | null;
}): Record<string, unknown> {
    const hasUsers = users.length > 0;

    return {
        users,
        sessionUserIds: deriveSessionUserIds(localState, users),
        joinedChallengeIds: filterJoinedChallengeIds(localState, users),
        onboardingCompleted: hasUsers ? settings?.onboarding_completed ?? true : false,
        soundVolume: settings?.sound_volume ?? getNumber(localState.soundVolume, 1.0),
        ttsEnabled: settings?.tts_enabled ?? getBoolean(localState.ttsEnabled, true),
        bgmEnabled: settings?.bgm_enabled ?? getBoolean(localState.bgmEnabled, true),
        hapticEnabled: settings?.haptic_enabled ?? getBoolean(localState.hapticEnabled, true),
        notificationsEnabled: settings?.notifications_enabled ?? getBoolean(localState.notificationsEnabled, false),
        notificationTime: settings?.notification_time ?? getString(localState.notificationTime, '21:00'),
    };
}

export function buildMergedSettingsState(
    localState: LocalStateRecord,
    settings: CloudAppSettings | null,
): Record<string, unknown> {
    return {
        onboardingCompleted: settings?.onboarding_completed ?? getBoolean(localState.onboardingCompleted, false),
        soundVolume: settings?.sound_volume ?? getNumber(localState.soundVolume, 1.0),
        ttsEnabled: settings?.tts_enabled ?? getBoolean(localState.ttsEnabled, true),
        bgmEnabled: settings?.bgm_enabled ?? getBoolean(localState.bgmEnabled, true),
        hapticEnabled: settings?.haptic_enabled ?? getBoolean(localState.hapticEnabled, true),
        notificationsEnabled: settings?.notifications_enabled ?? getBoolean(localState.notificationsEnabled, false),
        notificationTime: settings?.notification_time ?? getString(localState.notificationTime, '21:00'),
    };
}
