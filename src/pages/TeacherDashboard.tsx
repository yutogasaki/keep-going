import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Flame, Users, RefreshCw, Loader2, ChevronDown, Clock, Calendar, TrendingUp } from 'lucide-react';
import { fetchAllStudents, type StudentSummary } from '../lib/teacher';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { getTodayKey, getDateKeyOffset, type SessionRecord } from '../lib/db';

const CLASS_EMOJI: Record<string, string> = {
    'プレ': '🐣',
    '初級': '🌱',
    '中級': '🌸',
    '上級': '⭐',
};

interface TeacherDashboardProps {
    onBack: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onBack }) => {
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const data = await fetchAllStudents();
        setStudents(data);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const today = getTodayKey();
    const activeToday = students.filter(s => s.lastActiveDate === today).length;

    // Weekly summary (last 7 days)
    const weeklyStats = useMemo(() => {
        if (students.length === 0) return null;
        const weekDates = new Set(
            Array.from({ length: 7 }, (_, i) => getDateKeyOffset(-i))
        );
        let activeStudents = 0;
        let totalMinutes = 0;
        let totalSessions = 0;
        for (const s of students) {
            const weekSessions = s.sessions.filter(sess => weekDates.has(sess.date));
            if (weekSessions.length > 0) activeStudents++;
            totalSessions += weekSessions.length;
            totalMinutes += weekSessions.reduce((sum, sess) => sum + sess.totalSeconds, 0);
        }
        totalMinutes = Math.floor(totalMinutes / 60);
        const rate = students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0;
        return { activeStudents, totalMinutes, totalSessions, rate };
    }, [students]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 100,
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '24px 20px 16px',
                gap: 12,
            }}>
                <button
                    onClick={onBack}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#F0F3F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#2D3436',
                        flexShrink: 0,
                    }}
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#2D3436',
                    margin: 0,
                    flex: 1,
                }}>
                    生徒一覧
                </h1>
                <button
                    onClick={load}
                    disabled={loading}
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#F0F3F5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#8395A7',
                        flexShrink: 0,
                    }}
                >
                    <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} />
                </button>
            </div>

            {/* Summary stats */}
            {!loading && students.length > 0 && (
                <>
                    <div style={{
                        display: 'flex',
                        gap: 10,
                        padding: '0 20px',
                        marginBottom: 12,
                    }}>
                        <StatCard
                            icon={<Users size={16} color="#6C5CE7" />}
                            value={students.length}
                            label="生徒数"
                            bgColor="#F3EEFF"
                        />
                        <StatCard
                            icon={<Flame size={16} color="#E17055" />}
                            value={activeToday}
                            label="今日の活動"
                            bgColor="#FFEDE8"
                        />
                    </div>

                    {/* Weekly summary card */}
                    {weeklyStats && (
                        <div className="card" style={{
                            margin: '0 20px 16px',
                            padding: '16px 20px',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                marginBottom: 12,
                            }}>
                                <Calendar size={14} color="#2BBAA0" />
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}>
                                    今週のまとめ
                                </span>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: 10,
                            }}>
                                <WeeklyStat
                                    label="練習率"
                                    value={`${weeklyStats.rate}%`}
                                    sub={`${weeklyStats.activeStudents}/${students.length}人`}
                                    color={weeklyStats.rate >= 70 ? '#2BBAA0' : weeklyStats.rate >= 40 ? '#FDCB6E' : '#E17055'}
                                />
                                <WeeklyStat
                                    label="合計セッション"
                                    value={`${weeklyStats.totalSessions}`}
                                    sub="回"
                                    color="#6C5CE7"
                                />
                                <WeeklyStat
                                    label="合計練習時間"
                                    value={`${weeklyStats.totalMinutes}`}
                                    sub="分"
                                    color="#0984E3"
                                />
                                <WeeklyStat
                                    label="平均ストリーク"
                                    value={`${students.length > 0 ? Math.round(students.reduce((s, st) => s + st.streak, 0) / students.length * 10) / 10 : 0}`}
                                    sub="日"
                                    color="#E17055"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Student cards */}
            <div style={{
                padding: '0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
            }}>
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: 48,
                        color: '#8395A7',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 12,
                    }}>
                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            margin: 0,
                        }}>
                            読み込み中...
                        </p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="card" style={{
                        textAlign: 'center',
                        padding: 40,
                    }}>
                        <p style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            color: '#8395A7',
                            margin: 0,
                        }}>
                            登録された生徒がいません
                        </p>
                    </div>
                ) : (
                    students.map(student => (
                        <StudentCard
                            key={student.accountId}
                            student={student}
                            expanded={expandedAccount === student.accountId}
                            onToggle={() => setExpandedAccount(
                                expandedAccount === student.accountId ? null : student.accountId
                            )}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// ─── StatCard ────────────────────────────────────────

const StatCard: React.FC<{
    icon: React.ReactNode;
    value: number;
    label: string;
    bgColor: string;
}> = ({ icon, value, label, bgColor }) => (
    <div className="card" style={{
        flex: 1,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    }}>
        <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
        }}>
            {icon}
        </div>
        <div>
            <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                color: '#2D3436',
                lineHeight: 1,
            }}>
                {value}
            </div>
            <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: '#8395A7',
            }}>
                {label}
            </div>
        </div>
    </div>
);

