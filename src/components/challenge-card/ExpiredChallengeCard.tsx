import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';

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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                    </div>
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
                        {goalLabel}
                        <span style={{ color: '#ccc' }}>|</span>
                        {dailyRuleLabel}
                        <span style={{ color: '#ccc' }}>|</span>
                        <span>{periodLabel}</span>
                    </div>
                    {canRetry && (
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 10,
                            color: '#6B7280',
                            marginTop: 4,
                        }}>
                            いつでもチャレンジだから、またやりたくなったら新しい期間ではじめられるよ
                        </div>
                    )}
                </div>
                {wasCompleted ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trophy size={18} color="#FFD700" />
                        {canRetry ? (
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 10,
                                color: '#B8860B',
                                fontWeight: 700,
                            }}>
                                またできる
                            </span>
                        ) : null}
                    </div>
                ) : (
                    <span style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 10,
                        color: canRetry ? '#7F8C8D' : '#B2BEC3',
                        fontWeight: 600,
                    }}>
                        {canRetry ? 'またできる' : 'みかんりょう'}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

const challengeBadgeStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    color: '#5F6B77',
    background: 'rgba(148, 163, 184, 0.16)',
    borderRadius: 999,
    padding: '3px 8px',
};
