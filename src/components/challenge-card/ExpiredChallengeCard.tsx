import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';

interface ExpiredChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    targetLabel: string;
    dateLabel: string;
    wasCompleted: boolean;
    dailyCapLabel: string;
    onOpenDetail: () => void;
}

export const ExpiredChallengeCard: React.FC<ExpiredChallengeCardProps> = ({
    challenge,
    emoji,
    targetLabel,
    dateLabel,
    wasCompleted,
    dailyCapLabel,
    onOpenDetail,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
            style={{
                background: wasCompleted
                    ? 'linear-gradient(135deg, #FFF9E6, #FFF3CC)'
                    : 'rgba(245, 245, 245, 0.9)',
                borderRadius: 16,
                padding: '12px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                border: wasCompleted
                    ? '1px solid rgba(255, 215, 0, 0.3)'
                    : '1px solid rgba(0,0,0,0.05)',
                opacity: wasCompleted ? 1 : 0.6,
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: wasCompleted ? '#333' : '#999',
                    }}>
                        {challenge.title}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#aaa',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexWrap: 'wrap',
                    }}>
                        {targetLabel}を{challenge.targetCount}回
                        <span style={{ color: '#ccc' }}>|</span>
                        {dailyCapLabel}
                        <span style={{ color: '#ccc' }}>|</span>
                        <span>{dateLabel}</span>
                    </div>
                </div>
                {wasCompleted ? (
                    <Trophy size={18} color="#FFD700" />
                ) : (
                    <span style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 10,
                        color: '#B2BEC3',
                        fontWeight: 600,
                    }}>
                        みかんりょう
                    </span>
                )}
            </div>
        </motion.div>
    );
};
