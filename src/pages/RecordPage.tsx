import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Flame, Home, Clock, Calendar, Award, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { getAllSessions, getSessionsByDate, getTodayKey, type SessionRecord } from '../lib/db';
import { EXERCISES } from '../data/exercises';
import { ExerciseIcon } from '../components/ExerciseIcon';
import { useAppStore } from '../store/useAppStore';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import type { PastFuwafuwaRecord, ChibifuwaRecord } from '../store/useAppStore';

export const RecordPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'record' | 'album'>('record');
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [todaySessions, setTodaySessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedFuwafuwa, setSelectedFuwafuwa] = useState<PastFuwafuwaRecord | null>(null);
    const [selectedBadge, setSelectedBadge] = useState<ChibifuwaRecord | null>(null);
    const users = useAppStore(s => s.users);
    const sessionUserIds = useAppStore(s => s.sessionUserIds);
    const sessionUserIdSet = useMemo(() => new Set(sessionUserIds), [sessionUserIds]);
    // Find who is currently active in this session view
    const currentViewUsers = users.filter(u => sessionUserIds.includes(u.id));
    // お部屋には成体（finalStage === 3）のふわふわのみ表示
    const pastFuwafuwas = currentViewUsers.flatMap(u => u.pastFuwafuwas || []).filter(fw => fw.finalStage === 3);
    // ちびふわコレクション
    const chibifuwas = currentViewUsers.flatMap(u => u.chibifuwas || []);

    useEffect(() => {
        const load = () => {
            getSessionsByDate(getTodayKey()).then(allToday => {
                setTodaySessions(filterSessionsByContext(allToday));
            });
            getAllSessions().then(s => {
                setSessions(filterSessionsByContext(s));
                setLoading(false);
            });
        };
        load();

        // Refresh every 5 seconds, but only while page is visible
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
    }, [sessionUserIds]); // Re-fetch/re-filter when context changes

    const filterSessionsByContext = (unfiltered: SessionRecord[]) => {
        const isTogetherMode = sessionUserIds.length > 1;
        return unfiltered.filter(s => {
            if (isTogetherMode) {
                // In together mode, include any session that involved at least one of the ALL users
                return !s.userIds || s.userIds.some(id => sessionUserIdSet.has(id));
            } else {
                // In individual mode, only include sessions strictly for this user
                return !s.userIds || s.userIds.includes(sessionUserIds[0]);
            }
        });
    };

    // Group by date
    const grouped = new Map<string, SessionRecord[]>();
    for (const s of sessions) {
        const existing = grouped.get(s.date) || [];
        existing.push(s);
        grouped.set(s.date, existing);
    }

    const totalSessions = sessions.length;
    const totalMinutes = Math.floor(sessions.reduce((acc, s) => acc + s.totalSeconds, 0) / 60);
    const uniqueDays = grouped.size;

    // Calculate top exercises
    const exerciseCounts = new Map<string, number>();
    for (const s of sessions) {
        for (const id of s.exerciseIds) {
            exerciseCounts.set(id, (exerciseCounts.get(id) || 0) + 1);
        }
    }
    const topExercises = Array.from(exerciseCounts.entries())
        .map(([id, count]) => ({ id, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

    // Today's Progress Calculations
    const activeUsers = users.filter((u) => sessionUserIds.includes(u.id));
    const dailyTargetMinutes = activeUsers.reduce((sum, u) => sum + (u.dailyTargetMinutes ?? 10), 0);
    const fallbackTargetMinutes = users.length > 0 ? (users[0].dailyTargetMinutes ?? 10) : 10;
    const effectiveTargetMinutes = activeUsers.length > 0 ? dailyTargetMinutes : fallbackTargetMinutes;

    const todayTotalSeconds = todaySessions.reduce((acc, s) => acc + s.totalSeconds, 0);
    const todayMinutes = Math.floor(todayTotalSeconds / 60);
    const todayExerciseCount = todaySessions.reduce((acc, s) => acc + s.exerciseIds.length, 0);
    const targetSeconds = Math.max(1, effectiveTargetMinutes * 60);
    const progressPercent = Math.min(100, Math.round((todayTotalSeconds / targetSeconds) * 100));

    // Progress ring calculations
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
                {/* Header / Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: -12, // reduce gap before content
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
                            gap: 6
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
                            gap: 6
                        }}
                    >
                        <Home size={16} />
                        お部屋
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'record' ? (
                        <motion.div
                            key="record"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
                        >

                            {/* Today's Progress Card */}
                            <motion.div
                                className="card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    padding: '20px 24px',
                                }}
                            >
                                {/* Progress Ring */}
                                <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                                    <svg width="64" height="64" viewBox="0 0 64 64" className="progress-ring">
                                        <circle cx="32" cy="32" r={ringRadius} fill="none" stroke="#E8F8F0" strokeWidth="6" />
                                        <circle
                                            cx="32" cy="32" r={ringRadius}
                                            fill="none"
                                            stroke="#2BBAA0"
                                            strokeWidth="6"
                                            strokeLinecap="round"
                                            strokeDasharray={ringCircumference}
                                            strokeDashoffset={ringOffset}
                                            className="progress-ring__circle"
                                            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                                        />
                                    </svg>
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontFamily: "'Outfit', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#2BBAA0',
                                    }}>
                                        {progressPercent}%
                                    </div>
                                </div>

                                <div>
                                    <h3 style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        marginBottom: 4,
                                    }}>
                                        今日のストレッチ
                                    </h3>
                                    <p style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 13,
                                        color: '#8395A7',
                                    }}>
                                        {todaySessions.length === 0
                                            ? 'まだ始めていません'
                                            : `${todayExerciseCount} 種目 · ${todayMinutes} 分`
                                        }
                                    </p>
                                </div>
                            </motion.div>

                            {/* Heatmap */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                            >
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#8395A7',
                                    marginBottom: 10,
                                    letterSpacing: 1,
                                }}>
                                    アクティビティ
                                </div>
                                <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <ActivityHeatmap sessions={sessions} daysToShow={14} />
                                    <p style={{
                                        fontSize: 11,
                                        color: '#B2BEC3',
                                        marginTop: 10,
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        letterSpacing: 1
                                    }}>
                                        LAST 14 DAYS
                                    </p>
                                </div>
                            </motion.div>

                            {/* Stats row */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <StatCard icon={<Flame size={18} color="#E17055" />} value={totalSessions} label="合計回数" color="#FFE5D9" delay={0.2} />
                                <StatCard icon={<Clock size={18} color="#2BBAA0" />} value={totalMinutes} label="合計分" color="#E8F8F0" delay={0.3} />
                                <StatCard icon={<Calendar size={18} color="#6C5CE7" />} value={uniqueDays} label="日数" color="#E8D5F5" delay={0.4} />
                            </div>

                            {/* Top Exercises */}
                            {!loading && topExercises.length > 0 && (
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
                                        {topExercises.map(({ id, count }, i) => {
                                            const ex = EXERCISES.find(e => e.id === id);
                                            if (!ex) return null;
                                            return (
                                                <motion.div
                                                    key={id}
                                                    className="card card-sm"
                                                    initial={{ opacity: 0, y: 16 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 + i * 0.1 }}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        padding: '12px 8px',
                                                        background: 'rgba(255, 255, 255, 0.9)',
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
                                                        <ExerciseIcon id={ex.id} emoji={ex.emoji} size={28} color="#E17055" />
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
                                                    }}>{ex.name}</span>
                                                    <span style={{
                                                        fontFamily: "'Outfit', sans-serif",
                                                        fontSize: 12,
                                                        fontWeight: 700,
                                                        color: '#2BBAA0',
                                                    }}>{count}回</span>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* History list */}
                            {loading ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 40,
                                    color: '#B2BEC3',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                }}>
                                    よみこみ中...
                                </div>
                            ) : sessions.length === 0 ? (
                                <motion.div
                                    className="card"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        textAlign: 'center',
                                        padding: '40px 24px',
                                    }}
                                >
                                    <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                        style={{ fontSize: 48, display: 'block', marginBottom: 16 }}
                                    >
                                        🌱
                                    </motion.div>
                                    <h3 style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 18,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        marginBottom: 12,
                                    }}>
                                        最初のきろくを作ろう！
                                    </h3>
                                    <p style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        color: '#8395A7',
                                        lineHeight: 1.6,
                                    }}>
                                        下の START ボタンからストレッチを始めると<br />
                                        ここに草（きろく）が生えていきます。<br />
                                        まずは1日目、いってみよう！
                                    </p>
                                </motion.div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {Array.from(grouped.entries()).map(([date, dayRecords], i) => (
                                        <motion.div
                                            key={date}
                                            className="card card-sm"
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 + i * 0.05 }}
                                        >
                                            <div style={{
                                                fontFamily: "'Outfit', sans-serif",
                                                fontSize: 13,
                                                fontWeight: 600,
                                                color: '#2BBAA0',
                                                marginBottom: 8,
                                            }}>
                                                {formatDate(date)}
                                            </div>
                                            {dayRecords.map(record => (
                                                <div key={record.id} style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 8,
                                                    padding: '6px 0',
                                                    borderTop: '1px solid rgba(0,0,0,0.04)',
                                                }}>
                                                    <Clock size={14} color="#B2BEC3" />
                                                    <span style={{
                                                        fontFamily: "'Noto Sans JP', sans-serif",
                                                        fontSize: 13,
                                                        color: '#2D3436',
                                                        flex: 1,
                                                    }}>
                                                        {record.exerciseIds.length}種目 · {Math.floor(record.totalSeconds / 60)}分{record.totalSeconds % 60}秒
                                                    </span>
                                                    <span style={{
                                                        fontFamily: "'JetBrains Mono', monospace",
                                                        fontSize: 11,
                                                        color: '#B2BEC3',
                                                    }}>
                                                        {new Date(record.startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ))}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="album"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 20,
                                paddingTop: 8,
                            }}
                        >
                            {/* ちびふわバッジ */}
                            {chibifuwas.length > 0 && (
                                <section>
                                    <div style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 13,
                                        fontWeight: 700,
                                        color: '#8395A7',
                                        marginBottom: 10,
                                        letterSpacing: 1,
                                    }}>
                                        ちびふわバッジ
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        gap: 12,
                                        flexWrap: 'wrap',
                                    }}>
                                        {chibifuwas.map((cb, i) => (
                                            <motion.div
                                                key={cb.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: i * 0.05 }}
                                                onClick={() => setSelectedBadge(cb)}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                    width: 72,
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                <div style={{
                                                    width: 64,
                                                    height: 64,
                                                    borderRadius: '50%',
                                                    background: '#fff',
                                                    border: '2px solid rgba(255, 200, 0, 0.35)',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 2px 8px rgba(255, 200, 0, 0.15)',
                                                }}>
                                                    <img
                                                        src={`/medal/${cb.type}.png`}
                                                        alt={cb.challengeTitle}
                                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                                    />
                                                </div>
                                                <div style={{
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 10,
                                                    fontWeight: 600,
                                                    color: '#2D3436',
                                                    textAlign: 'center',
                                                    lineHeight: 1.3,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical' as const,
                                                    maxWidth: '100%',
                                                }}>
                                                    {cb.challengeTitle}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* 成体ふわふわ */}
                            {pastFuwafuwas.length === 0 && chibifuwas.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '48px 20px',
                                    color: '#8395A7',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                }}>
                                    <Home size={48} color="#FFEAA7" style={{ margin: '0 auto 16px' }} />
                                    <div style={{ fontSize: 16, fontWeight: 700, color: '#2D3436', marginBottom: 8 }}>
                                        まだ お部屋にはだれもいません
                                    </div>
                                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                                        ふわふわを成体まで育てると、<br />
                                        ここに引っ越してくるよ。
                                    </div>
                                </div>
                            ) : pastFuwafuwas.length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(2, 1fr)',
                                    gap: 16,
                                }}>
                                    {pastFuwafuwas.map((fw, i) => (
                                        <motion.div
                                            key={fw.id}
                                            className="card card-sm"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            onClick={() => setSelectedFuwafuwa(fw)}
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                padding: '16px',
                                                gap: 12,
                                                border: '1px solid rgba(232, 67, 147, 0.1)',
                                                background: 'linear-gradient(135deg, #fff 0%, #FAFAFA 100%)',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{
                                                width: 80,
                                                height: 80,
                                                borderRadius: '50%',
                                                background: '#fff',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                                                overflow: 'hidden',
                                                border: '2px solid rgba(255,154,158,0.2)',
                                            }}>
                                                <img
                                                    src={`/ikimono/${fw.type}-${fw.finalStage}.png`}
                                                    alt="Fuwafuwa"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', display: 'block' }}
                                                />
                                            </div>
                                            <div style={{
                                                textAlign: 'center',
                                                width: '100%',
                                            }}>
                                                <div style={{
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    color: '#2D3436',
                                                    marginBottom: 4,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {fw.name || 'なまえなし'}
                                                </div>
                                                <div style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                    fontSize: 11,
                                                    color: '#E84393',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontWeight: 600,
                                                    background: 'rgba(232, 67, 147, 0.08)',
                                                    padding: '4px 8px',
                                                    borderRadius: 12,
                                                }}>
                                                    <Award size={12} />
                                                    頑張り度: {fw.activeDays}日
                                                </div>
                                                <div style={{
                                                    fontSize: 10,
                                                    color: '#B2BEC3',
                                                    marginTop: 8,
                                                    fontFamily: "'Outfit', sans-serif",
                                                }}>
                                                    {formatDate(fw.sayonaraDate)}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : null}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ふわふわ詳細モーダル */}
            {createPortal(
                <AnimatePresence>
                    {selectedFuwafuwa && (
                        <motion.div
                            key="fuwafuwa-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFuwafuwa(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                zIndex: 300,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 24,
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    background: '#fff',
                                    borderRadius: 24,
                                    padding: '32px 28px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 16,
                                    width: '100%',
                                    maxWidth: 280,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                }}
                            >
                                <button
                                    onClick={() => setSelectedFuwafuwa(null)}
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F8F9FA',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={16} color="#636E72" />
                                </button>
                                <div style={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid rgba(255,154,158,0.4)',
                                    boxShadow: '0 8px 24px rgba(232,67,147,0.15)',
                                    background: '#fff',
                                }}>
                                    <img
                                        src={`/ikimono/${selectedFuwafuwa.type}-${selectedFuwafuwa.finalStage}.png`}
                                        alt={selectedFuwafuwa.name || 'ふわふわ'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', display: 'block' }}
                                    />
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    textAlign: 'center',
                                }}>
                                    {selectedFuwafuwa.name || 'なまえなし'}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 13,
                                    color: '#E84393',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontWeight: 600,
                                    background: 'rgba(232,67,147,0.08)',
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                }}>
                                    <Award size={14} />
                                    頑張り度: {selectedFuwafuwa.activeDays}日
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#B2BEC3',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {formatDate(selectedFuwafuwa.sayonaraDate)}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {/* ちびふわバッジ詳細モーダル */}
            {createPortal(
                <AnimatePresence>
                    {selectedBadge && (
                        <motion.div
                            key="badge-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedBadge(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                zIndex: 300,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 24,
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                onClick={e => e.stopPropagation()}
                                style={{
                                    background: '#fff',
                                    borderRadius: 24,
                                    padding: '32px 28px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 16,
                                    width: '100%',
                                    maxWidth: 280,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                }}
                            >
                                <button
                                    onClick={() => setSelectedBadge(null)}
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F8F9FA',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={16} color="#636E72" />
                                </button>
                                <div style={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid rgba(255,200,0,0.4)',
                                    boxShadow: '0 8px 24px rgba(255,200,0,0.2)',
                                    background: '#fff',
                                }}>
                                    <img
                                        src={`/medal/${selectedBadge.type}.png`}
                                        alt={selectedBadge.challengeTitle}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                    />
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    textAlign: 'center',
                                    lineHeight: 1.5,
                                }}>
                                    {selectedBadge.challengeTitle}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#B2BEC3',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {formatDate(selectedBadge.earnedDate)}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </div>
    );
};

const StatCard: React.FC<{
    icon: React.ReactNode;
    value: number;
    label: string;
    color: string;
    delay: number;
}> = ({ icon, value, label, color, delay }) => (
    <motion.div
        className="card card-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            padding: '16px 8px',
        }}
    >
        <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {icon}
        </div>
        <span style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: '#2D3436',
        }}>
            {value}
        </span>
        <span style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 11,
            color: '#8395A7',
        }}>
            {label}
        </span>
    </motion.div>
);

function formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[d.getDay()];
    return `${month}/${day} (${weekday})`;
}
