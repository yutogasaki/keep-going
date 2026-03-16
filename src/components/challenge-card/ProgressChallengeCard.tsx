import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';

interface ProgressChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    goalLabel: string;
    deadlineLabel: string;
    ratio: number;
    progressLabel: string;
    allCompleted: boolean;
    dailyRuleLabel: string;
    onOpenDetail: () => void;
}

export const ProgressChallengeCard: React.FC<ProgressChallengeCardProps> = ({
    challenge,
    emoji,
    goalLabel,
    deadlineLabel,
    ratio,
    progressLabel,
    allCompleted,
    dailyRuleLabel,
    onOpenDetail,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
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
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                    </div>
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
                        flexWrap: 'wrap',
                    }}>
                        {goalLabel}
                        <span style={{ color: '#B2BEC3' }}>|</span>
                        <span>{dailyRuleLabel}</span>
                        <span style={{ color: '#B2BEC3' }}>|</span>
                        <span style={{
                            color: deadlineLabel.startsWith('あと') ? '#8395A7' : '#52606D',
                            fontWeight: deadlineLabel.startsWith('あと') ? 700 : 500,
                        }}>
                            {deadlineLabel}
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
                {allCompleted ? 'クリア！🎉' : progressLabel}
            </div>
        </motion.div>
    );
};

const challengeBadgeStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    color: '#1E7F6D',
    background: 'rgba(43, 186, 160, 0.12)',
    borderRadius: 999,
    padding: '3px 8px',
};
