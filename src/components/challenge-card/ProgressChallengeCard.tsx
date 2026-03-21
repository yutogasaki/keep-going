import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';
import { getChallengeRewardLabel } from '../../lib/challenges';
import { getChallengeProgressCallout } from './challengeCardUtils';

interface ProgressChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    goalLabel: string;
    deadlineLabel: string;
    progress: number;
    goalTarget: number;
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
    progress,
    goalTarget,
    ratio,
    progressLabel,
    allCompleted,
    dailyRuleLabel,
    onOpenDetail,
}) => {
    const progressChipLabel = allCompleted ? 'クリア！' : `進捗 ${progressLabel}`;
    const progressCallout = getChallengeProgressCallout({
        progress,
        goalTarget,
        goalType: challenge.goalType,
        allCompleted,
    });
    const rewardLabel = challenge.rewardKind === 'star'
        ? `⭐ ${getChallengeRewardLabel(challenge)}`
        : '🏅 メダル';

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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4, alignItems: 'center' }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                        <span style={allCompleted ? progressChipCompletedStyle : progressChipStyle}>{progressChipLabel}</span>
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
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 8,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: allCompleted ? '#8C6A00' : '#2F6F63',
            }}>
                <span style={{ fontWeight: 700 }}>
                    {progressCallout}
                </span>
                {allCompleted ? (
                    <span style={rewardBadgeStyle}>
                        {rewardLabel}
                    </span>
                ) : null}
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

const progressChipStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    color: '#0F766E',
    background: 'rgba(45, 212, 191, 0.16)',
    borderRadius: 999,
    padding: '3px 8px',
};

const progressChipCompletedStyle: React.CSSProperties = {
    ...progressChipStyle,
    color: '#9A6700',
    background: 'rgba(250, 204, 21, 0.18)',
};

const rewardBadgeStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    color: '#9A6700',
    background: 'rgba(255, 236, 179, 0.72)',
    borderRadius: 999,
    padding: '4px 8px',
};
