import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';
import { getHomeBadgeStyle, getHomeCardStyle, homeCardMetaLineStyle, homeCardTitleStyle } from '../home/homeCardChrome';

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
                ...getHomeCardStyle(allCompleted ? 'gold' : 'neutral', {
                    padding: '14px 16px',
                }),
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                    </div>
                    <div
                        style={{
                            ...homeCardTitleStyle,
                            fontSize: 13,
                        }}
                    >
                        {challenge.title}
                    </div>
                    <div style={homeCardMetaLineStyle}>
                        {goalLabel}
                        <span style={{ color: '#B2BEC3' }}>|</span>
                        <span>{dailyRuleLabel}</span>
                        <span style={{ color: '#B2BEC3' }}>|</span>
                        <span
                            style={{
                                color: deadlineLabel.startsWith('あと') ? '#8395A7' : '#52606D',
                                fontWeight: deadlineLabel.startsWith('あと') ? 700 : 500,
                            }}
                        >
                            {deadlineLabel}
                        </span>
                    </div>
                </div>
                {allCompleted && <Trophy size={18} color="#FFD700" />}
            </div>

            <div
                style={{
                    background: '#F0F0F0',
                    borderRadius: 6,
                    height: 8,
                    overflow: 'hidden',
                }}
            >
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

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 4,
                    ...homeCardMetaLineStyle,
                    color: allCompleted ? '#B8860B' : '#888',
                    fontWeight: allCompleted ? 700 : 400,
                }}
            >
                {allCompleted ? 'クリア！🎉' : progressLabel}
            </div>
        </motion.div>
    );
};

const challengeBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('mint', {
        fontWeight: 800,
        padding: '3px 8px',
    }),
};
