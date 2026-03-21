import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';
import { getChallengeCardText } from '../../lib/challenges';
import { CLASS_EMOJI } from '../../data/exercises';
import { getTodayKey } from '../../lib/db';

interface InviteChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    goalLabel: string;
    periodLabel: string;
    dailyRuleLabel: string;
    onJoin: () => void;
    onOpenDetail: () => void;
}

export const InviteChallengeCard: React.FC<InviteChallengeCardProps> = ({
    challenge,
    emoji,
    goalLabel,
    periodLabel,
    dailyRuleLabel,
    onJoin,
    onOpenDetail,
}) => {
    const cardText = getChallengeCardText(challenge);
    const isUpcoming = challenge.startDate > getTodayKey();
    const upcomingLabel = formatUpcomingStartLabel(challenge.startDate);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
            style={{
                background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F7FA 100%)',
                borderRadius: 16,
                padding: '16px 18px',
                boxShadow: '0 2px 12px rgba(43, 186, 160, 0.1)',
                border: '1px solid rgba(43, 186, 160, 0.15)',
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                        {isUpcoming ? <span style={upcomingBadgeStyle}>予告中</span> : null}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 4,
                    }}>
                        {challenge.title}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#636E72',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                    }}>
                        {cardText && (
                            <span style={{ color: '#52606D' }}>{cardText}</span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Target size={12} color="#2BBAA0" />
                            {goalLabel}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={12} color="#8395A7" />
                            {periodLabel}
                        </span>
                        <span style={{ color: '#6B7280' }}>{dailyRuleLabel}</span>
                    </div>
                    {isUpcoming ? (
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#7C3AED',
                            fontWeight: 700,
                            marginTop: 5,
                        }}>
                            {upcomingLabel}から はじまるよ
                        </div>
                    ) : null}
                    {challenge.classLevels.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
                            {challenge.classLevels.map((classLevel) => (
                                <span
                                    key={classLevel}
                                    style={{
                                        fontSize: 9,
                                        padding: '1px 5px',
                                        borderRadius: 4,
                                        background: 'rgba(108, 92, 231, 0.1)',
                                        color: '#6C5CE7',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontWeight: 600,
                                    }}
                                >
                                    {CLASS_EMOJI[classLevel] ?? ''}{classLevel}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(event) => {
                    event.stopPropagation();
                    onJoin();
                }}
                style={{
                    marginTop: 12,
                    width: '100%',
                    padding: '10px 0',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2BBAA0, #0984E3)',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(43, 186, 160, 0.3)',
                    letterSpacing: 1,
                }}
            >
                {isUpcoming ? 'はじまる前に参加する' : '参加する'}
            </motion.button>
        </motion.div>
    );
};

function formatUpcomingStartLabel(startDate: string): string {
    const [, month, day] = startDate.split('-');
    if (!month || !day) {
        return startDate;
    }

    return `${Number(month)}/${Number(day)}`;
}

const challengeBadgeStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 10,
    fontWeight: 800,
    color: '#1E7F6D',
    background: 'rgba(43, 186, 160, 0.14)',
    borderRadius: 999,
    padding: '3px 8px',
};

const upcomingBadgeStyle: React.CSSProperties = {
    ...challengeBadgeStyle,
    color: '#7C3AED',
    background: 'rgba(124, 58, 237, 0.12)',
};
