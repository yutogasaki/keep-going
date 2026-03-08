import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
    fetchAllAccountsForAdmin,
    suspendAccount,
    deleteAccountData,
    developerDeleteFamilyMember,
    computeStats,
    type AdminAccountSummary,
} from '../lib/developer';
import { AccountCard } from './developer-dashboard/AccountCard';
import { ConfirmActionDialog } from './developer-dashboard/ConfirmActionDialog';
import { DeveloperHeader } from './developer-dashboard/DeveloperHeader';
import { DeveloperStatsAndFilters } from './developer-dashboard/DeveloperStatsAndFilters';
import {
    analyzeAccount,
    filterAccountsByType,
    INACTIVE_DAYS,
    NEW_ACCOUNT_GRACE_DAYS,
    SUSPEND_CANDIDATE_DAYS,
} from './developer-dashboard/accountSegmentation';
import { DeveloperDebugPanel } from './settings/developer-debug/DeveloperDebugPanel';
import type { ConfirmAction, FilterType } from './developer-dashboard/types';

type DeveloperTab = 'accounts' | 'debug';

interface DeveloperDashboardProps {
    onBack: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ onBack }) => {
    const [accounts, setAccounts] = useState<AdminAccountSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [tab, setTab] = useState<DeveloperTab>('accounts');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await fetchAllAccountsForAdmin();
            setAccounts(data);
        } catch (error) {
            console.warn('[developer] Failed to load accounts:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const filteredAccounts = useMemo(() => {
        return filterAccountsByType(accounts, filter);
    }, [accounts, filter]);

    const stats = useMemo(() => computeStats(accounts), [accounts]);

    const handleAction = useCallback(async () => {
        if (!confirmAction) {
            return;
        }

        setActionLoading(true);

        try {
            if (confirmAction.type === 'delete') {
                await deleteAccountData(confirmAction.accountId);
                setAccounts((previous) => previous.filter((account) => account.accountId !== confirmAction.accountId));
            } else {
                const newSuspended = confirmAction.type === 'suspend';
                await suspendAccount(confirmAction.accountId, newSuspended);
                setAccounts((previous) =>
                    previous.map((account) =>
                        account.accountId === confirmAction.accountId
                            ? { ...account, suspended: newSuspended }
                            : account,
                    ),
                );
            }
        } catch (error) {
            console.error('[developer] Action failed:', error);
            alert('操作に失敗しました: ' + (error as Error).message);
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    }, [confirmAction]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: '#F8F9FA',
            overflowY: 'auto',
        }}>
            <DeveloperHeader onBack={onBack} onRefresh={load} />

            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                gap: 0,
                background: '#16213e',
                padding: '0 16px',
            }}>
                {(['accounts', 'debug'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            border: 'none',
                            background: 'none',
                            color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            borderBottom: tab === t ? '2px solid #fff' : '2px solid transparent',
                            transition: 'color 0.2s, border-color 0.2s',
                        }}
                    >
                        {t === 'accounts' ? 'Accounts' : 'Debug'}
                    </button>
                ))}
            </div>

            {tab === 'accounts' ? (
                <>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
                            <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : (
                        <div style={{ padding: '12px 16px 100px' }}>
                            <DeveloperStatsAndFilters
                                accounts={accounts}
                                stats={stats}
                                filter={filter}
                                filteredCount={filteredAccounts.length}
                                onFilterChange={setFilter}
                                inactivityDays={INACTIVE_DAYS}
                                graceDays={NEW_ACCOUNT_GRACE_DAYS}
                                suspendCandidateDays={SUSPEND_CANDIDATE_DAYS}
                            />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {filteredAccounts.map((account) => (
                                    <AccountCard
                                        key={account.accountId}
                                        account={account}
                                        analysis={analyzeAccount(account)}
                                        expanded={expandedAccount === account.accountId}
                                        onToggle={() => {
                                            setExpandedAccount(expandedAccount === account.accountId ? null : account.accountId);
                                        }}
                                        daysAgo={daysAgo}
                                        formatDate={formatDate}
                                        onSuspend={() => {
                                            setConfirmAction({
                                                accountId: account.accountId,
                                                type: account.suspended ? 'unsuspend' : 'suspend',
                                            });
                                        }}
                                        onDelete={() => {
                                            setConfirmAction({
                                                accountId: account.accountId,
                                                type: 'delete',
                                            });
                                        }}
                                        onDeleteMember={async (memberId) => {
                                            if (!window.confirm('このメンバーを削除しますか？')) {
                                                return;
                                            }
                                            try {
                                                await developerDeleteFamilyMember(memberId);
                                                load();
                                            } catch (error) {
                                                alert('削除に失敗: ' + (error as Error).message);
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ padding: '12px 16px 100px' }}>
                    <DeveloperDebugPanel />
                </div>
            )}

            <ConfirmActionDialog
                confirmAction={confirmAction}
                actionLoading={actionLoading}
                onCancel={() => setConfirmAction(null)}
                onConfirm={handleAction}
            />

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

function daysAgo(dateStr: string | null): string {
    if (!dateStr) {
        return '未使用';
    }

    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) {
        return '今日';
    }
    if (diff === 1) {
        return '昨日';
    }
    return `${diff}日前`;
}

function formatDate(isoStr: string | null): string {
    if (!isoStr) {
        return '-';
    }
    const date = new Date(isoStr);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}
