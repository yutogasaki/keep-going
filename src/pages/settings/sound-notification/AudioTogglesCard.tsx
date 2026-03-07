import React from 'react';
import { Mic, Music } from 'lucide-react';
import { ToggleButton } from '../ToggleButton';
import { SettingRow } from './SettingRow';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

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
                borderBottom
                rightContent={<ToggleButton enabled={ttsEnabled} onToggle={onToggleTts} color={COLOR.primary} />}
            />
            <SettingRow
                icon={<Music size={16} color={COLOR.purple} />}
                iconBackground="rgba(108, 92, 231, 0.1)"
                title="BGM"
                description="ストレッチ中の BGM は これから対応します"
                rightContent={
                    <div style={{
                        padding: `${SPACE.xs}px ${SPACE.sm}px`,
                        borderRadius: RADIUS.full,
                        background: COLOR.bgMuted,
                        color: COLOR.muted,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                        flexShrink: 0,
                    }}>
                        じゅんび中
                    </div>
                }
            />
        </div>
    );
};
