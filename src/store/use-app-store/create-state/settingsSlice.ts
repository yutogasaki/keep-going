import type { AppState } from '../types';
import type { AppStateSet } from './shared';

type SettingsSlice = Pick<
    AppState,
    | 'onboardingCompleted'
    | 'setOnboardingCompleted'
    | 'soundVolume'
    | 'setSoundVolume'
    | 'ttsEnabled'
    | 'setTtsEnabled'
    | 'bgmEnabled'
    | 'setBgmEnabled'
    | 'hapticEnabled'
    | 'setHapticEnabled'
    | 'notificationsEnabled'
    | 'setNotificationsEnabled'
    | 'notificationTime'
    | 'setNotificationTime'
    | 'hasSeenSessionControlsHint'
    | 'setHasSeenSessionControlsHint'
>;

export function createSettingsSlice(set: AppStateSet): SettingsSlice {
    return {
        onboardingCompleted: false,
        setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed }),
        soundVolume: 1.0,
        setSoundVolume: (soundVolume) => set({ soundVolume }),
        ttsEnabled: true,
        setTtsEnabled: (ttsEnabled) => set({ ttsEnabled }),
        bgmEnabled: true,
        setBgmEnabled: (bgmEnabled) => set({ bgmEnabled }),
        hapticEnabled: true,
        setHapticEnabled: (hapticEnabled) => set({ hapticEnabled }),
        notificationsEnabled: false,
        setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
        notificationTime: '21:00',
        setNotificationTime: (notificationTime) => set({ notificationTime }),
        hasSeenSessionControlsHint: false,
        setHasSeenSessionControlsHint: (hasSeenSessionControlsHint) => set({ hasSeenSessionControlsHint }),
    };
}
