import React from 'react';
import { motion } from 'framer-motion';
import { TodayHeroCard } from './record-tab/TodayHeroCard';
import { TwoWeekTrendSection } from './record-tab/TwoWeekTrendSection';
import { RecordSuggestionCard } from './record-tab/RecordSuggestionCard';
import { TopExercisesSection } from './record-tab/TopExercisesSection';
import { SessionHistorySection } from './record-tab/SessionHistorySection';
import type { RecordTabContentProps } from './record-tab/types';

export const RecordTabContent: React.FC<RecordTabContentProps> = ({
    loading,
    todaySummary,
    twoWeekSummary,
    suggestion,
    topExercises,
    historyMonths,
    onSuggestionClick,
    canCreatePersonalChallenge,
    onCreatePersonalChallengeFromExercise,
}) => {
    return (
        <motion.div
            key="record"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
            <TodayHeroCard summary={todaySummary} />
            <RecordSuggestionCard suggestion={suggestion} onClick={onSuggestionClick} />
            <TwoWeekTrendSection summary={twoWeekSummary} />
            <TopExercisesSection
                topExercises={topExercises}
                canCreatePersonalChallenge={canCreatePersonalChallenge}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromExercise}
            />
            <SessionHistorySection loading={loading} months={historyMonths} />
        </motion.div>
    );
};
