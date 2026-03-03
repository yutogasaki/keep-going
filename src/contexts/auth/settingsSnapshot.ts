import { useAppStore } from '../../store/useAppStore';

export function getAppSettingsSnapshot() {
    const state = useAppStore.getState();

    return {
        onboardingCompleted: state.onboardingCompleted,
        soundVolume: state.soundVolume,
        ttsEnabled: state.ttsEnabled,
        bgmEnabled: state.bgmEnabled,
        hapticEnabled: state.hapticEnabled,
        notificationsEnabled: state.notificationsEnabled,
        notificationTime: state.notificationTime,
    };
}
