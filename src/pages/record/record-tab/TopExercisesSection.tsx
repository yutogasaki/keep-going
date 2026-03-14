import React from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';
import type { RecordTopExerciseChip } from '../recordOverviewSummary';

interface TopExercisesSectionProps {
    topExercises: RecordTopExerciseChip[];
    canCreatePersonalChallenge?: boolean;
    onCreatePersonalChallenge?: (exercise: RecordTopExerciseChip) => void;
}

export const TopExercisesSection: React.FC<TopExercisesSectionProps> = ({
    topExercises,
    canCreatePersonalChallenge = false,
    onCreatePersonalChallenge,
}) => {
    if (topExercises.length === 0) {
        return null;
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.16, ease: 'easeOut' }}
        >
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 800,
                    color: COLOR.dark,
                    marginBottom: 10,
                }}
            >
                よく会う種目
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                }}
            >
                {topExercises.map((exercise, index) => (
                    <motion.div
                        key={exercise.id}
                        className="card card-sm"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.18 + index * 0.06 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 6,
                            padding: '14px 10px',
                            textAlign: 'center',
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.92))',
                        }}
                    >
                        <div
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: RADIUS['2xl'],
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'rgba(43, 186, 160, 0.1)',
                                fontSize: 22,
                            }}
                        >
                            {exercise.emoji}
                        </div>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 800,
                                color: COLOR.dark,
                                lineHeight: 1.35,
                                wordBreak: 'keep-all',
                            }}
                        >
                            {exercise.name}
                        </div>
                        <div
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '4px 8px',
                                borderRadius: RADIUS.full,
                                background: 'rgba(43, 186, 160, 0.12)',
                                color: COLOR.primaryDark,
                                fontFamily: FONT.heading,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 700,
                            }}
                        >
                            {exercise.count}回
                        </div>
                        {canCreatePersonalChallenge && onCreatePersonalChallenge ? (
                            <button
                                type="button"
                                onClick={() => onCreatePersonalChallenge(exercise)}
                                style={{
                                    border: '1px solid rgba(43, 186, 160, 0.16)',
                                    borderRadius: RADIUS.full,
                                    padding: '6px 10px',
                                    background: 'linear-gradient(135deg, #F8FFFD, #F0FBF7)',
                                    color: COLOR.primaryDark,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                じぶんチャレンジ
                            </button>
                        ) : null}
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};