// ─── WeeklyStat ──────────────────────────────────────

const WeeklyStat: React.FC<{
    label: string;
    value: string;
    sub: string;
    color: string;
}> = ({ label, value, sub, color }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    }}>
        <div style={{
            fontFamily: "'Noto Sans JP', sans-serif",
            fontSize: 11,
            color: '#8395A7',
        }}>
            {label}
        </div>
        <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 3,
        }}>
            <span style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22,
                fontWeight: 700,
                color,
                lineHeight: 1,
            }}>
                {value}
            </span>
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: '#8395A7',
            }}>
                {sub}
            </span>
        </div>
    </div>
);

// ─── StudentCard ─────────────────────────────────────

const StudentCard: React.FC<{
    student: StudentSummary;
    expanded: boolean;
    onToggle: () => void;
}> = ({ student, expanded, onToggle }) => {
    // Convert to SessionRecord[] for ActivityHeatmap
    const heatmapSessions: SessionRecord[] = student.sessions.map(s => ({
        id: s.id,
        date: s.date,
        startedAt: s.startedAt,
        totalSeconds: s.totalSeconds,
        exerciseIds: [],
        skippedIds: [],
        userIds: s.userIds,
    }));

    // Recent sessions for expanded view (last 10, grouped by date)
    const recentByDate = new Map<string, number>();
    for (const s of student.sessions.slice(0, 30)) {
        recentByDate.set(s.date, (recentByDate.get(s.date) ?? 0) + s.totalSeconds);
    }
    const recentDates = [...recentByDate.entries()].slice(0, 7);

    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            {/* Main row */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '16px 16px 12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                {/* Name + class + stats row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {student.members.map((m, i) => (
                            <span
                                key={m.id}
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}
                            >
                                {i > 0 && <span style={{ color: '#B2BEC3', margin: '0 4px' }}>/</span>}
                                {CLASS_EMOJI[m.classLevel] ?? ''} {m.name}
                            </span>
                        ))}
                    </div>

                    {/* Streak badge */}
                    {student.streak > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '3px 8px',
                            borderRadius: 20,
                            background: '#FFF3E0',
                            flexShrink: 0,
                        }}>
                            <Flame size={13} color="#E17055" />
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#E17055',
                            }}>
                                {student.streak}
                            </span>
                        </div>
                    )}

                    {/* Total sessions */}
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        flexShrink: 0,
                    }}>
                        計{student.totalSessions}回
                    </div>

                    <ChevronDown
                        size={16}
                        color="#B2BEC3"
                        style={{
                            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s',
                            flexShrink: 0,
                        }}
                    />
                </div>

                {/* Heatmap */}
                <ActivityHeatmap sessions={heatmapSessions} daysToShow={14} />
            </button>

            {/* Expanded: Recent sessions */}
            {expanded && recentDates.length > 0 && (
                <div style={{
                    borderTop: '1px solid #F0F3F5',
                    padding: '12px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 2,
                    }}>
                        最近の練習
                    </div>
                    {recentDates.map(([date, totalSec]) => (
                        <div
                            key={date}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <Clock size={12} color="#B2BEC3" />
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12,
                                color: '#636E72',
                                width: 80,
                            }}>
                                {formatDateShort(date)}
                            </span>
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#2BBAA0',
                            }}>
                                {Math.floor(totalSec / 60)}分
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

function formatDateShort(dateKey: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!match) return dateKey;
    return `${Number(match[2])}/${Number(match[3])}`;
}
