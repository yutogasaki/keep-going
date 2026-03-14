import type { UserProfileStore } from '../../store/useAppStore';
import {
    isValidNotificationTime,
    sanitizeChallengeEnrollmentWindows,
    sanitizeBooleanSetting,
    sanitizeJoinedChallengeIds,
    sanitizeSessionUserIds,
    sanitizeSoundVolume,
} from '../../store/use-app-store/migrateHelpers';
import { buildChallengeEnrollmentState, type ChallengeEnrollment } from '../challenges';
import type { Database } from '../supabase-types';

export type CloudAppSettings = Database['public']['Tables']['app_settings']['Row'];
export type LocalStateRecord = Record<string, unknown>;

export function getLocalUsers(localState: LocalStateRecord): UserProfileStore[] {
    return Array.isArray(localState.users) ? (localState.users as UserProfileStore[]) : [];
}

function pickBooleanSetting(cloudValue: unknown, localValue: unknown, fallback: boolean): boolean {
    const localFallback = sanitizeBooleanSetting(localValue, fallback);
    return typeof cloudValue === 'boolean' ? cloudValue : localFallback;
}

function pickSoundVolume(cloudValue: unknown, localValue: unknown): number {
    const localFallback = sanitizeSoundVolume(localValue);
    return typeof cloudValue === 'number' && Number.isFinite(cloudValue)
        ? sanitizeSoundVolume(cloudValue)
        : localFallback;
}

function pickNotificationTime(cloudValue: unknown, localValue: unknown): string {
    const localFallback = isValidNotificationTime(localValue) ? localValue : '21:00';
    return isValidNotificationTime(cloudValue) ? cloudValue : localFallback;
}

function deriveSessionUserIds(localState: LocalStateRecord, users: UserProfileStore[]): string[] {
    return sanitizeSessionUserIds(localState.sessionUserIds, users.map((user) => user.id));
}

function filterJoinedChallengeIds(
    localState: LocalStateRecord,
    users: UserProfileStore[],
): Record<string, string[]> {
    return sanitizeJoinedChallengeIds(localState.joinedChallengeIds, new Set(users.map((user) => user.id)));
}

function filterChallengeEnrollmentWindows(
    localState: LocalStateRecord,
    users: UserProfileStore[],
): Record<string, Record<string, { startDate: string; endDate: string }>> {
    return sanitizeChallengeEnrollmentWindows(localState.challengeEnrollmentWindows, new Set(users.map((user) => user.id)));
}

export function buildRestoredStoreState({
    localState,
    users,
    settings,
    challengeEnrollments = [],
}: {
    localState: LocalStateRecord;
    users: UserProfileStore[];
    settings: CloudAppSettings | null;
    challengeEnrollments?: ChallengeEnrollment[];
}): Record<string, unknown> {
    const hasUsers = users.length > 0;
    const localJoinedChallengeIds = filterJoinedChallengeIds(localState, users);
    const localChallengeEnrollmentWindows = filterChallengeEnrollmentWindows(localState, users);
    const cloudEnrollmentState = buildChallengeEnrollmentState(challengeEnrollments);
    const joinedChallengeIds = challengeEnrollments.length > 0
        ? cloudEnrollmentState.joinedChallengeIds
        : localJoinedChallengeIds;
    const challengeEnrollmentWindows = challengeEnrollments.length > 0
        ? cloudEnrollmentState.challengeEnrollmentWindows
        : localChallengeEnrollmentWindows;

    return {
        users,
        sessionUserIds: deriveSessionUserIds(localState, users),
        joinedChallengeIds,
        challengeEnrollmentWindows,
        onboardingCompleted: hasUsers
            ? settings == null
                ? true
                : pickBooleanSetting(settings.onboarding_completed, localState.onboardingCompleted, true)
            : false,
        soundVolume: pickSoundVolume(settings?.sound_volume, localState.soundVolume),
        ttsEnabled: pickBooleanSetting(settings?.tts_enabled, localState.ttsEnabled, true),
        bgmEnabled: pickBooleanSetting(settings?.bgm_enabled, localState.bgmEnabled, true),
        hapticEnabled: pickBooleanSetting(settings?.haptic_enabled, localState.hapticEnabled, true),
        notificationsEnabled: pickBooleanSetting(settings?.notifications_enabled, localState.notificationsEnabled, false),
        notificationTime: pickNotificationTime(settings?.notification_time, localState.notificationTime),
    };
}

export function buildMergedSettingsState(
    localState: LocalStateRecord,
    settings: CloudAppSettings | null,
): Record<string, unknown> {
    return {
        onboardingCompleted: pickBooleanSetting(settings?.onboarding_completed, localState.onboardingCompleted, false),
        soundVolume: pickSoundVolume(settings?.sound_volume, localState.soundVolume),
        ttsEnabled: pickBooleanSetting(settings?.tts_enabled, localState.ttsEnabled, true),
        bgmEnabled: pickBooleanSetting(settings?.bgm_enabled, localState.bgmEnabled, true),
        hapticEnabled: pickBooleanSetting(settings?.haptic_enabled, localState.hapticEnabled, true),
        notificationsEnabled: pickBooleanSetting(settings?.notifications_enabled, localState.notificationsEnabled, false),
        notificationTime: pickNotificationTime(settings?.notification_time, localState.notificationTime),
    };
}
