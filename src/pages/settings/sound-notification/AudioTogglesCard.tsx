import React from 'react';
import { Mic, Music } from 'lucide-react';
import { ToggleButton } from '../ToggleButton';
import { SettingRow } from './SettingRow';

interface AudioTogglesCardProps {
    ttsEnabled: boolean;
    bgmEnabled: boolean;
    onToggleTts: () => void;
    onToggleBgm: () => void;
}

export const AudioTogglesCard: React.FC<AudioTogglesCardProps> = ({
    ttsEnabled,
    bgmEnabled,
    onToggleTts,
    onToggleBgm,
}) => {
    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <SettingRow
                icon={<Mic size={16} color="#E17055" />}
                iconBackground="rgba(225, 112, 85, 0.1)"
                title="音声ガイダンス"
                description="残り時間などを声でお知らせ"
                borderBottom
                rightContent={<ToggleButton enabled={ttsEnabled} onToggle={onToggleTts} color="#2BBAA0" />}
            />
            <SettingRow
                icon={<Music size={16} color="#6C5CE7" />}
                iconBackground="rgba(108, 92, 231, 0.1)"
                title="BGM"
                description="ストレッチ中のBGM"
                rightContent={<ToggleButton enabled={bgmEnabled} onToggle={onToggleBgm} color="#6C5CE7" />}
            />
        </div>
    );
};
