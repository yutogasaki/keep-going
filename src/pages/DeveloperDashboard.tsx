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
import { DeveloperBulkActions } from './developer-dashboard/DeveloperBulkActions';
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
import { ScreenScaffold } from '../components/ScreenScaffold';
import { SCREEN_PADDING_X } from '../lib/styles';

type DeveloperTab = 'accounts' | 'debug';

interface DeveloperDashboardProps {
    onBack: () => void;
}

export const DeveloperDashboard: React.FC<DeveloperDashboardProps> = ({ onBack }) => {
    const [accounts, setAccounts] = useState<AdminAccountSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
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

    const accountAnalyses = useMemo(
        () => new Map(accounts.map((account) => [account.accountId, analyzeAccount(account)])),
        [accounts],
    );

    const filteredAccounts = useMemo(() => {
        return filterAccountsByType(accounts, filter);
    }, [accounts, filter]);
    const filteredAccountIdSet = useMemo(
        () => new Set(filteredAccounts.map((account) => account.accountId)),
        [filteredAccounts],
    );
    const selectedAccountIdSet = useMemo(
        () => new Set(selectedAccountIds),
        [selectedAccountIds],
    );

    const stats = useMemo(() => computeStats(accounts), [accounts]);

    useEffect(() => {
        setSelectedAccountIds((current) => current.filter((accountId) => filteredAccountIdSet.has(accountId)));
    }, [filteredAccountIdSet]);

    const candidateSummary = useMemo(() => {
        const suspendAccountIds: string[] = [];
        const suspendedDeleteAccountIds: string[] = [];
        const cleanupMemberIds: string[] = [];
        let unusedCleanupAccountCount = 0;
        const cleanupAccountIds = new Set<string>();

        for (const account of accounts) {
            const analysis = accountAnalyses.get(account.accountId);
            if (!analysis) continue;

            if (!account.suspended && analysis.hasUnusedCleanupRisk) {
                unusedCleanupAccountCount += 1;
            }

            if (analysis.isSuspendCandidate) {
                suspendAccountIds.push(account.accountId);
            }

            if (account.suspended && analysis.suspendReasons.length > 0) {
                suspendedDeleteAccountIds.push(account.accountId);
            }

            for (const signal of analysis.memberSignals) {
                if (!signal.isCleanupCandidate) {
                    continue;
                }
                cleanupMemberIds.push(signal.memberId);
                cleanupAccountIds.add(account.accountId);
            }
        }

        return {
            suspendAccountIds,
            suspendedDeleteAccountIds,
            cleanupMemberIds,
            cleanupAccountCount: cleanupAccountIds.size,
            cleanupMemberCount: cleanupMemberIds.length,
            unusedCleanupAccountCount,
        };
    }, [accounts, accountAnalyses]);

    const selectionSummary = useMemo(() => {
        const selectedAccounts = filteredAccounts.filter((account) => selectedAccountIdSet.has(account.accountId));
        const suspendableAccountIds = selectedAccounts
            .filter((account) => !account.suspended)
            .map((account) => account.accountId);
        const unsuspendableAccountIds = selectedAccounts
            .filter((account) => account.suspended)
            .map((account) => account.accountId);

        return {
            selectedCount: selectedAccounts.length,
            suspendableAccountIds,
            unsuspendableAccountIds,
        };
    }, [filteredAccounts, selectedAccountIdSet]);

    const getAccountLabel = useCallback((account: AdminAccountSummary) => {
        return `${account.members.map((member) => member.name).join(', ')} / ${account.accountId.slice(0, 8)}...`;
    }, []);

    const getMemberLabel = useCallback((memberId: string) => {
        for (const account of accounts) {
            const member = account.members.find((item) => item.id === memberId);
            if (!member) continue;
            return `${member.name} / ${getAccountLabel(account)}`;
        }
        return memberId;
    }, [accounts, getAccountLabel]);

    const handleAction = useCallback(async () => {
        if (!confirmAction) {
            return;
        }

        setActionLoading(true);

        try {
            let failureMessage: string | null = null;

            const settleBulk = async (tasks: Array<Promise<void>>) => {
                const results = await Promise.allSettled(tasks);
                const failed = results.filter((result) => result.status === 'rejected');
                if (failed.length > 0) {
                    const firstReason = failed[0];
                    const firstMessage = firstReason.status === 'rejected' && firstReason.reason instanceof Error
                        ? firstReason.reason.message
                        : '処理に失敗しました';
                    failureMessage = `${results.length - failed.length}件成功 / ${failed.length}件失敗: ${firstMessage}`;
                }
            };

            switch (confirmAction.type) {
                case 'delete':
                    if (!confirmAction.accountId) {
                        return;
                    }
                    await deleteAccountData(confirmAction.accountId);
                    break;
                case 'suspend':
                case 'unsuspend':
                    if (!confirmAction.accountId) {
                        return;
                    }
                    await suspendAccount(confirmAction.accountId, confirmAction.type === 'suspend');
                    break;
                case 'delete_member':
                    if (!confirmAction.memberId) {
                        return;
                    }
                    await developerDeleteFamilyMember(confirmAction.memberId);
                    break;
                case 'bulk_suspend':
                    await settleBulk((confirmAction.accountIds ?? []).map((accountId) => suspendAccount(accountId, true)));
                    break;
                case 'bulk_unsuspend':
                    await settleBulk((confirmAction.accountIds ?? []).map((accountId) => suspendAccount(accountId, false)));
                    break;
                case 'bulk_delete':
                    await settleBulk((confirmAction.accountIds ?? []).map((accountId) => deleteAccountData(accountId)));
                    break;
                case 'bulk_delete_members':
                    await settleBulk((confirmAction.memberIds ?? []).map((memberId) => developerDeleteFamilyMember(memberId)));
                    break;
                default:
                    return;
            }

            await load();

            if (confirmAction.type === 'bulk_suspend' || confirmAction.type === 'bulk_unsuspend' || confirmAction.type === 'bulk_delete') {
                setSelectedAccountIds([]);
            }

            if (failureMessage) {
                throw new Error(failureMessage);
            }
        } catch (error) {
            console.error('[developer] Action failed:', error);
            alert('操作に失敗しました: ' + (error as Error).message);
        } finally {
            setActionLoading(false);
            setConfirmAction(null);
        }
    }, [confirmAction, load]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: '#F8F9FA',
        }}>
            <ScreenScaffold
                background="#F8F9FA"
                header={<DeveloperHeader onBack={onBack} onRefresh={load} loading={loading} />}
            >
                <div style={{
                    display: 'flex',
                    gap: 0,
                    background: '#16213e',
                    padding: `0 ${SCREEN_PADDING_X}px`,
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
                            <div style={{ padding: `12px ${SCREEN_PADDING_X}px 0` }}>
                                <DeveloperStatsAndFilters
                                    accounts={accounts}
                                    stats={stats}
                                    filter={filter}
                                    filteredCount={filteredAccounts.length}
                                    onFilterChange={setFilter}
                                    inactivityDays={INACTIVE_DAYS}
                                    suspendDays={SUSPEND_CANDIDATE_DAYS}
                                    graceDays={NEW_ACCOUNT_GRACE_DAYS}
                                />
                                <DeveloperBulkActions
                                    suspendCandidateCount={candidateSummary.suspendAccountIds.length}
                                    suspendedDeleteCandidateCount={candidateSummary.suspendedDeleteAccountIds.length}
                                    cleanupMemberCount={candidateSummary.cleanupMemberCount}
                                    cleanupAccountCount={candidateSummary.cleanupAccountCount}
                                    visibleAccountCount={filteredAccounts.length}
                                    selectedCount={selectionSummary.selectedCount}
                                    selectedSuspendCount={selectionSummary.suspendableAccountIds.length}
                                    selectedUnsuspendCount={selectionSummary.unsuspendableAccountIds.length}
                                    actionLoading={actionLoading}
                                    onBulkSuspend={() => {
                                        setConfirmAction({
                                            type: 'bulk_suspend',
                                            title: '休止候補をまとめて休止',
                                            accountIds: candidateSummary.suspendAccountIds,
                                            subjectLabel: `休止候補 ${candidateSummary.suspendAccountIds.length}件 / 未使用整理候補 ${candidateSummary.unusedCleanupAccountCount}件`,
                                            description: '長期未利用と未使用整理候補をまとめて休止します。メンバー削除は行いません。',
                                        });
                                    }}
                                    onBulkSuspendSelected={() => {
                                        setConfirmAction({
                                            type: 'bulk_suspend',
                                            title: '選択中をまとめて休止',
                                            accountIds: selectionSummary.suspendableAccountIds,
                                            subjectLabel: `選択中 ${selectionSummary.selectedCount}件 / 休止 ${selectionSummary.suspendableAccountIds.length}件`,
                                            description: '選択した未休止アカウントをまとめて休止します。',
                                        });
                                    }}
                                    onBulkUnsuspendSelected={() => {
                                        setConfirmAction({
                                            type: 'bulk_unsuspend',
                                            title: '選択中をまとめて復活',
                                            confirmLabel: '復活する',
                                            accountIds: selectionSummary.unsuspendableAccountIds,
                                            subjectLabel: `選択中 ${selectionSummary.selectedCount}件 / 復活 ${selectionSummary.unsuspendableAccountIds.length}件`,
                                            description: '選択した休止中アカウントをまとめて復活します。',
                                        });
                                    }}
                                    onBulkDeleteAccounts={() => {
                                        setConfirmAction({
                                            type: 'bulk_delete',
                                            accountIds: candidateSummary.suspendedDeleteAccountIds,
                                            subjectLabel: `休止済み候補 ${candidateSummary.suspendedDeleteAccountIds.length}件`,
                                            description: '休止済みの候補アカウントをまとめて完全削除します。メンバー・セッションも消えます。',
                                        });
                                    }}
                                    onBulkDeleteMembers={() => {
                                        setConfirmAction({
                                            type: 'bulk_delete_members',
                                            memberIds: candidateSummary.cleanupMemberIds,
                                            subjectLabel: `整理候補ユーザー ${candidateSummary.cleanupMemberCount}人 / 対象アカウント ${candidateSummary.cleanupAccountCount}件`,
                                            description: '整理候補のメンバーだけをまとめて削除します。アカウント自体は削除しません。',
                                        });
                                    }}
                                    onSelectAllVisible={() => {
                                        setSelectedAccountIds(filteredAccounts.map((account) => account.accountId));
                                    }}
                                    onClearSelection={() => {
                                        setSelectedAccountIds([]);
                                    }}
                                />

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {filteredAccounts.map((account) => (
                                        <AccountCard
                                            key={account.accountId}
                                            account={account}
                                            analysis={accountAnalyses.get(account.accountId) ?? analyzeAccount(account)}
                                            selected={selectedAccountIdSet.has(account.accountId)}
                                            expanded={expandedAccount === account.accountId}
                                            onToggleSelected={() => {
                                                setSelectedAccountIds((current) => (
                                                    current.includes(account.accountId)
                                                        ? current.filter((accountId) => accountId !== account.accountId)
                                                        : [...current, account.accountId]
                                                ));
                                            }}
                                            onToggle={() => {
                                                setExpandedAccount(expandedAccount === account.accountId ? null : account.accountId);
                                            }}
                                            daysAgo={daysAgo}
                                            formatDate={formatDate}
                                            onSuspend={() => {
                                                setConfirmAction({
                                                    subjectLabel: getAccountLabel(account),
                                                    description: (accountAnalyses.get(account.accountId)?.suspendReasonLabels?.length ?? 0) > 0
                                                        ? `理由: ${(accountAnalyses.get(account.accountId)?.suspendReasonLabels ?? []).join(' / ')}`
                                                        : undefined,
                                                    accountId: account.accountId,
                                                    type: account.suspended ? 'unsuspend' : 'suspend',
                                                });
                                            }}
                                            onDelete={() => {
                                                setConfirmAction({
                                                    subjectLabel: getAccountLabel(account),
                                                    accountId: account.accountId,
                                                    type: 'delete',
                                                });
                                            }}
                                            onDeleteMember={(memberId) => {
                                                setConfirmAction({
                                                    type: 'delete_member',
                                                    memberId,
                                                    subjectLabel: getMemberLabel(memberId),
                                                    description: 'この操作はメンバーだけを削除します。アカウントや他のメンバーは残ります。',
                                                });
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ padding: `12px ${SCREEN_PADDING_X}px 0` }}>
                        <DeveloperDebugPanel />
                    </div>
                )}
            </ScreenScaffold>

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
