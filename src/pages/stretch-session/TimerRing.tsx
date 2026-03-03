import React from 'react';

interface TimerRingProps {
    radius: number;
    circumference: number;
    dashOffset: number;
    timeLeft: number;
    hasLRSplit: boolean;
    isPointFlex: boolean;
    phaseTimeLeft: number;
}

export const TimerRing: React.FC<TimerRingProps> = ({
    radius,
    circumference,
    dashOffset,
    timeLeft,
    hasLRSplit,
    isPointFlex,
    phaseTimeLeft,
}) => (
    <div style={{ position: 'relative', zIndex: 20 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" className="progress-ring">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
            <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="#2BBAA0"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="progress-ring__circle"
            />
        </svg>
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 48,
                fontWeight: 700,
                color: '#2D4741',
                lineHeight: 1,
            }}>
                {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            {(hasLRSplit || isPointFlex) && (
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginTop: 8,
                }}>
                    切替まで {phaseTimeLeft}秒
                </span>
            )}
        </div>
    </div>
);
