import React from 'react';
import { Calendar, Flame, Users } from 'lucide-react';
import type { IndividualStudent, WeeklyStats } from '../types';

interface StudentsOverviewCardsProps {
    individualStudents: IndividualStudent[];
    activeToday: number;
    activeYesterday: number;
    weeklyStats: WeeklyStats | null;
}

export const StudentsOverviewCards: React.FC<StudentsOverviewCardsProps> = ({
    individualStudents,
    activeToday,
    activeYesterday,
    weeklyStats,
}) => {
    if (individualStudents.length === 0) {
        return null;
    }

    const averageStreak = Math.round(
        (individualStudents.reduce((sum, student) => sum + student.streak, 0) / individualStudents.length) * 10
    ) / 10;

    return (
        <>
            <div className="wide-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
                <StatCard
                    icon={<Calendar size={16} color="#0984E3" />}
                    value={activeYesterday}
                    label="昨日の活動"
                    bgColor="#EAF4FF"
                />
                <StatCard
                    icon={<Flame size={16} color="#E17055" />}
                    value={`${averageStreak}日`}
                    label="平均ストリーク"
                    bgColor="#FFF3E0"
                />
            </div>

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
                            直近1週間のまとめ
                        </span>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
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
                    </div>
                </div>
            )}
        </>
    );
};

const StatCard: React.FC<{
    icon: React.ReactNode;
    value: number | string;
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
