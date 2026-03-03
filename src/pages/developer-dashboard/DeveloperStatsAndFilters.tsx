import React from 'react';
import { Activity, BarChart3, Pause, Users } from 'lucide-react';
import type { AdminAccountSummary } from '../../lib/developer';
import type { FilterType } from './types';

interface StatsSummary {
    totalAccounts: number;
    activeAccounts: number;
    totalMembers: number;
    suspendedAccounts: number;
    weekSessions: number;
}

interface DeveloperStatsAndFiltersProps {
    accounts: AdminAccountSummary[];
    stats: StatsSummary;
    filter: FilterType;
    filteredCount: number;
    onFilterChange: (filter: FilterType) => void;
}

export const DeveloperStatsAndFilters: React.FC<DeveloperStatsAndFiltersProps> = ({
    accounts,
    stats,
    filter,
    filteredCount,
    onFilterChange,
}) => {
    return (
        <>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 8,
                marginBottom: 16,
            }}>
                <StatCard label="総アカウント" value={stats.totalAccounts} icon={<Users size={16} />} />
                <StatCard label="アクティブ (30日)" value={stats.activeAccounts} icon={<Activity size={16} />} color="#22c55e" />
                <StatCard label="メンバー数" value={stats.totalMembers} icon={<BarChart3 size={16} />} color="#3b82f6" />
                <StatCard label="休止中" value={stats.suspendedAccounts} icon={<Pause size={16} />} color="#ef4444" />
            </div>

            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                今週のセッション: {stats.weekSessions}回
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                {([
                    ['all', `全て (${accounts.length})`],
                    ['inactive', '非アクティブ'],
                    ['multi', '複数メンバー'],
                    ['suspended', '休止中'],
                    ['temporary', 'テンポラリー候補'],
                ] as [FilterType, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => onFilterChange(key)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 16,
                            border: filter === key ? '2px solid #1a1a2e' : '1px solid #ddd',
                            background: filter === key ? '#1a1a2e' : '#fff',
                            color: filter === key ? '#fff' : '#333',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                {filteredCount}件表示
            </div>
        </>
    );
};

const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color?: string;
}> = ({ label, value, icon, color = '#1a1a2e' }) => (
    <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color }}>{icon}</span>
            <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
);
