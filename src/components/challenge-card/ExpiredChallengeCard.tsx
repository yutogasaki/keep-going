import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';
import { getHomeBadgeStyle, getHomeCardStyle, homeCardMetaLineStyle, homeCardTitleStyle } from '../home/homeCardChrome';

interface ExpiredChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    goalLabel: string;
    periodLabel: string;
    wasCompleted: boolean;
    canRetry: boolean;
    dailyRuleLabel: string;
    onOpenDetail: () => void;
}

export const ExpiredChallengeCard: React.FC<ExpiredChallengeCardProps> = ({
    challenge,
    emoji,
    goalLabel,
    periodLabel,
    wasCompleted,
    canRetry,
    dailyRuleLabel,
    onOpenDetail,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
            style={{
                ...getHomeCardStyle(wasCompleted ? 'gold' : 'muted', {
                    padding: '12px 16px',
                }),
                opacity: wasCompleted ? 1 : 0.6,
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                    </div>
                    <div
                        style={{
                            ...homeCardTitleStyle,
                            fontSize: 13,
                            color: wasCompleted ? '#333' : '#999',
                        }}
                    >
                        {challenge.title}
                    </div>
                    <div
                        style={{
                            ...homeCardMetaLineStyle,
                            color: '#aaa',
                        }}
                    >
                        {goalLabel}
                        <span style={{ color: '#ccc' }}>|</span>
                        {dailyRuleLabel}
                        <span style={{ color: '#ccc' }}>|</span>
                        <span>{periodLabel}</span>
                    </div>
                    {canRetry && (
                        <div
                            style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 10,
                                color: '#6B7280',
                                marginTop: 4,
                            }}
                        >
                            いつでもチャレンジだから、またやりたくなったら新しい期間ではじめられるよ
                        </div>
                    )}
                </div>
                {wasCompleted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trophy size={18} color="#FFD700" />
                        {canRetry ? (
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    color: '#B8860B',
                                    fontWeight: 700,
                                }}
                            >
                                またできる
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <span
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 10,
                            color: canRetry ? '#7F8C8D' : '#B2BEC3',
                            fontWeight: 600,
                        }}
                    >
                        {canRetry ? 'またできる' : 'みかんりょう'}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const challengeBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('slate', {
        fontWeight: 800,
        color: '#5F6B77',
        background: 'rgba(148, 163, 184, 0.16)',
        padding: '3px 8px',
    }),
};
