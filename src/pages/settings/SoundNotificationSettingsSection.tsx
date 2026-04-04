import React from 'react';
import { BGM_TRACKS } from '../../lib/bgmTracks';
import { useAppStore } from '../../store/useAppStore';
import { audio } from '../../lib/audio';
import { VolumeCard } from './sound-notification/VolumeCard';
import { BgmCard } from './sound-notification/BgmCard';
import { AudioTogglesCard } from './sound-notification/AudioTogglesCard';
import { HapticCard } from './sound-notification/HapticCard';

export const SoundNotificationSettingsSection: React.FC = () => {
    const [isBgmPreviewing, setIsBgmPreviewing] = React.useState(audio.isBgmPreviewing());
    const soundVolume = useAppStore((state) => state.soundVolume);
    const setSoundVolume = useAppStore((state) => state.setSoundVolume);
    const ttsEnabled = useAppStore((state) => state.ttsEnabled);
    const setTtsEnabled = useAppStore((state) => state.setTtsEnabled);
    const bgmEnabled = useAppStore((state) => state.bgmEnabled);
    const setBgmEnabled = useAppStore((state) => state.setBgmEnabled);
    const bgmVolume = useAppStore((state) => state.bgmVolume);
    const setBgmVolume = useAppStore((state) => state.setBgmVolume);
    const bgmTrackId = useAppStore((state) => state.bgmTrackId);
    const setBgmTrackId = useAppStore((state) => state.setBgmTrackId);
    const hapticEnabled = useAppStore((state) => state.hapticEnabled);
    const setHapticEnabled = useAppStore((state) => state.setHapticEnabled);

    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        setSoundVolume(value);
    };

    const handleBgmVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseFloat(event.target.value);
        setBgmVolume(value);
        if (value === 0 && audio.isBgmPreviewing()) {
            audio.stopBgmPreview();
            setIsBgmPreviewing(false);
            return;
        }

        if (audio.isBgmPreviewing()) {
            audio.refreshBgm();
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

    const handleBgmTrackChange = (trackId: string) => {
        setBgmTrackId(trackId);
        if (audio.isBgmPreviewing()) {
            setIsBgmPreviewing(audio.startBgmPreview());
        }
    };

    const handleBgmPreviewToggle = () => {
        setIsBgmPreviewing(audio.toggleBgmPreview());
    };

    React.useEffect(() => () => {
        audio.stopBgmPreview();
    }, []);

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

            <BgmCard
                enabled={bgmEnabled}
                volume={bgmVolume}
                selectedTrackId={bgmTrackId}
                tracks={BGM_TRACKS}
                isPreviewing={isBgmPreviewing}
                onToggle={() => setBgmEnabled(!bgmEnabled)}
                onTrackChange={handleBgmTrackChange}
                onVolumeChange={handleBgmVolumeChange}
                onPreviewToggle={handleBgmPreviewToggle}
            />

            <AudioTogglesCard
                ttsEnabled={ttsEnabled}
                onToggleTts={toggleTts}
            />

            <HapticCard
                enabled={hapticEnabled}
                onToggle={() => setHapticEnabled(!hapticEnabled)}
            />
        </>
    );
};
