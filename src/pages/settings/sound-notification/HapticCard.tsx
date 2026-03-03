import React from 'react';
import { Smartphone } from 'lucide-react';
import { ToggleButton } from '../ToggleButton';
import { SettingRow } from './SettingRow';

interface HapticCardProps {
    enabled: boolean;
    onToggle: () => void;
}

export const HapticCard: React.FC<HapticCardProps> = ({ enabled, onToggle }) => {
    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <SettingRow
                icon={<Smartphone size={16} color="#E17055" />}
                iconBackground="rgba(253, 203, 110, 0.15)"
                title="振動フィードバック"
                description="対応デバイスのみ"
                rightContent={<ToggleButton enabled={enabled} onToggle={onToggle} color="#FDCB6E" />}
            />
        </div>
    );
};
