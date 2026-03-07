import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { audio } from '../../lib/audio';
import { VolumeCard } from './sound-notification/VolumeCard';
import { VoiceSettingsCard } from './sound-notification/VoiceSettingsCard';
import { AudioTogglesCard } from './sound-notification/AudioTogglesCard';
import { HapticCard } from './sound-notification/HapticCard';
import { NotificationCard } from './sound-notification/NotificationCard';

export const SoundNotificationSettingsSection: React.FC = () => {
    const soundVolume = useAppStore((state) => state.soundVolume);
    const setSoundVolume = useAppStore((state) => state.setSoundVolume);
    const ttsEnabled = useAppStore((state) => state.ttsEnabled);
    const setTtsEnabled = useAppStore((state) => state.setTtsEnabled);
    const hapticEnabled = useAppStore((state) => state.hapticEnabled);
    const setHapticEnabled = useAppStore((state) => state.setHapticEnabled);
    const notificationsEnabled = useAppStore((state) => state.notificationsEnabled);
    const setNotificationsEnabled = useAppStore((state) => state.setNotificationsEnabled);
    const ttsRate = useAppStore((state) => state.ttsRate);
    const setTtsRate = useAppStore((state) => state.setTtsRate);
    const ttsPitch = useAppStore((state) => state.ttsPitch);
    const setTtsPitch = useAppStore((state) => state.setTtsPitch);
    const notificationTime = useAppStore((state) => state.notificationTime);
    const setNotificationTime = useAppStore((state) => state.setNotificationTime);

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        setSoundVolume(value);
    };

    const requestNotificationPermission = async (enable: boolean) => {
        if (!enable) {
            setNotificationsEnabled(false);
            return;
        }

        if (!('Notification' in window)) {
            alert('お使いのブラウザは通知に対応していません。');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
        } else {
            alert('通知が許可されていません。ブラウザの設定をご確認ください。');
            setNotificationsEnabled(false);
        }
    };

    const toggleTts = () => {
        const next = !ttsEnabled;
        setTtsEnabled(next);
        if (next) {
            audio.initTTS();
            audio.speak('音声ガイダンスをオンにしました');
            return;
        }

        audio.stopSpeech();
    };

    return (
        <>
            <VolumeCard
                volume={soundVolume}
                ttsEnabled={ttsEnabled}
                onChange={handleVolumeChange}
                onPreviewSound={() => audio.playTransition()}
                onPreviewTts={() => {
                    audio.initTTS();
                    audio.speak('つぎは、かいきゃくストレッチです');
                }}
            />

            {ttsEnabled && (
                <VoiceSettingsCard
                    rate={ttsRate}
                    pitch={ttsPitch}
                    onRateChange={setTtsRate}
                    onPitchChange={setTtsPitch}
                />
            )}

            <AudioTogglesCard
                ttsEnabled={ttsEnabled}
                onToggleTts={toggleTts}
            />

            <HapticCard
                enabled={hapticEnabled}
                onToggle={() => setHapticEnabled(!hapticEnabled)}
            />

            <NotificationCard
                enabled={notificationsEnabled}
                time={notificationTime}
                onToggle={() => requestNotificationPermission(!notificationsEnabled)}
                onTimeChange={setNotificationTime}
            />
        </>
    );
};
