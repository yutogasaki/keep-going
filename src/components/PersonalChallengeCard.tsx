import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getHomeBadgeStyle, getHomeCardStyle, homeCardMetaLineStyle, homeCardTitleStyle } from './home/homeCardChrome';
import type { MenuGroup } from '../data/menuGroups';
import type { CustomExercise } from '../lib/db';
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
    customExercises?: CustomExercise[];
    customMenus?: MenuGroup[];
    onOpenDetail: () => void;
    variant?: 'active' | 'today_done' | 'past';
}

export const PersonalChallengeCard: React.FC<PersonalChallengeCardProps> = ({
    item,
    teacherExercises = [],
    teacherMenus = [],
    customExercises = [],
    customMenus = [],
    onOpenDetail,
    variant = 'active',
}) => {
    const { challenge, owner, progress, goalTarget } = item;
    const emoji = getPersonalChallengeEmoji(challenge, teacherExercises, teacherMenus, customExercises, customMenus);
    const targetName = getPersonalChallengeTargetName(
        challenge,
        teacherExercises,
        teacherMenus,
        customExercises,
        customMenus,
    );
    const goalLabel = getPersonalChallengeGoalLabel(challenge, targetName);
    const progressLabel = getPersonalChallengeProgressLabel(challenge, progress);
    const deadlineLabel = getPersonalChallengeDeadlineLabel(challenge);
    const ratio = Math.min(progress / Math.max(1, goalTarget), 1);
    const completed = challenge.status === 'completed';
    const past = variant === 'past' || challenge.status !== 'active';
    const todayDone = variant === 'today_done';
    const cardTone = completed ? 'gold' : todayDone ? 'sky' : 'neutral';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onOpenDetail}
            style={{
                ...getHomeCardStyle(cardTone, {
                    padding: '14px 16px',
                }),
                cursor: 'pointer',
                opacity: past && !completed ? 0.75 : 1,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}
                    >
                        <div
                            style={{
                                ...homeCardTitleStyle,
                                fontSize: 13,
                            }}
                        >
                            {challenge.title}
                        </div>
                        <span style={getHomeBadgeStyle('mint', { padding: '2px 7px' })}>じぶんチャレンジ</span>
                        {owner ? (
                            <span style={getHomeBadgeStyle('slate', { padding: '2px 7px' })}>{owner.name}</span>
                        ) : null}
                    </div>
                    <div style={homeCardMetaLineStyle}>
                        {goalLabel}
                        <span style={{ color: '#B2BEC3' }}>|</span>
                        <span>{todayDone && challenge.status === 'active' ? 'きょうぶんできたよ' : deadlineLabel}</span>
                    </div>
                </div>
                {completed ? <Trophy size={18} color="#FFD700" /> : null}
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
                        background: completed
                            ? 'linear-gradient(90deg, #FFD700, #FFA500)'
                            : todayDone
                              ? 'linear-gradient(90deg, #74B9FF, #0984E3)'
                              : 'linear-gradient(90deg, #2BBAA0, #0984E3)',
                    }}
                />
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 6,
                    ...homeCardMetaLineStyle,
                    color: completed ? '#B8860B' : '#888',
                    fontWeight: completed ? 700 : 500,
                }}
            >
                <span>{progressLabel}</span>
                <span>{getPersonalChallengeStatusLabel(challenge.status)}</span>
            </div>
        </motion.div>
    );
};
