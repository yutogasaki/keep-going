import React from 'react';
import { COLOR, FONT, FONT_SIZE } from '../../lib/styles';

interface FuwafuwaSpeechBubbleProps {
    message: string;
    accent: 'primary' | 'info';
}

export const FuwafuwaSpeechBubble: React.FC<FuwafuwaSpeechBubbleProps> = ({ message, accent }) => {
    const accentColor = accent === 'info' ? COLOR.info : COLOR.primary;
    const accentBackground = accent === 'info' ? 'rgba(9, 132, 227, 0.08)' : 'rgba(43, 186, 160, 0.08)';
    const accentBorder = accent === 'info' ? 'rgba(9, 132, 227, 0.15)' : 'rgba(43, 186, 160, 0.16)';

    return (
        <div
            style={{
                position: 'relative',
                maxWidth: 300,
                padding: '12px 16px',
                borderRadius: 20,
                background: accentBackground,
                border: `1px solid ${accentBorder}`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    lineHeight: 1.6,
                    color: accentColor,
                }}
            >
                {message}
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -7,
                    width: 14,
                    height: 14,
                    background: accentBackground,
                    borderRight: `1px solid ${accentBorder}`,
                    borderBottom: `1px solid ${accentBorder}`,
                    transform: 'translateX(-50%) rotate(45deg)',
                }}
            />
        </div>
    );
};
