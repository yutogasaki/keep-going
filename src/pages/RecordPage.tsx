import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Flame } from 'lucide-react';
import { getAllSessions, getSessionsByDate, getTodayKey, type SessionRecord } from '../lib/db';
import { EXERCISES } from '../data/exercises';
import { ExerciseIcon } from '../components/ExerciseIcon';
import { useAppStore } from '../store/useAppStore';
import { ActivityHeatmap } from '../components/ActivityHeatmap';

export const RecordPage: React.FC = () => {
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [todaySessions, setTodaySessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = () => {
            getSessionsByDate(getTodayKey()).then(setTodaySessions);
            getAllSessions().then(s => {
                setSessions(s);
                setLoading(false);
            });
        };
        load();

        // Refresh every 5 seconds
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

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
    const dailyTargetMinutes = useAppStore(s => s.dailyTargetMinutes);
    const todayTotalSeconds = todaySessions.reduce((acc, s) => acc + s.totalSeconds, 0);
    const todayMinutes = Math.floor(todayTotalSeconds / 60);
    const todayExerciseCount = todaySessions.reduce((acc, s) => acc + s.exerciseIds.length, 0);
    const targetSeconds = dailyTargetMinutes * 60;
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
            padding: '24px 20px 100px 20px',
            gap: 20,
            overflowY: 'auto',
        }}>
            {/* Header */}
            <h1 style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: '#2D3436',
            }}>
                きろく
            </h1>

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
                            : `${todayExerciseCount}種目 · ${todayMinutes}分`
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
