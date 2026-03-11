import React from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { FuwafuwaSpeechAccent } from './fuwafuwaHomeCardCopy';

interface FuwafuwaSpeechBubbleProps {
    lines: string[];
    accent: FuwafuwaSpeechAccent;
    actionLabel?: string;
    onAction?: () => void;
    onTap?: () => void;
}

export const FuwafuwaSpeechBubble: React.FC<FuwafuwaSpeechBubbleProps> = ({
    lines,
    accent,
    actionLabel,
    onAction,
    onTap,
}) => {
    const accentColor = accent === 'info' ? COLOR.info : COLOR.primary;
    const accentBackground = accent === 'info' ? 'rgba(9, 132, 227, 0.08)' : 'rgba(43, 186, 160, 0.08)';
    const accentBorder = accent === 'info' ? 'rgba(9, 132, 227, 0.15)' : 'rgba(43, 186, 160, 0.16)';
    const visibleLines = lines.filter((line) => line.trim().length > 0);

    return (
        <div
            onClick={onTap}
            style={{
                position: 'relative',
                maxWidth: 320,
                padding: '12px 16px',
                borderRadius: 20,
                background: accentBackground,
                border: `1px solid ${accentBorder}`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                textAlign: 'center',
                cursor: onTap ? 'pointer' : 'default',
            }}
        >
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    lineHeight: 1.6,
                    color: accentColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {visibleLines.map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                ))}
            </div>
            {actionLabel && onAction ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onAction();
                    }}
                    style={{
                        marginTop: SPACE.sm,
                        border: 'none',
                        background: 'rgba(255,255,255,0.68)',
                        color: accentColor,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: RADIUS.full,
                        cursor: 'pointer',
                    }}
                >
                    {actionLabel}
                </button>
            ) : null}
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
