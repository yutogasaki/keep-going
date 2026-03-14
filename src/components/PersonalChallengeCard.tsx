import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import type { PersonalChallengeProgressItem } from '../pages/home/hooks/usePersonalChallenges';
import {
    getPersonalChallengeDeadlineLabel,
    getPersonalChallengeEmoji,
    getPersonalChallengeGoalLabel,
    getPersonalChallengeProgressLabel,
    getPersonalChallengeStatusLabel,
    getPersonalChallengeTargetName,
} from './personal-challenge/shared';

interface PersonalChallengeCardProps {
    item: PersonalChallengeProgressItem;
    teacherExercises?: TeacherExercise[];
    teacherMenus?: TeacherMenu[];
    onOpenDetail: () => void;
    variant?: 'active' | 'today_done' | 'past';
}

export const PersonalChallengeCard: React.FC<PersonalChallengeCardProps> = ({
    item,
    teacherExercises = [],
    teacherMenus = [],
    onOpenDetail,
    variant = 'active',
}) => {
    const { challenge, owner, progress, goalTarget } = item;
    const emoji = getPersonalChallengeEmoji(challenge, teacherExercises, teacherMenus);
    const targetName = getPersonalChallengeTargetName(challenge, teacherExercises, teacherMenus);
    const goalLabel = getPersonalChallengeGoalLabel(challenge, targetName);
    const progressLabel = getPersonalChallengeProgressLabel(challenge, progress);
    const deadlineLabel = getPersonalChallengeDeadlineLabel(challenge);
    const ratio = Math.min(progress / Math.max(1, goalTarget), 1);
    const completed = challenge.status === 'completed';
    const past = variant === 'past' || challenge.status !== 'active';
    const todayDone = variant === 'today_done';
    const cardBackground = completed
        ? 'linear-gradient(135deg, #FFF9E6, #FFF3CC)'
        : todayDone
            ? 'linear-gradient(135deg, #F5FBFF, #EEF7FF)'
            : 'var(--glass-bg-heavy)';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
            style={{
                background: cardBackground,
                borderRadius: 16,
                padding: '14px 16px',
                boxShadow: 'var(--shadow-sm)',
                border: completed
                    ? '1px solid #FFD700'
                    : todayDone
                        ? '1px solid rgba(9,132,227,0.14)'
                        : '1px solid rgba(0,0,0,0.05)',
                cursor: 'pointer',
                opacity: past && !completed ? 0.75 : 1,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                    }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            color: '#333',
                        }}>
                            {challenge.title}
                        </div>
                        <span style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#1E7F6D',
                            background: 'rgba(43,186,160,0.12)',
                            borderRadius: 999,
                            padding: '2px 7px',
                        }}>
                            じぶん
                        </span>
                        {owner ? (
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#52606D',
                                background: 'rgba(0,0,0,0.05)',
                                borderRadius: 999,
                                padding: '2px 7px',
                            }}>
                                {owner.name}
                            </span>
                        ) : null}
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
                        <span>{todayDone && challenge.status === 'active' ? 'きょうぶんできたよ' : deadlineLabel}</span>
                    </div>
                </div>
                {completed ? (
                    <Trophy size={18} color="#FFD700" />
                ) : null}
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
                        background: completed
                            ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                            : todayDone
                                ? 'linear-gradient(90deg, #74B9FF, #0984E3)'
                                : 'linear-gradient(90deg, #2BBAA0, #0984E3)',
                    }}
                />
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 6,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: completed ? '#B8860B' : '#888',
                fontWeight: completed ? 700 : 500,
            }}>
                <span>{progressLabel}</span>
                <span>{getPersonalChallengeStatusLabel(challenge.status)}</span>
            </div>
        </motion.div>
    );
};
