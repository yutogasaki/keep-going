import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Challenge, ChallengeCompletion } from '../lib/challenges';
import { countExerciseInPeriod, markChallengeComplete } from '../lib/challenges';
import { useAppStore } from '../store/useAppStore';
import { EXERCISES, CLASS_EMOJI } from '../data/exercises';

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
    const checkingRef = useRef(false);

    // Stabilize derived arrays with useMemo
    const activeUserIds = useMemo(
        () => sessionUserIds.length > 0 ? sessionUserIds : users.map(u => u.id),
        [sessionUserIds, users]
    );

    const completedUserIds = useMemo(
        () => new Set(
            completions
                .filter(c => c.challengeId === challenge.id)
                .map(c => c.memberId)
        ),
        [completions, challenge.id]
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
    }, [challenge.exerciseId, challenge.startDate, challenge.endDate, activeUserIds]);

    // Auto-check completion when progress reaches target
    useEffect(() => {
        if (progress >= challenge.targetCount && !allCompleted && !checkingRef.current) {
            checkingRef.current = true;
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
                checkingRef.current = false;
            })();
        }
    }, [progress, challenge, allCompleted, activeUserIds, completedUserIds, addChibifuwa, onCompleted]);

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
                    {challenge.classLevels.length > 0 && (
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 2 }}>
                            {challenge.classLevels.map(cl => (
                                <span key={cl} style={{
                                    fontSize: 9,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: 'rgba(108, 92, 231, 0.1)',
                                    color: '#6C5CE7',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontWeight: 600,
                                }}>
                                    {CLASS_EMOJI[cl] ?? ''}{cl}
                                </span>
                            ))}
                        </div>
                    )}
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
