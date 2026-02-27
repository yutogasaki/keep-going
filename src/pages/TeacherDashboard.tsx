import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, Flame, Users, RefreshCw, Loader2, ChevronDown, Clock, Calendar } from 'lucide-react';
import { fetchAllStudents, calculateStreak, type StudentSummary, type StudentSession } from '../lib/teacher';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { getTodayKey, getDateKeyOffset, type SessionRecord } from '../lib/db';
import { CLASS_LEVELS, CLASS_EMOJI } from '../data/exercises';

const CLASS_ORDER = CLASS_LEVELS.map(c => c.id);

// ─── Individual student (flattened from account) ─────

interface IndividualStudent {
    memberId: string;
    name: string;
    classLevel: string;
    accountId: string;
    sessions: StudentSession[];
    streak: number;
    totalSessions: number;
    lastActiveDate: string | null;
}

interface TeacherDashboardProps {
    onBack: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onBack }) => {
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedClass, setExpandedClass] = useState<string | null>(null);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllStudents();
            setStudents(data);
        } catch (err) {
            console.warn('[teacher] Failed to load students:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Flatten to individual students
    const individualStudents = useMemo(() => {
        const result: IndividualStudent[] = [];
        for (const summary of students) {
            for (const member of summary.members) {
                const memberSessions = summary.sessions.filter(s =>
                    s.userIds.length === 0 || s.userIds.includes(member.id)
                );
                result.push({
                    memberId: member.id,
                    name: member.name,
                    classLevel: member.classLevel,
                    accountId: summary.accountId,
                    sessions: memberSessions,
                    streak: calculateStreak(memberSessions),
                    totalSessions: memberSessions.length,
                    lastActiveDate: memberSessions.length > 0 ? memberSessions[0].date : null,
                });
            }
        }
        return result;
    }, [students]);

    // Group by class
    const studentsByClass = useMemo(() => {
        const groups = new Map<string, IndividualStudent[]>();
        for (const level of CLASS_ORDER) {
            groups.set(level, []);
        }
        for (const s of individualStudents) {
            const level = CLASS_ORDER.includes(s.classLevel) ? s.classLevel : 'その他';
            groups.get(level)!.push(s);
        }
        // Sort students within each class by last active date (most recent first)
        for (const [, list] of groups) {
            list.sort((a, b) => (b.lastActiveDate ?? '').localeCompare(a.lastActiveDate ?? ''));
        }
        return [...groups.entries()].filter(([, list]) => list.length > 0);
    }, [individualStudents]);

    const today = getTodayKey();
    const activeToday = individualStudents.filter(s => s.lastActiveDate === today).length;

    // Weekly summary (last 7 days)
    const weeklyStats = useMemo(() => {
        if (individualStudents.length === 0) return null;
        const weekDates = new Set(
            Array.from({ length: 7 }, (_, i) => getDateKeyOffset(-i))
        );
        let activeCount = 0;
        let totalMinutes = 0;
        let totalSessions = 0;
        for (const s of individualStudents) {
            const weekSessions = s.sessions.filter(sess => weekDates.has(sess.date));
            if (weekSessions.length > 0) activeCount++;
            totalSessions += weekSessions.length;
            totalMinutes += weekSessions.reduce((sum, sess) => sum + sess.totalSeconds, 0);
        }
        totalMinutes = Math.floor(totalMinutes / 60);
        const rate = individualStudents.length > 0
            ? Math.round((activeCount / individualStudents.length) * 100) : 0;
        return { activeCount, totalMinutes, totalSessions, rate };
    }, [individualStudents]);

    // Auto-expand the first non-empty class on load
    useEffect(() => {
        if (!loading && studentsByClass.length > 0 && expandedClass === null) {
            setExpandedClass(studentsByClass[0][0]);
        }
    }, [loading, studentsByClass, expandedClass]);

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
            {!loading && individualStudents.length > 0 && (
                <>
                    <div style={{
                        display: 'flex',
                        gap: 10,
                        padding: '0 20px',
                        marginBottom: 12,
                    }}>
                        <StatCard
                            icon={<Users size={16} color="#6C5CE7" />}
                            value={individualStudents.length}
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
                                    sub={`${weeklyStats.activeCount}/${individualStudents.length}人`}
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
                                    value={`${individualStudents.length > 0 ? Math.round(individualStudents.reduce((s, st) => s + st.streak, 0) / individualStudents.length * 10) / 10 : 0}`}
                                    sub="日"
                                    color="#E17055"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Class → Student hierarchy */}
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
                ) : individualStudents.length === 0 ? (
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
                    studentsByClass.map(([classLevel, classStudents]) => (
                        <ClassSection
                            key={classLevel}
                            classLevel={classLevel}
                            students={classStudents}
                            expanded={expandedClass === classLevel}
                            onToggle={() => setExpandedClass(
                                expandedClass === classLevel ? null : classLevel
                            )}
                            expandedStudent={expandedStudent}
                            onToggleStudent={(id) => setExpandedStudent(
                                expandedStudent === id ? null : id
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

// ─── ClassSection ────────────────────────────────────

const ClassSection: React.FC<{
    classLevel: string;
    students: IndividualStudent[];
    expanded: boolean;
    onToggle: () => void;
    expandedStudent: string | null;
    onToggleStudent: (id: string) => void;
}> = ({ classLevel, students, expanded, onToggle, expandedStudent, onToggleStudent }) => {
    const emoji = CLASS_EMOJI[classLevel] ?? '🎵';
    const activeToday = students.filter(s => s.lastActiveDate === getTodayKey()).length;

    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            {/* Class header */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#2D3436',
                    flex: 1,
                }}>
                    {classLevel}
                </span>
                <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: '#8395A7',
                    marginRight: 4,
                }}>
                    {students.length}人
                </span>
                {activeToday > 0 && (
                    <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#E17055',
                        background: '#FFF3E0',
                        padding: '2px 6px',
                        borderRadius: 10,
                    }}>
                        🔥{activeToday}
                    </span>
                )}
                <ChevronDown
                    size={16}
                    color="#B2BEC3"
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                    }}
                />
            </button>

            {/* Student list */}
            {expanded && (
                <div style={{
                    borderTop: '1px solid #F0F3F5',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {students.map((student, idx) => (
                        <StudentCard
                            key={student.memberId}
                            student={student}
                            expanded={expandedStudent === student.memberId}
                            onToggle={() => onToggleStudent(student.memberId)}
                            showBorder={idx > 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── StudentCard ─────────────────────────────────────

const StudentCard: React.FC<{
    student: IndividualStudent;
    expanded: boolean;
    onToggle: () => void;
    showBorder: boolean;
}> = ({ student, expanded, onToggle, showBorder }) => {
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

    // Recent sessions for expanded view (grouped by date)
    const recentByDate = new Map<string, number>();
    for (const s of student.sessions.slice(0, 30)) {
        recentByDate.set(s.date, (recentByDate.get(s.date) ?? 0) + s.totalSeconds);
    }
    const recentDates = [...recentByDate.entries()].slice(0, 7);

    return (
        <div style={{
            borderTop: showBorder ? '1px solid #F0F3F5' : 'none',
        }}>
            {/* Main row */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '12px 16px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                {/* Name + stats row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                }}>
                    <span style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                        flex: 1,
                        minWidth: 0,
                    }}>
                        {student.name}
                    </span>

                    {/* Streak badge */}
                    {student.streak > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 7px',
                            borderRadius: 20,
                            background: '#FFF3E0',
                            flexShrink: 0,
                        }}>
                            <Flame size={12} color="#E17055" />
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
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
                        fontSize: 11,
                        color: '#8395A7',
                        flexShrink: 0,
                    }}>
                        計{student.totalSessions}回
                    </div>

                    <ChevronDown
                        size={14}
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
                    padding: '10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    background: '#FAFBFC',
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
