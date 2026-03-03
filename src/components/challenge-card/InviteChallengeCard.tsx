import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Target } from 'lucide-react';
import type { Challenge } from '../../lib/challenges';
import { CLASS_EMOJI } from '../../data/exercises';

interface InviteChallengeCardProps {
    challenge: Challenge;
    emoji: string;
    exerciseName: string;
    dateLabel: string;
    onJoin: () => void;
}

export const InviteChallengeCard: React.FC<InviteChallengeCardProps> = ({
    challenge,
    emoji,
    exerciseName,
    dateLabel,
    onJoin,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F7FA 100%)',
                borderRadius: 16,
                padding: '16px 18px',
                boxShadow: '0 2px 12px rgba(43, 186, 160, 0.1)',
                border: '1px solid rgba(43, 186, 160, 0.15)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
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
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Target size={12} color="#2BBAA0" />
                            {exerciseName}を{challenge.targetCount}回
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Calendar size={12} color="#8395A7" />
                            {dateLabel}
                        </span>
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
                                    {CLASS_EMOJI[classLevel] ?? ''}{classLevel}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onJoin}
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
