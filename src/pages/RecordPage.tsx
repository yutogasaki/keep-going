import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, Home } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { SCREEN_PADDING_X } from '../lib/styles';
import { getAllSessions, getCustomExercises, getSessionsByDate, getTodayKey, type SessionRecord } from '../lib/db';
import { getSessionCompletedExerciseTotal, getSessionExerciseCounts } from '../lib/sessionRecords';
import { subscribeTeacherContentUpdated } from '../lib/teacherContentEvents';
import { EXERCISES } from '../data/exercises';
import { fetchTeacherExercises } from '../lib/teacherContent';
import { useAppStore } from '../store/useAppStore';
import type { ChibifuwaRecord, PastFuwafuwaRecord } from '../store/useAppStore';
import { RecordTabContent } from './record/RecordTabContent';
import { AlbumTabContent } from './record/AlbumTabContent';
import { RecordModals } from './record/RecordModals';
import {
    buildRecordHistoryDays,
    buildRecordInsightSummary,
    buildRecordParticipantSummaries,
} from './record/recordHistorySummary';

type RecordTab = 'record' | 'album';

export const RecordPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<RecordTab>('record');
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [todaySessions, setTodaySessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFuwafuwa, setSelectedFuwafuwa] = useState<PastFuwafuwaRecord | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<ChibifuwaRecord | null>(null);
    const [exerciseMap, setExerciseMap] = useState<Map<string, { name: string; emoji: string }>>(new Map());

    const users = useAppStore((state) => state.users);
    const currentTab = useAppStore((state) => state.currentTab);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);
    const isPageActive = currentTab === 'record';

    const currentViewUsers = useMemo(() => users.filter((user) => sessionUserIds.includes(user.id)), [users, sessionUserIds]);
    const pastFuwafuwas = useMemo(() => currentViewUsers.flatMap((user) => user.pastFuwafuwas || []).filter((fuwafuwa) => fuwafuwa.finalStage === 3), [currentViewUsers]);
    const chibifuwas = useMemo(() => currentViewUsers.flatMap((user) => user.chibifuwas || []), [currentViewUsers]);
    const challengeStarsTotal = useMemo(
        () => currentViewUsers.reduce((sum, user) => sum + (user.challengeStars ?? 0), 0),
        [currentViewUsers],
    );
    const userNameMap = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

    const loadExerciseMap = useCallback(async (forceRefresh = false) => {
        const map = new Map<string, { name: string; emoji: string }>();
        for (const e of EXERCISES) map.set(e.id, { name: e.name, emoji: e.emoji });
        const customs = await getCustomExercises();
        for (const c of customs) map.set(c.id, { name: c.name, emoji: c.emoji });
        const teachers = await fetchTeacherExercises(forceRefresh);
        for (const t of teachers) map.set(t.id, { name: t.name, emoji: t.emoji });
        setExerciseMap(map);
    }, []);

    const filterSessionsByContext = useCallback((unfiltered: SessionRecord[]) => {
        const isTogetherMode = sessionUserIds.length > 1;
        return unfiltered.filter((session) => {
            if (isTogetherMode) {
                return !session.userIds || session.userIds.some((id) => sessionUserIdSet.has(id));
            }
            return !session.userIds || session.userIds.includes(sessionUserIds[0]);
        });
    }, [sessionUserIdSet, sessionUserIds]);

    useEffect(() => {
        if (!isPageActive) {
            return;
        }

        const load = () => {
            getSessionsByDate(getTodayKey()).then((allToday) => {
                setTodaySessions(filterSessionsByContext(allToday));
            });
            getAllSessions().then((allSessions) => {
                setSessions(filterSessionsByContext(allSessions));
                setLoading(false);
            });
        };

        load();

        let interval = setInterval(load, 5000);

        const handleVisibility = () => {
            clearInterval(interval);
            if (document.visibilityState === 'visible') {
                load();
                interval = setInterval(load, 5000);
            }
        };

        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [filterSessionsByContext, isPageActive]);

    useEffect(() => {
        void loadExerciseMap();
    }, [loadExerciseMap]);

    useEffect(() => {
        return subscribeTeacherContentUpdated(() => {
            void loadExerciseMap(true);
        });
    }, [loadExerciseMap]);

    const { historyDays, totalSessions, totalMinutes, uniqueDays, exerciseCounts, skippedTotal, participantSummaries } = useMemo(() => {
        const grouped = new Map<string, SessionRecord[]>();
        for (const session of sessions) {
            const existing = grouped.get(session.date) || [];
            existing.push(session);
            grouped.set(session.date, existing);
        }

        const counts = new Map<string, number>();
        let totalSkipped = 0;
        for (const session of sessions) {
            for (const [exerciseId, count] of Object.entries(getSessionExerciseCounts(session))) {
                counts.set(exerciseId, (counts.get(exerciseId) || 0) + count);
            }
            totalSkipped += session.skippedIds.length;
        }

        return {
            historyDays: buildRecordHistoryDays({
                groupedEntries: Array.from(grouped.entries()),
                exerciseMap,
                userNameMap,
            }),
            totalSessions: sessions.length,
            totalMinutes: Math.floor(sessions.reduce((acc, session) => acc + session.totalSeconds, 0) / 60),
            uniqueDays: grouped.size,
            exerciseCounts: counts,
            skippedTotal: totalSkipped,
            participantSummaries: buildRecordParticipantSummaries({
                sessions,
                userNameMap,
            }),
        };
    }, [sessions, exerciseMap, userNameMap]);

    const topExercises = useMemo(() =>
        Array.from(exerciseCounts.entries())
            .map(([id, count]) => {
                const info = exerciseMap.get(id);
                return { id, count, name: info?.name, emoji: info?.emoji };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 3),
    [exerciseCounts, exerciseMap]);

    const recordInsightSummary = useMemo(() => buildRecordInsightSummary({
        viewUserNames: currentViewUsers.map((user) => user.name),
        totalSessions,
        totalMinutes,
        uniqueDays,
        skippedTotal,
        topExercise: topExercises[0],
        participantSummaries,
    }), [currentViewUsers, participantSummaries, skippedTotal, topExercises, totalMinutes, totalSessions, uniqueDays]);

    const { todayMinutes, todayExerciseCount, progressPercent, ringRadius, ringCircumference, ringOffset } = useMemo(() => {
        const activeUsers = users.filter((user) => sessionUserIds.includes(user.id));
        const dailyTargetMinutes = activeUsers.reduce((sum, user) => sum + (user.dailyTargetMinutes ?? 10), 0);
        const fallbackTargetMinutes = users.length > 0 ? (users[0].dailyTargetMinutes ?? 10) : 10;
        const effectiveTargetMinutes = activeUsers.length > 0 ? dailyTargetMinutes : fallbackTargetMinutes;

        const todayTotalSeconds = todaySessions.reduce((acc, session) => acc + session.totalSeconds, 0);
        const targetSec = Math.max(1, effectiveTargetMinutes * 60);
        const progress = Math.min(100, Math.round((todayTotalSeconds / targetSec) * 100));
        const radius = 24;
        const circumference = 2 * Math.PI * radius;

        return {
            todayMinutes: Math.floor(todayTotalSeconds / 60),
            todayExerciseCount: todaySessions.reduce(
                (acc, session) => acc + getSessionCompletedExerciseTotal(session),
                0,
            ),
            progressPercent: progress,
            ringRadius: radius,
            ringCircumference: circumference,
            ringOffset: circumference * (1 - progress / 100),
        };
    }, [todaySessions, users, sessionUserIds]);

    return (
        <>
            <ScreenScaffold
                header={<PageHeader title="きろく" rightElement={<CurrentContextBadge />} />}
                withBottomNav
                contentStyle={{ display: 'flex', flexDirection: 'column' }}
            >
                <div style={{ padding: `0 ${SCREEN_PADDING_X}px`, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.04)',
                        borderRadius: 12,
                        padding: 4,
                        marginBottom: -12,
                    }}>
                        <button
                            onClick={() => setActiveTab('record')}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                fontSize: 14,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontWeight: 700,
                                border: 'none',
                                background: activeTab === 'record' ? '#fff' : 'transparent',
                                color: activeTab === 'record' ? '#2D3436' : '#8395A7',
                                borderRadius: 8,
                                boxShadow: activeTab === 'record' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <CalendarDays size={16} />
                            きろく
                        </button>
                        <button
                            onClick={() => setActiveTab('album')}
                            style={{
                                flex: 1,
                                padding: '10px 0',
                                fontSize: 14,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontWeight: 700,
                                border: 'none',
                                background: activeTab === 'album' ? '#fff' : 'transparent',
                                color: activeTab === 'album' ? '#E84393' : '#8395A7',
                                borderRadius: 8,
                                boxShadow: activeTab === 'album' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            <Home size={16} />
                            お部屋
                        </button>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'record' ? (
                            <RecordTabContent
                                loading={loading}
                                sessions={sessions}
                                sessionsCount={sessions.length}
                                historyDays={historyDays}
                                todaySessionsCount={todaySessions.length}
                                todayExerciseCount={todayExerciseCount}
                                todayMinutes={todayMinutes}
                                progressPercent={progressPercent}
                                ringRadius={ringRadius}
                                ringCircumference={ringCircumference}
                                ringOffset={ringOffset}
                                totalSessions={totalSessions}
                                totalMinutes={totalMinutes}
                                uniqueDays={uniqueDays}
                                topExercises={topExercises}
                                recordInsightSummary={recordInsightSummary}
                            />
                        ) : (
                            <AlbumTabContent
                                chibifuwas={chibifuwas}
                                pastFuwafuwas={pastFuwafuwas}
                                challengeStarsTotal={challengeStarsTotal}
                                onSelectBadge={setSelectedBadge}
                                onSelectFuwafuwa={setSelectedFuwafuwa}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </ScreenScaffold>

            <RecordModals
                selectedFuwafuwa={selectedFuwafuwa}
                selectedBadge={selectedBadge}
                onCloseFuwafuwa={() => setSelectedFuwafuwa(null)}
                onCloseBadge={() => setSelectedBadge(null)}
            />
        </>
    );
};
