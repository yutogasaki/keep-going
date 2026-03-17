import React from 'react';
import { Mic } from 'lucide-react';
import { ToggleButton } from '../ToggleButton';
import { SettingRow } from './SettingRow';
import { COLOR } from '../../../lib/styles';

interface AudioTogglesCardProps {
    ttsEnabled: boolean;
    onToggleTts: () => void;
}

export const AudioTogglesCard: React.FC<AudioTogglesCardProps> = ({
    ttsEnabled,
    onToggleTts,
}) => {
    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <SettingRow
                icon={<Mic size={16} color={COLOR.danger} />}
                iconBackground="rgba(225, 112, 85, 0.1)"
                title="音声ガイダンス"
                description="種目名や のこり時間を こえで おしらせ"
                rightContent={<ToggleButton enabled={ttsEnabled} onToggle={onToggleTts} color={COLOR.primary} />}
            />
        </div>
    );
};
