import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge, ChallengeCompletion } from '../lib/challenges';
import { countExerciseInPeriod, markChallengeComplete } from '../lib/challenges';
import { useAppStore } from '../store/useAppStore';
import { EXERCISES } from '../data/exercises';

interface ChallengeCardProps {
    challenge: Challenge;
    completions: ChallengeCompletion[];
    onCompleted: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
    challenge,
    completions,
    onCompleted,
}) => {
    const sessionUserIds = useAppStore(state => state.sessionUserIds);
    const users = useAppStore(state => state.users);
    const addChibifuwa = useAppStore(state => state.addChibifuwa);

    const [progress, setProgress] = useState(0);
    const [checking, setChecking] = useState(false);

    // Which user IDs to check progress for (based on current session context)
    const activeUserIds = sessionUserIds.length > 0 ? sessionUserIds : users.map(u => u.id);

    // Check if already completed by any active user
    const completedUserIds = new Set(
        completions
            .filter(c => c.challengeId === challenge.id)
            .map(c => c.memberId)
    );
    const allCompleted = activeUserIds.every(uid => completedUserIds.has(uid));

    useEffect(() => {
        let cancelled = false;
        countExerciseInPeriod(
            challenge.exerciseId,
            challenge.startDate,
            challenge.endDate,
            activeUserIds,
        ).then(count => {
            if (!cancelled) setProgress(count);
        });
        return () => { cancelled = true; };
    }, [challenge.exerciseId, challenge.startDate, challenge.endDate, activeUserIds.join(',')]);

    // Auto-check completion when progress reaches target
    useEffect(() => {
        if (progress >= challenge.targetCount && !allCompleted && !checking) {
            setChecking(true);
            (async () => {
                for (const userId of activeUserIds) {
                    if (!completedUserIds.has(userId)) {
                        await markChallengeComplete(challenge.id, userId).catch(console.warn);
                        addChibifuwa(userId, {
                            type: challenge.rewardFuwafuwaType,
                            challengeTitle: challenge.title,
                            earnedDate: new Date().toISOString().split('T')[0],
                        });
                    }
                }
                onCompleted();
                setChecking(false);
            })();
        }
    }, [progress, challenge.targetCount, allCompleted]);

    const exercise = EXERCISES.find(e => e.id === challenge.exerciseId);
    const emoji = exercise?.emoji || '🎯';
    const exerciseName = exercise?.name || challenge.exerciseId;
    const ratio = Math.min(progress / challenge.targetCount, 1);

    // Date range display
    const startMonth = parseInt(challenge.startDate.split('-')[1], 10);
    const endMonth = parseInt(challenge.endDate.split('-')[1], 10);
    const dateLabel = startMonth === endMonth
        ? `${startMonth}月`
        : `${startMonth}〜${endMonth}月`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                background: allCompleted
                    ? 'linear-gradient(135deg, #FFF9E6, #FFF3CC)'
                    : 'rgba(255, 255, 255, 0.95)',
                borderRadius: 16,
                padding: '14px 16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                border: allCompleted
                    ? '1px solid #FFD700'
                    : '1px solid rgba(0,0,0,0.05)',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <div style={{ flex: 1 }}>
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
                    }}>
                        {dateLabel} ・ {exerciseName}を{challenge.targetCount}回
                    </div>
                </div>
                {allCompleted && (
                    <Trophy size={18} color="#FFD700" />
                )}
            </div>

            {/* Progress bar */}
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
                justifyContent: 'flex-end',
                marginTop: 4,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: allCompleted ? '#B8860B' : '#888',
                fontWeight: allCompleted ? 700 : 400,
            }}>
                {allCompleted ? 'クリア！🎉' : `${progress} / ${challenge.targetCount}`}
            </div>
        </motion.div>
    );
};
