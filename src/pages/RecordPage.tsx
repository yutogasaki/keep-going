import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, Home } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { SCREEN_PADDING_X } from '../lib/styles';
import { getAllSessions, getCustomExercises, getTodayKey, type SessionRecord } from '../lib/db';
import { subscribeTeacherContentUpdated } from '../lib/teacherContentEvents';
import { EXERCISES } from '../data/exercises';
import { fetchTeacherExercises } from '../lib/teacherContent';
import { useAppStore } from '../store/useAppStore';
import type { ChibifuwaRecord, PastFuwafuwaRecord } from '../store/useAppStore';
import { RecordTabContent } from './record/RecordTabContent';
import { AlbumTabContent } from './record/AlbumTabContent';
import { RecordModals } from './record/RecordModals';
import { buildRecordHistoryDays } from './record/recordHistorySummary';
import {
    buildRecordHistoryAccordionSections,
    buildRecordSuggestionSummary,
    buildTodayRecordSummary,
    buildTopExerciseChips,
    buildTwoWeekRecordSummary,
} from './record/recordOverviewSummary';
import type { ExercisePlacement } from '../data/exercisePlacement';

type RecordTab = 'record' | 'album';

type ExerciseRecordInfo = {
    name: string;
    emoji: string;
    placement?: ExercisePlacement;
};

export const RecordPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<RecordTab>('record');
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFuwafuwa, setSelectedFuwafuwa] = useState<PastFuwafuwaRecord | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<ChibifuwaRecord | null>(null);
    const [exerciseMap, setExerciseMap] = useState<Map<string, ExerciseRecordInfo>>(new Map());

    const users = useAppStore((state) => state.users);
    const currentTab = useAppStore((state) => state.currentTab);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const setTab = useAppStore((state) => state.setTab);
    const openMenuWithIntent = useAppStore((state) => state.openMenuWithIntent);
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);
    const isPageActive = currentTab === 'record';
    const todayKey = getTodayKey();

    const currentViewUsers = useMemo(
        () => users.filter((user) => sessionUserIds.includes(user.id)),
        [users, sessionUserIds],
    );
    const pastFuwafuwas = useMemo(
        () => currentViewUsers
            .flatMap((user) => user.pastFuwafuwas || [])
            .filter((fuwafuwa) => fuwafuwa.finalStage === 3),
        [currentViewUsers],
    );
    const chibifuwas = useMemo(
        () => currentViewUsers.flatMap((user) => user.chibifuwas || []),
        [currentViewUsers],
    );
    const challengeStarsTotal = useMemo(
        () => currentViewUsers.reduce((sum, user) => sum + (user.challengeStars ?? 0), 0),
        [currentViewUsers],
    );
    const userNameMap = useMemo(() => new Map(users.map((user) => [user.id, user.name])), [users]);

    const loadExerciseMap = useCallback(async (forceRefresh = false) => {
        const nextMap = new Map<string, ExerciseRecordInfo>();

        for (const exercise of EXERCISES) {
            nextMap.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                placement: exercise.placement,
            });
        }

        setExerciseMap(new Map(nextMap));

        const customExercises = await getCustomExercises();
        for (const exercise of customExercises) {
            nextMap.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                placement: exercise.placement,
            });
        }

        setExerciseMap(new Map(nextMap));

        try {
            const teacherExercises = await fetchTeacherExercises(forceRefresh);
            for (const exercise of teacherExercises) {
                nextMap.set(exercise.id, {
                    name: exercise.name,
                    emoji: exercise.emoji,
                    placement: exercise.placement,
                });
            }
        } catch (error) {
            console.warn('Failed to load teacher exercises for record page', error);
        }

        setExerciseMap(new Map(nextMap));
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

    const todaySessions = useMemo(
        () => sessions.filter((session) => session.date === todayKey),
        [sessions, todayKey],
    );

    const historyDays = useMemo(() => {
        const grouped = new Map<string, SessionRecord[]>();

        for (const session of sessions) {
            const existing = grouped.get(session.date) || [];
            existing.push(session);
            grouped.set(session.date, existing);
        }

        return buildRecordHistoryDays({
            groupedEntries: Array.from(grouped.entries()),
            exerciseMap,
            userNameMap,
        });
    }, [exerciseMap, sessions, userNameMap]);

    const effectiveTargetMinutes = useMemo(() => {
        const dailyTargetMinutes = currentViewUsers.reduce(
            (sum, user) => sum + (user.dailyTargetMinutes ?? 10),
            0,
        );
        const fallbackTargetMinutes = users.length > 0 ? (users[0].dailyTargetMinutes ?? 10) : 10;
        return currentViewUsers.length > 0 ? dailyTargetMinutes : fallbackTargetMinutes;
    }, [currentViewUsers, users]);

    const todaySummary = useMemo(
        () => buildTodayRecordSummary({
            todaySessions,
            targetMinutes: effectiveTargetMinutes,
        }),
        [effectiveTargetMinutes, todaySessions],
    );

    const twoWeekSummary = useMemo(
        () => buildTwoWeekRecordSummary({
            sessions,
            exerciseMap,
        }),
        [exerciseMap, sessions],
    );

    const suggestion = useMemo(
        () => buildRecordSuggestionSummary({
            sessions,
            exerciseMap,
        }),
        [exerciseMap, sessions],
    );

    const topExercises = useMemo(
        () => buildTopExerciseChips({
            sessions,
            exerciseMap,
        }),
        [exerciseMap, sessions],
    );

    const historySections = useMemo(
        () => buildRecordHistoryAccordionSections({
            historyDays,
            todayKey,
        }),
        [historyDays, todayKey],
    );

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
                                todaySummary={todaySummary}
                                twoWeekSummary={twoWeekSummary}
                                suggestion={suggestion}
                                topExercises={topExercises}
                                historySections={historySections}
                                onSuggestionClick={() => {
                                    openMenuWithIntent({
                                        tab: 'individual',
                                        placement: suggestion.suggestedPlacement,
                                    });
                                    setTab('menu');
                                }}
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
