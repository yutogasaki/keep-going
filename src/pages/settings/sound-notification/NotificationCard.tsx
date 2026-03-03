import React from 'react';
import { Bell, Clock } from 'lucide-react';
import { ToggleButton } from '../ToggleButton';
import { SettingRow } from './SettingRow';

interface NotificationCardProps {
    enabled: boolean;
    time: string;
    onToggle: () => void;
    onTimeChange: (time: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
    enabled,
    time,
    onToggle,
    onTimeChange,
}) => {
    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <SettingRow
                icon={<Bell size={16} color="#0984e3" />}
                iconBackground="rgba(9, 132, 227, 0.1)"
                title="まいにち通知"
                description="忘れないようにリマインド"
                borderBottom={enabled}
                rightContent={<ToggleButton enabled={enabled} onToggle={onToggle} color="#0984e3" />}
            />

            {enabled && (
                <div style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                            <Clock size={16} color="#B2BEC3" />
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>
                            お知らせ時間
                        </div>
                    </div>
                    <input
                        type="time"
                        value={time}
                        onChange={(event) => onTimeChange(event.target.value)}
                        style={{
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: 8,
                            padding: '6px 12px',
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#2D3436',
                            background: '#F8F9FA',
                            outline: 'none',
                        }}
                    />
                </div>
            )}
        </div>
    );
};
