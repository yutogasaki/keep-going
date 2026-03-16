import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';
import { getChallengeCardText } from '../../lib/challenges';
import { getHomeBadgeStyle, getHomeCardStyle, homeCardMetaLineStyle, homeCardTitleStyle } from '../home/homeCardChrome';
import { CLASS_EMOJI } from '../../data/exercises';

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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
            style={{
                ...getHomeCardStyle('mint', {
                    padding: '16px 18px',
                }),
                cursor: 'pointer',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                        <span style={challengeBadgeStyle}>先生チャレンジ</span>
                    </div>
                    <div
                        style={{
                            ...homeCardTitleStyle,
                            fontSize: 14,
                            marginBottom: 4,
                        }}
                    >
                        {challenge.title}
                    </div>
                    <div
                        style={{
                            ...homeCardMetaLineStyle,
                            gap: 6,
                        }}
                    >
                        {cardText && <span style={{ color: '#52606D' }}>{cardText}</span>}
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
                                    {CLASS_EMOJI[classLevel] ?? ''}
                                    {classLevel}
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
                参加する
            </motion.button>
        </motion.div>
    );
};

const challengeBadgeStyle: React.CSSProperties = {
    ...getHomeBadgeStyle('mint', {
        fontWeight: 800,
        padding: '3px 8px',
    }),
};
