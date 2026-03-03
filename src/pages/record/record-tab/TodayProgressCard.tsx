import React from 'react';
import { motion } from 'framer-motion';

interface TodayProgressCardProps {
    progressPercent: number;
    ringRadius: number;
    ringCircumference: number;
    ringOffset: number;
    sessionCount: number;
    exerciseCount: number;
    minutes: number;
}

export const TodayProgressCard: React.FC<TodayProgressCardProps> = ({
    progressPercent,
    ringRadius,
    ringCircumference,
    ringOffset,
    sessionCount,
    exerciseCount,
    minutes,
}) => {
    return (
        <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 24px',
            }}
        >
            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                <svg width="64" height="64" viewBox="0 0 64 64" className="progress-ring">
                    <circle cx="32" cy="32" r={ringRadius} fill="none" stroke="#E8F8F0" strokeWidth="6" />
                    <circle
                        cx="32"
                        cy="32"
                        r={ringRadius}
                        fill="none"
                        stroke="#2BBAA0"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={ringCircumference}
                        strokeDashoffset={ringOffset}
                        className="progress-ring__circle"
                        style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2BBAA0',
                }}>
                    {progressPercent}%
                </div>
            </div>

            <div>
                <h3 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#2D3436',
                    marginBottom: 4,
                }}>
                    今日のストレッチ
                </h3>
                <p style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#8395A7',
                }}>
                    {sessionCount === 0
                        ? 'まだ始めていません'
                        : `${exerciseCount} 種目 · ${minutes} 分`
                    }
                </p>
            </div>
        </motion.div>
    );
};
