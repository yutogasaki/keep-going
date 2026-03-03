import React from 'react';
import { motion } from 'framer-motion';
import { TodayProgressCard } from './record-tab/TodayProgressCard';
import { ActivitySection } from './record-tab/ActivitySection';
import { StatsRow } from './record-tab/StatsRow';
import { TopExercisesSection } from './record-tab/TopExercisesSection';
import { SessionHistorySection } from './record-tab/SessionHistorySection';
import type { RecordTabContentProps } from './record-tab/types';

export const RecordTabContent: React.FC<RecordTabContentProps> = ({
    loading,
    sessions,
    groupedEntries,
    todaySessions,
    todayExerciseCount,
    todayMinutes,
    progressPercent,
    ringRadius,
    ringCircumference,
    ringOffset,
    totalSessions,
    totalMinutes,
    uniqueDays,
    topExercises,
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
            <TodayProgressCard
                progressPercent={progressPercent}
                ringRadius={ringRadius}
                ringCircumference={ringCircumference}
                ringOffset={ringOffset}
                sessionCount={todaySessions.length}
                exerciseCount={todayExerciseCount}
                minutes={todayMinutes}
            />

            <ActivitySection sessions={sessions} />

            <StatsRow
                totalSessions={totalSessions}
                totalMinutes={totalMinutes}
                uniqueDays={uniqueDays}
            />

            <TopExercisesSection loading={loading} topExercises={topExercises} />

            <SessionHistorySection
                loading={loading}
                sessions={sessions}
                groupedEntries={groupedEntries}
            />
        </motion.div>
    );
};
