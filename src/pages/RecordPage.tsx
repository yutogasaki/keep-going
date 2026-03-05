import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, Home } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { getAllSessions, getCustomExercises, getSessionsByDate, getTodayKey, type SessionRecord } from '../lib/db';
import { EXERCISES } from '../data/exercises';
import { fetchTeacherExercises } from '../lib/teacherContent';
import { useAppStore } from '../store/useAppStore';
import type { ChibifuwaRecord, PastFuwafuwaRecord } from '../store/useAppStore';
import { RecordTabContent } from './record/RecordTabContent';
import { AlbumTabContent } from './record/AlbumTabContent';
import { RecordModals } from './record/RecordModals';

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
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);

    const currentViewUsers = users.filter((user) => sessionUserIds.includes(user.id));
    const pastFuwafuwas = currentViewUsers.flatMap((user) => user.pastFuwafuwas || []).filter((fuwafuwa) => fuwafuwa.finalStage === 3);
    const chibifuwas = currentViewUsers.flatMap((user) => user.chibifuwas || []);

    const filterSessionsByContext = (unfiltered: SessionRecord[]) => {
        const isTogetherMode = sessionUserIds.length > 1;
        return unfiltered.filter((session) => {
            if (isTogetherMode) {
                return !session.userIds || session.userIds.some((id) => sessionUserIdSet.has(id));
            }
            return !session.userIds || session.userIds.includes(sessionUserIds[0]);
        });
    };

    useEffect(() => {
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
    }, [sessionUserIds]);

    useEffect(() => {
        const loadExMap = async () => {
            const map = new Map<string, { name: string; emoji: string }>();
            for (const e of EXERCISES) map.set(e.id, { name: e.name, emoji: e.emoji });
            const customs = await getCustomExercises();
            for (const c of customs) map.set(c.id, { name: c.name, emoji: c.emoji });
            const teachers = await fetchTeacherExercises();
            for (const t of teachers) map.set(t.id, { name: t.name, emoji: t.emoji });
            setExerciseMap(map);
        };
        loadExMap();
    }, []);

    const groupedSessions = new Map<string, SessionRecord[]>();
    for (const session of sessions) {
        const existing = groupedSessions.get(session.date) || [];
        existing.push(session);
        groupedSessions.set(session.date, existing);
    }
    const groupedEntries = Array.from(groupedSessions.entries());

    const totalSessions = sessions.length;
    const totalMinutes = Math.floor(sessions.reduce((acc, session) => acc + session.totalSeconds, 0) / 60);
    const uniqueDays = groupedSessions.size;

    const exerciseCounts = new Map<string, number>();
    for (const session of sessions) {
        for (const exerciseId of session.exerciseIds) {
            exerciseCounts.set(exerciseId, (exerciseCounts.get(exerciseId) || 0) + 1);
        }
    }
    const topExercises = Array.from(exerciseCounts.entries())
        .map(([id, count]) => {
            const info = exerciseMap.get(id);
            return { id, count, name: info?.name, emoji: info?.emoji };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    const activeUsers = users.filter((user) => sessionUserIds.includes(user.id));
    const dailyTargetMinutes = activeUsers.reduce((sum, user) => sum + (user.dailyTargetMinutes ?? 10), 0);
    const fallbackTargetMinutes = users.length > 0 ? (users[0].dailyTargetMinutes ?? 10) : 10;
    const effectiveTargetMinutes = activeUsers.length > 0 ? dailyTargetMinutes : fallbackTargetMinutes;

    const todayTotalSeconds = todaySessions.reduce((acc, session) => acc + session.totalSeconds, 0);
    const todayMinutes = Math.floor(todayTotalSeconds / 60);
    const todayExerciseCount = todaySessions.reduce((acc, session) => acc + session.exerciseIds.length, 0);
    const targetSeconds = Math.max(1, effectiveTargetMinutes * 60);
    const progressPercent = Math.min(100, Math.round((todayTotalSeconds / targetSeconds) * 100));

    const ringRadius = 24;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference * (1 - progressPercent / 100);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 100,
        }}>
            <PageHeader title="きろく" rightElement={<CurrentContextBadge />} />

            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                            groupedEntries={groupedEntries}
                            todaySessions={todaySessions}
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
                        />
                    ) : (
                        <AlbumTabContent
                            chibifuwas={chibifuwas}
                            pastFuwafuwas={pastFuwafuwas}
                            onSelectBadge={setSelectedBadge}
                            onSelectFuwafuwa={setSelectedFuwafuwa}
                        />
                    )}
                </AnimatePresence>
            </div>

            <RecordModals
                selectedFuwafuwa={selectedFuwafuwa}
                selectedBadge={selectedBadge}
                onCloseFuwafuwa={() => setSelectedFuwafuwa(null)}
                onCloseBadge={() => setSelectedBadge(null)}
            />
        </div>
    );
};
