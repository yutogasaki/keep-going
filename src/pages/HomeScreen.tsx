import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Flame } from 'lucide-react';
import { getSessionsByDate, getTodayKey, getAllSessions, calculateStreak, type SessionRecord } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { FuwafuwaCharacter } from '../components/FuwafuwaCharacter';

const motivationalMessages = [
    { main: 'きょうも いっぽずつ。', sub: '夢に向かって、のびのびしよう。' },
    { main: 'からだと なかよくなろう。', sub: 'ゆっくりでいいよ、Keep Going!' },
    { main: 'きのうより すこしだけ。', sub: 'それだけで じゅうぶんすごい！' },
    { main: 'まいにち つづける って、', sub: 'じつは いちばん かっこいい。' },
];

const getTodayMessage = () => {
    const dayIndex = new Date().getDate() % motivationalMessages.length;
    return motivationalMessages[dayIndex];
};

export const HomeScreen: React.FC = () => {
    const message = getTodayMessage();
    const [todaySessions, setTodaySessions] = useState<SessionRecord[]>([]);
    const [allSessions, setAllSessions] = useState<SessionRecord[]>([]);
    const [streak, setStreak] = useState(0);

    useEffect(() => {
        const load = () => {
            getSessionsByDate(getTodayKey()).then(setTodaySessions);
            getAllSessions().then(sessions => {
                setAllSessions(sessions);
                setStreak(calculateStreak(sessions));
            });
        };
        load();
        // Refresh every 5 seconds to pick up new sessions
        const interval = setInterval(load, 5000);
        return () => clearInterval(interval);
    }, []);

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
            {/* TODAY Card */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ textAlign: 'center', padding: '28px 24px', position: 'relative', overflow: 'hidden' }}
            >
                {/* Background decorative gradient */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: 160,
                    background: 'linear-gradient(180deg, rgba(43,186,160,0.1) 0%, rgba(255,255,255,0) 100%)',
                    zIndex: 0,
                    pointerEvents: 'none'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        marginBottom: 16,
                    }}>
                        <Sparkles size={18} color="#2BBAA0" />
                        <span style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            letterSpacing: 3,
                            color: '#2BBAA0',
                            textTransform: 'uppercase',
                        }}>TODAY</span>
                        <Sparkles size={18} color="#2BBAA0" />
                    </div>

                    {streak > 0 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', damping: 12 }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
                                padding: '6px 16px',
                                borderRadius: 20,
                                marginBottom: 20,
                                boxShadow: '0 4px 12px rgba(255, 154, 158, 0.3)',
                            }}
                        >
                            <Flame size={18} color="#E84393" strokeWidth={2.5} />
                            <span style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 800,
                                fontSize: 15,
                                color: '#E84393',
                                letterSpacing: 1
                            }}>
                                {streak} DAYS STREAK!
                            </span>
                        </motion.div>
                    )}

                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 6,
                        lineHeight: 1.5,
                    }}>
                        {message.main}
                    </h2>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#8395A7',
                        lineHeight: 1.6,
                        marginBottom: 16,
                    }}>
                        {message.sub}
                    </p>

                    {/* Fuwafuwa Character */}
                    <FuwafuwaCharacter sessions={allSessions} />

                    <div style={{ marginTop: 24 }}>
                        <ActivityHeatmap sessions={allSessions} daysToShow={14} />
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
                </div>
            </motion.div>

            {/* Progress Card */}
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
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

            {/* Hint / CTA Card */}
            <motion.div
                className="card card-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px',
                }}
            >
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #FFE5D9, #FFD5C8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <TrendingUp size={18} color="#E17055" />
                </div>
                <p style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#8395A7',
                    lineHeight: 1.5,
                }}>
                    {todaySessions.length === 0
                        ? <>下の<span style={{ color: '#2BBAA0', fontWeight: 700 }}>STARTボタン</span>をタップして、ストレッチをはじめよう！</>
                        : <>🌟 がんばったね！もっとやりたい時は、また<span style={{ color: '#2BBAA0', fontWeight: 700 }}>STARTボタン</span>をタップしてね。</>
                    }
                </p>
            </motion.div>
        </div>
    );
};
