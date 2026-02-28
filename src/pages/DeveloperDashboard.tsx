import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowLeft, RefreshCw, Loader2, ChevronDown, Users, Activity, Pause, Trash2, Play, BarChart3 } from 'lucide-react';
import {
    fetchAllAccountsForAdmin,
    suspendAccount,
    deleteAccountData,
    developerDeleteFamilyMember,
    computeStats,
    type AdminAccountSummary,
} from '../lib/developer';
import { calculateStreak } from '../lib/teacher';
import { formatDateKey } from '../lib/db';

interface DeveloperDashboardProps {
    onBack: () => void;
}

type FilterType = 'all' | 'inactive' | 'multi' | 'suspended' | 'temporary';

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ onBack }) => {
    const [accounts, setAccounts] = useState<AdminAccountSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ accountId: string; type: 'suspend' | 'unsuspend' | 'delete' } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllAccountsForAdmin();
            setAccounts(data);
        } catch (err) {
            console.warn('[developer] Failed to load accounts:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Date thresholds
    const thirtyDaysAgoStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return formatDateKey(d);
    }, []);

    const sevenDaysAgoStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return formatDateKey(d);
    }, []);

    // Filtered accounts
    const filteredAccounts = useMemo(() => {
        switch (filter) {
            case 'inactive':
                return accounts.filter(a => !a.lastActiveDate || a.lastActiveDate < thirtyDaysAgoStr);
            case 'multi':
                return accounts.filter(a => a.members.length > 1);
            case 'suspended':
                return accounts.filter(a => a.suspended);
            case 'temporary':
                return accounts.filter(a =>
                    a.streak === 0 && (!a.lastActiveDate || a.lastActiveDate < sevenDaysAgoStr)
                );
            default:
                return accounts;
        }
    }, [accounts, filter, thirtyDaysAgoStr, sevenDaysAgoStr]);

    const stats = useMemo(() => computeStats(accounts), [accounts]);

    // Actions
    const handleAction = useCallback(async () => {
        if (!confirmAction) return;
        setActionLoading(true);
        try {
            if (confirmAction.type === 'delete') {
                await deleteAccountData(confirmAction.accountId);
                setAccounts(prev => prev.filter(a => a.accountId !== confirmAction.accountId));
            } else {
                const newSuspended = confirmAction.type === 'suspend';
                await suspendAccount(confirmAction.accountId, newSuspended);
                setAccounts(prev => prev.map(a =>
                    a.accountId === confirmAction.accountId ? { ...a, suspended: newSuspended } : a
                ));
            }
        } catch (err) {
            console.error('[developer] Action failed:', err);
            alert('操作に失敗しました: ' + (err as Error).message);
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    }, [confirmAction]);

    const daysAgo = (dateStr: string | null) => {
        if (!dateStr) return '未使用';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 0) return '今日';
        if (diff === 1) return '昨日';
        return `${diff}日前`;
    };

    const formatDate = (isoStr: string | null) => {
        if (!isoStr) return '-';
        const d = new Date(isoStr);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: '#F8F9FA', overflowY: 'auto',
        }}>
            {/* Header */}
            <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                background: '#1a1a2e', color: '#fff',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                <button onClick={onBack} style={{
                    background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
                    padding: 4, display: 'flex',
                }}>
                    <ArrowLeft size={20} />
                </button>
                <span style={{ fontWeight: 700, fontSize: 16 }}>Developer Dashboard</span>
                <div style={{ flex: 1 }} />
                <button onClick={load} style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                    borderRadius: 6, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                    <Loader2 size={28} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                </div>
            ) : (
                <div style={{ padding: '12px 16px 100px' }}>
                    {/* Stats */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: 8, marginBottom: 16,
                    }}>
                        <StatCard label="総アカウント" value={stats.totalAccounts} icon={<Users size={16} />} />
                        <StatCard label="アクティブ (30日)" value={stats.activeAccounts} icon={<Activity size={16} />} color="#22c55e" />
                        <StatCard label="メンバー数" value={stats.totalMembers} icon={<BarChart3 size={16} />} color="#3b82f6" />
                        <StatCard label="休止中" value={stats.suspendedAccounts} icon={<Pause size={16} />} color="#ef4444" />
                    </div>

                    <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        今週のセッション: {stats.weekSessions}回
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
                        {([
                            ['all', `全て (${accounts.length})`],
                            ['inactive', `非アクティブ`],
                            ['multi', `複数メンバー`],
                            ['suspended', `休止中`],
                            ['temporary', `テンポラリー候補`],
                        ] as [FilterType, string][]).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                style={{
                                    padding: '6px 12px', borderRadius: 16,
                                    border: filter === key ? '2px solid #1a1a2e' : '1px solid #ddd',
                                    background: filter === key ? '#1a1a2e' : '#fff',
                                    color: filter === key ? '#fff' : '#333',
                                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                        {filteredAccounts.length}件表示
                    </div>

                    {/* Account List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredAccounts.map(account => (
                            <AccountCard
                                key={account.accountId}
                                account={account}
                                expanded={expandedAccount === account.accountId}
                                onToggle={() => setExpandedAccount(
                                    expandedAccount === account.accountId ? null : account.accountId
                                )}
                                daysAgo={daysAgo}
                                formatDate={formatDate}
                                onSuspend={() => setConfirmAction({
                                    accountId: account.accountId,
                                    type: account.suspended ? 'unsuspend' : 'suspend',
                                })}
                                onDelete={() => setConfirmAction({
                                    accountId: account.accountId,
                                    type: 'delete',
                                })}
                                onDeleteMember={async (memberId) => {
                                    if (!window.confirm('このメンバーを削除しますか？')) return;
                                    try {
                                        await developerDeleteFamilyMember(memberId);
                                        load();
                                    } catch (err) {
                                        alert('削除に失敗: ' + (err as Error).message);
                                    }
                                }}
                                thirtyDaysAgoStr={thirtyDaysAgoStr}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmAction && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 2000,
                    background: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: 20,
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: 24,
                        maxWidth: 340, width: '100%',
                    }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
                            {confirmAction.type === 'delete' ? 'アカウントデータ削除'
                                : confirmAction.type === 'suspend' ? 'アカウント休止'
                                    : 'アカウント休止解除'}
                        </h3>
                        <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px' }}>
                            {confirmAction.type === 'delete'
                                ? 'このアカウントの全データ（メンバー・セッション・メニュー等）を完全に削除します。この操作は取り消せません。'
                                : confirmAction.type === 'suspend'
                                    ? '休止するとみんなのメニューや先生ダッシュボードに表示されなくなります。'
                                    : '休止を解除すると、再びみんなのメニューや先生ダッシュボードに表示されます。'}
                        </p>
                        <p style={{ fontSize: 11, color: '#999', margin: '0 0 16px', wordBreak: 'break-all' }}>
                            ID: {confirmAction.accountId.slice(0, 8)}...
                        </p>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => setConfirmAction(null)}
                                disabled={actionLoading}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 10,
                                    border: '1px solid #ddd', background: '#fff',
                                    fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={actionLoading}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                                    background: confirmAction.type === 'delete' ? '#ef4444'
                                        : confirmAction.type === 'suspend' ? '#f59e0b' : '#22c55e',
                                    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                }}
                            >
                                {actionLoading ? '処理中...'
                                    : confirmAction.type === 'delete' ? '削除する'
                                        : confirmAction.type === 'suspend' ? '休止する'
                                            : '解除する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

// ─── StatCard ────────────────────────────────────────

const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ReactNode;
    color?: string;
}> = ({ label, value, icon, color = '#1a1a2e' }) => (
    <div style={{
        background: '#fff', borderRadius: 12, padding: '12px 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color }}>{icon}</span>
            <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
    </div>
);

// ─── AccountCard ─────────────────────────────────────

const AccountCard: React.FC<{
    account: AdminAccountSummary;
    expanded: boolean;
    onToggle: () => void;
    daysAgo: (d: string | null) => string;
    formatDate: (d: string | null) => string;
    onSuspend: () => void;
    onDelete: () => void;
    onDeleteMember: (memberId: string) => void;
    thirtyDaysAgoStr: string;
}> = ({ account, expanded, onToggle, daysAgo, formatDate, onSuspend, onDelete, onDeleteMember, thirtyDaysAgoStr }) => {
    const isInactive = !account.lastActiveDate || account.lastActiveDate < thirtyDaysAgoStr;

    return (
        <div style={{
            background: '#fff', borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: account.suspended ? '2px solid #f59e0b' : 'none',
            opacity: account.suspended ? 0.8 : 1,
        }}>
            {/* Summary row */}
            <div
                onClick={onToggle}
                style={{
                    padding: '12px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                            {account.members.map(m => m.name).join(', ')}
                        </span>
                        {account.members.length > 1 && (
                            <span style={{
                                background: '#3b82f6', color: '#fff',
                                padding: '1px 6px', borderRadius: 8,
                                fontSize: 10, fontWeight: 700,
                            }}>
                                {account.members.length}人
                            </span>
                        )}
                        {account.suspended && (
                            <span style={{
                                background: '#f59e0b', color: '#fff',
                                padding: '1px 6px', borderRadius: 8,
                                fontSize: 10, fontWeight: 700,
                            }}>
                                休止中
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span>{account.members.map(m => m.classLevel).join('/')}</span>
                        <span>{account.totalSessions}回</span>
                        <span style={{ color: isInactive ? '#ef4444' : '#22c55e' }}>
                            {daysAgo(account.lastActiveDate)}
                        </span>
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        color: '#999', flexShrink: 0,
                        transform: expanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                />
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div style={{
                    padding: '0 14px 14px',
                    borderTop: '1px solid #f0f0f0',
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10, fontSize: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888' }}>アカウントID</span>
                            <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{account.accountId.slice(0, 12)}...</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888' }}>登録日</span>
                            <span>{formatDate(account.registeredAt)}</span>
                        </div>
                        <div>
                            <span style={{ color: '#888' }}>メンバー</span>
                            <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {(() => {
                                    const memberIds = new Set(account.members.map(mm => mm.id));
                                    const isSingleMember = account.members.length === 1;
                                    return account.members.map(m => {
                                    const memberSessions = account.sessions.filter(s => {
                                        if (s.userIds.length === 0) return true;
                                        if (s.userIds.includes(m.id)) return true;
                                        if (isSingleMember) return true;
                                        const hasAnyMatch = s.userIds.some(id => memberIds.has(id));
                                        return !hasAnyMatch;
                                    });
                                    const memberLastActive = memberSessions.length > 0 ? memberSessions[0].date : null;
                                    const memberStreak = calculateStreak(memberSessions);
                                    return (
                                        <div key={m.id} style={{
                                            padding: '6px 8px', background: '#f8f8f8', borderRadius: 8,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{m.name} ({m.classLevel})</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteMember(m.id); }}
                                                    style={{
                                                        background: 'none', border: 'none', cursor: 'pointer',
                                                        color: '#ccc', padding: 2, display: 'flex',
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 10, color: '#888' }}>
                                                <span>🔥 {memberStreak}日</span>
                                                <span>最終: {memberLastActive ? daysAgo(memberLastActive) : '未使用'}</span>
                                                <span>{memberSessions.length}回</span>
                                            </div>
                                        </div>
                                    );
                                });
                                    })()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#888' }}>ストリーク（アカウント）</span>
                            <span>{account.streak}日</span>
                        </div>
                    </div>

                    {/* Recent sessions */}
                    {account.sessions.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>直近セッション</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {account.sessions.slice(0, 10).map(s => (
                                    <div key={s.id} style={{
                                        fontSize: 11, display: 'flex', gap: 8,
                                        padding: '3px 0', borderBottom: '1px solid #f8f8f8',
                                    }}>
                                        <span style={{ color: '#888' }}>{s.date}</span>
                                        <span>{Math.round(s.totalSeconds / 60)}分</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onSuspend(); }}
                            style={{
                                flex: 1, padding: '8px', borderRadius: 8,
                                border: 'none', cursor: 'pointer',
                                background: account.suspended ? '#22c55e' : '#f59e0b',
                                color: '#fff', fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                        >
                            {account.suspended ? <><Play size={12} />解除</> : <><Pause size={12} />休止</>}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            style={{
                                padding: '8px 14px', borderRadius: 8,
                                border: 'none', cursor: 'pointer',
                                background: '#fee2e2', color: '#ef4444',
                                fontSize: 12, fontWeight: 600,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            }}
                        >
                            <Trash2 size={12} />アカウント削除
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
