import type {
    AppState,
} from './types';
import {
    sanitizeHomeVisitMemory,
    sanitizeJoinedChallengeIds,
} from './migrate-helpers/homeVisitSanitizers';
import {
    sanitizeBooleanSetting,
    sanitizeNotificationTime,
    sanitizeNullableNumber,
    sanitizeSoundVolume,
    sanitizeStringArray,
} from './migrate-helpers/primitives';
import {
    sanitizeSessionDraft,
    sanitizeSessionUserIds,
} from './migrate-helpers/sessionSanitizers';
import { sanitizeUsers } from './migrate-helpers/userSanitizers';

export {
    sanitizeHomeVisitMemory,
    sanitizeJoinedChallengeIds,
} from './migrate-helpers/homeVisitSanitizers';
export {
    isValidNotificationTime,
    sanitizeBooleanSetting,
    sanitizeNotificationTime,
    sanitizeNullableNumber,
    sanitizeSoundVolume,
    sanitizeStringArray,
} from './migrate-helpers/primitives';
export {
    sanitizeSessionDraft,
    sanitizeSessionUserIds,
} from './migrate-helpers/sessionSanitizers';

export function sanitizePersistedState(state: Record<string, unknown>): void {
    const users = sanitizeUsers(state.users);
    const validUserIds = users.map((user) => user.id);
    const validUserIdSet = new Set(validUserIds);

    state.users = users;
    state.onboardingCompleted = sanitizeBooleanSetting(state.onboardingCompleted, false);
    state.soundVolume = sanitizeSoundVolume(state.soundVolume);
    state.ttsEnabled = sanitizeBooleanSetting(state.ttsEnabled, true);
    state.bgmEnabled = sanitizeBooleanSetting(state.bgmEnabled, true);
    state.hapticEnabled = sanitizeBooleanSetting(state.hapticEnabled, true);
    state.notificationsEnabled = sanitizeBooleanSetting(state.notificationsEnabled, false);
    state.notificationTime = sanitizeNotificationTime(state.notificationTime);
    state.hasSeenSessionControlsHint = sanitizeBooleanSetting(state.hasSeenSessionControlsHint, false);
    state.dismissedHomeAnnouncementIds = sanitizeStringArray(state.dismissedHomeAnnouncementIds);
    state.debugFuwafuwaStage = sanitizeNullableNumber(state.debugFuwafuwaStage);
    state.debugFuwafuwaType = sanitizeNullableNumber(state.debugFuwafuwaType);
    state.debugActiveDays = sanitizeNullableNumber(state.debugActiveDays);
    state.debugFuwafuwaScale = sanitizeNullableNumber(state.debugFuwafuwaScale);
    state.joinedChallengeIds = sanitizeJoinedChallengeIds(state.joinedChallengeIds, validUserIdSet);
    state.homeVisitMemory = sanitizeHomeVisitMemory(state.homeVisitMemory, validUserIdSet);
    state.sessionUserIds = sanitizeSessionUserIds(state.sessionUserIds, validUserIds);
    state.sessionDraft = sanitizeSessionDraft(state.sessionDraft, validUserIdSet);
}

export type PersistedAppStateRecord = Record<string, unknown> & Partial<AppState>;
