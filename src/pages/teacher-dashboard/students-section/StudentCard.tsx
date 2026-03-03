import React from 'react';
import { Calendar, ChevronDown, Flame } from 'lucide-react';
import { ActivityHeatmap } from '../../../components/ActivityHeatmap';
import { UserAvatar } from '../../../components/UserAvatar';
import { getTodayKey, type SessionRecord } from '../../../lib/db';
import type { IndividualStudent } from '../types';
import { formatDateShort } from './formatDateShort';

interface StudentCardProps {
    student: IndividualStudent;
    expanded: boolean;
    onToggle: () => void;
    showBorder: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({
    student,
    expanded,
    onToggle,
    showBorder,
}) => {
    const heatmapSessions: SessionRecord[] = student.sessions.map((session) => ({
        id: session.id,
        date: session.date,
        startedAt: session.startedAt,
        totalSeconds: session.totalSeconds,
        exerciseIds: [],
        skippedIds: [],
        userIds: session.userIds,
    }));

    const recentByDate = new Map<string, number>();
    for (const session of student.sessions.slice(0, 30)) {
        recentByDate.set(session.date, (recentByDate.get(session.date) ?? 0) + session.totalSeconds);
    }
    const recentDates = [...recentByDate.entries()].slice(0, 7);

    return (
        <div style={{
            borderTop: showBorder ? '1px solid #F0F3F5' : 'none',
        }}>
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
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                }}>
                    <UserAvatar
                        avatarUrl={student.avatarUrl}
                        name={student.name}
                        size={28}
                    />
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

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: student.streak > 0 ? '#FFF3E0' : '#F0F3F5',
                        flexShrink: 0,
                    }}>
                        <Flame size={12} color={student.streak > 0 ? '#E17055' : '#B2BEC3'} />
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            fontWeight: 700,
                            color: student.streak > 0 ? '#E17055' : '#B2BEC3',
                        }}>
                            {student.streak}
                        </span>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        padding: '2px 7px',
                        borderRadius: 20,
                        background: student.lastActiveDate === getTodayKey() ? '#E8F8F0' : '#F0F3F5',
                        flexShrink: 0,
                    }}>
                        <Calendar size={11} color={student.lastActiveDate === getTodayKey() ? '#2BBAA0' : '#8395A7'} />
                        <span style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 11,
                            fontWeight: 600,
                            color: student.lastActiveDate === getTodayKey() ? '#2BBAA0' : '#8395A7',
                        }}>
                            {student.lastActiveDate
                                ? formatDateShort(student.lastActiveDate)
                                : '未使用'
                            }
                        </span>
                    </div>

                    <span style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#8395A7',
                        flexShrink: 0,
                    }}>
                        計{student.totalSessions}回
                    </span>

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

                <ActivityHeatmap sessions={heatmapSessions} daysToShow={14} />
            </button>

            {expanded && recentDates.length > 0 && (() => {
                const maxSec = Math.max(...recentDates.map(([, totalSeconds]) => totalSeconds));
                return (
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
                                <span style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 11,
                                    color: '#636E72',
                                    width: 36,
                                    flexShrink: 0,
                                }}>
                                    {formatDateShort(date)}
                                </span>
                                <div style={{
                                    flex: 1,
                                    height: 14,
                                    background: '#F0F3F5',
                                    borderRadius: 7,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${maxSec > 0 ? (totalSec / maxSec) * 100 : 0}%`,
                                        height: '100%',
                                        background: 'linear-gradient(90deg, #2BBAA0, #55E6C1)',
                                        borderRadius: 7,
                                        minWidth: 4,
                                    }} />
                                </div>
                                <span style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: '#2BBAA0',
                                    width: 32,
                                    textAlign: 'right',
                                    flexShrink: 0,
                                }}>
                                    {Math.floor(totalSec / 60)}分
                                </span>
                            </div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
};
