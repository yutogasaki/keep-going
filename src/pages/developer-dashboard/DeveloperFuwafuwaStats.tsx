import React from 'react';
import { Layers3, Sparkles, Trophy, Users } from 'lucide-react';
import type { AdminFuwafuwaTypeStatsSummary } from '../../lib/developer';

interface DeveloperFuwafuwaStatsProps {
    stats: AdminFuwafuwaTypeStatsSummary;
}

export const DeveloperFuwafuwaStats: React.FC<DeveloperFuwafuwaStatsProps> = ({ stats }) => {
    const topTypeLabel = formatTypeLabel(stats.topType);
    const topTypeRatio = `${Math.round(stats.topTypeShare * 100)}%`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
            }}>
                <StatCard label="追跡中メンバー" value={`${stats.totalMembers}人`} icon={<Users size={16} />} />
                <StatCard label="使われているタイプ" value={`${stats.typesInUse}種`} icon={<Layers3 size={16} />} color="#3b82f6" />
                <StatCard label="最多タイプ" value={topTypeLabel} icon={<Trophy size={16} />} color="#f59e0b" />
                <StatCard label="最多シェア" value={topTypeRatio} icon={<Sparkles size={16} />} color="#8b5cf6" />
            </div>

            <div style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: '14px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                color: '#475569',
                fontSize: 12,
                lineHeight: 1.6,
            }}>
                現在の family_members.fuwafuwa_type を全メンバー分集計しています。
                {stats.unassignedMembers > 0
                    ? ` 未設定は ${stats.unassignedMembers}人です。`
                    : ' 未設定メンバーはありません。'}
            </div>

            {stats.stats.length === 0 ? (
                <div style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: '24px 16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    color: '#64748B',
                    fontSize: 13,
                }}>
                    集計できるメンバーがまだありません。
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: 12,
                }}>
                    {stats.stats.map((entry) => {
                        const widthPercent = Math.max(entry.share * 100, entry.memberCount > 0 ? 6 : 0);

                        return (
                            <div
                                key={entry.type === null ? 'unassigned' : entry.type}
                                style={{
                                    background: '#FFFFFF',
                                    borderRadius: 16,
                                    padding: '14px 16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 10,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                                            {formatTypeLabel(entry.type)}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                                            {entry.accountCount}アカウント / {entry.memberCount}人
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB' }}>
                                        {Math.round(entry.share * 100)}%
                                    </div>
                                </div>

                                <div style={{
                                    width: '100%',
                                    height: 8,
                                    borderRadius: 999,
                                    background: '#E2E8F0',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        width: `${widthPercent}%`,
                                        height: '100%',
                                        borderRadius: 999,
                                        background: 'linear-gradient(90deg, #60A5FA 0%, #2563EB 100%)',
                                    }} />
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {entry.members.slice(0, 8).map((member) => (
                                        <span
                                            key={member.memberId}
                                            style={{
                                                background: '#EFF6FF',
                                                color: '#1D4ED8',
                                                borderRadius: 999,
                                                padding: '4px 8px',
                                                fontSize: 11,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {member.name}
                                        </span>
                                    ))}
                                    {entry.members.length > 8 && (
                                        <span style={{
                                            background: '#F1F5F9',
                                            color: '#475569',
                                            borderRadius: 999,
                                            padding: '4px 8px',
                                            fontSize: 11,
                                            fontWeight: 700,
                                        }}>
                                            +{entry.members.length - 8}人
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

function formatTypeLabel(type: number | null): string {
    if (type === null) {
        return '未設定';
    }

    return `タイプ ${type}`;
}

const StatCard: React.FC<{
    label: string;
    value: string;
    icon: React.ReactNode;
    color?: string;
}> = ({ label, value, icon, color = '#1a1a2e' }) => (
    <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color }}>{icon}</span>
            <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
    </div>
);
