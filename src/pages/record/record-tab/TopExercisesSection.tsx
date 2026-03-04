import React from 'react';
import { motion } from 'framer-motion';
import { EXERCISES } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import type { TopExercise } from './types';

interface TopExercisesSectionProps {
    loading: boolean;
    topExercises: TopExercise[];
}

export const TopExercisesSection: React.FC<TopExercisesSectionProps> = ({ loading, topExercises }) => {
    if (loading || topExercises.length === 0) {
        return null;
    }

    return (
        <section>
            <h2 style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#8395A7',
                marginBottom: 10,
                letterSpacing: 1,
            }}>
                よくがんばった種目
            </h2>
            <div style={{ display: 'flex', gap: 10 }}>
                {topExercises.map(({ id, count }, index) => {
                    const exercise = EXERCISES.find((target) => target.id === id);
                    if (!exercise) {
                        return null;
                    }

                    return (
                        <motion.div
                            key={id}
                            className="card card-sm"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 6,
                                padding: '12px 8px',
                                background: 'var(--glass-bg-heavy)',
                            }}
                        >
                            <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: 16,
                                background: '#E1705515',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}>
                                <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={28} color="#E17055" />
                            </div>
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#2D3436',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '100%',
                            }}>
                                {exercise.name}
                            </span>
                            <span style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#2BBAA0',
                            }}>
                                {count}回
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
};
