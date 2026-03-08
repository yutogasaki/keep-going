import React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';

interface CustomMenuDailyTargetCardProps {
    dailyTargetMinutes: number;
    disabled?: boolean;
    onSetDailyTargetMinutes: (mins: number) => void;
}

const TARGET_MINUTES = [5, 10, 15, 20, 30];

export const CustomMenuDailyTargetCard: React.FC<CustomMenuDailyTargetCardProps> = ({
    dailyTargetMinutes,
    disabled = false,
    onSetDailyTargetMinutes,
}) => (
    <div
        className="card"
        style={{
            marginBottom: 24,
            padding: '24px 20px',
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
        }}
    >
        <div
            style={{
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.lg - 1,
                fontWeight: 700,
                color: COLOR.dark,
                marginBottom: 16,
            }}
        >
            1日の目標じかん
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {TARGET_MINUTES.map((mins) => {
                const isActive = dailyTargetMinutes === mins;

                return (
                    <button
                        key={mins}
                        type="button"
                        onClick={() => onSetDailyTargetMinutes(mins)}
                        style={{
                            flex: 1,
                            minWidth: '28%',
                            padding: '14px 0',
                            borderRadius: RADIUS.lg,
                            border: isActive ? `2px solid ${COLOR.primary}` : '2px solid transparent',
                            background: isActive ? 'rgba(43, 186, 160, 0.08)' : COLOR.bgLight,
                            color: isActive ? COLOR.primary : COLOR.muted,
                            fontFamily: FONT.heading,
                            fontSize: FONT_SIZE.lg,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isActive ? 'none' : '0 2px 4px rgba(0,0,0,0.02)',
                        }}
                    >
                        {mins}分
                    </button>
                );
            })}
        </div>
    </div>
);
