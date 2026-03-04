import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';

interface ProgressChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    exerciseName: string;
    daysLeft: number;
    ratio: number;
    progress: number;
    allCompleted: boolean;
}

export const ProgressChallengeCard: React.FC<ProgressChallengeCardProps> = ({
    challenge,
    emoji,
    exerciseName,
    daysLeft,
    ratio,
    progress,
    allCompleted,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: allCompleted
                    ? 'linear-gradient(135deg, #FFF9E6, #FFF3CC)'
                    : 'var(--glass-bg-heavy)',
                borderRadius: 'var(--card-radius-sm)',
                padding: '14px 16px',
                boxShadow: 'var(--shadow-sm)',
                border: allCompleted
                    ? '1px solid #FFD700'
                    : '1px solid rgba(0,0,0,0.05)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#333',
                    }}>
                        {challenge.title}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#888',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}>
                        {exerciseName}を{challenge.targetCount}回
                        <span style={{ color: '#B2BEC3' }}>|</span>
                        <span style={{
                            color: daysLeft <= 3 ? '#E17055' : '#8395A7',
                            fontWeight: daysLeft <= 3 ? 700 : 400,
                        }}>
                            あと{daysLeft}日
                        </span>
                    </div>
                </div>
                {allCompleted && (
                    <Trophy size={18} color="#FFD700" />
                )}
            </div>

            <div style={{
                background: '#F0F0F0',
                borderRadius: 6,
                height: 8,
                overflow: 'hidden',
            }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${ratio * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        height: '100%',
                        borderRadius: 6,
                        background: allCompleted
                            ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                            : 'linear-gradient(90deg, #2BBAA0, #0984E3)',
                    }}
                />
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 4,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: allCompleted ? '#B8860B' : '#888',
                fontWeight: allCompleted ? 700 : 400,
            }}>
                {allCompleted ? 'クリア！🎉' : `${progress} / ${challenge.targetCount}`}
            </div>
        </motion.div>
    );
};
