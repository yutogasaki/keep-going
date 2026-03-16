import React from 'react';
import { Pause, Play, Trash2, UserMinus } from 'lucide-react';

interface DeveloperBulkActionsProps {
    suspendCandidateCount: number;
    suspendedDeleteCandidateCount: number;
    cleanupMemberCount: number;
    cleanupAccountCount: number;
    visibleAccountCount: number;
    selectedCount: number;
    selectedSuspendCount: number;
    selectedUnsuspendCount: number;
    actionLoading: boolean;
    onBulkSuspend: () => void;
    onBulkSuspendSelected: () => void;
    onBulkUnsuspendSelected: () => void;
    onBulkDeleteAccounts: () => void;
    onBulkDeleteMembers: () => void;
    onSelectAllVisible: () => void;
    onClearSelection: () => void;
}

export const DeveloperBulkActions: React.FC<DeveloperBulkActionsProps> = ({
    suspendCandidateCount,
    suspendedDeleteCandidateCount,
    cleanupMemberCount,
    cleanupAccountCount,
    visibleAccountCount,
    selectedCount,
    selectedSuspendCount,
    selectedUnsuspendCount,
    actionLoading,
    onBulkSuspend,
    onBulkSuspendSelected,
    onBulkUnsuspendSelected,
    onBulkDeleteAccounts,
    onBulkDeleteMembers,
    onSelectAllVisible,
    onClearSelection,
}) => {
    return (
        <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            display: 'grid',
            gap: 12,
            marginBottom: 16,
        }}>
            <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>
                    整理しやすい候補
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <SummaryPill label={`休止候補 ${suspendCandidateCount}件`} tone="orange" />
                    <SummaryPill label={`整理候補ユーザー ${cleanupMemberCount}人`} tone="blue" />
                    <SummaryPill label={`対象アカウント ${cleanupAccountCount}件`} tone="slate" />
                    <SummaryPill label={`休止済み削除候補 ${suspendedDeleteCandidateCount}件`} tone="red" />
                </div>
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
                    整理候補ユーザーの削除はメンバーだけを消して、アカウント自体は残します。
                    休止済み削除候補はアカウント全体の完全削除です。
                </div>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
                <ActionButton
                    label={suspendCandidateCount > 0 ? `休止候補をまとめて休止 (${suspendCandidateCount})` : '休止候補はありません'}
                    icon={<Pause size={14} />}
                    background="#F59E0B"
                    disabled={suspendCandidateCount === 0 || actionLoading}
                    onClick={onBulkSuspend}
                />
                <ActionButton
                    label={cleanupMemberCount > 0 ? `整理候補ユーザーをまとめて削除 (${cleanupMemberCount})` : '整理候補ユーザーはありません'}
                    icon={<UserMinus size={14} />}
                    background="#0F766E"
                    disabled={cleanupMemberCount === 0 || actionLoading}
                    onClick={onBulkDeleteMembers}
                />
                <ActionButton
                    label={suspendedDeleteCandidateCount > 0 ? `休止済み候補をまとめてアカウント削除 (${suspendedDeleteCandidateCount})` : '休止済み削除候補はありません'}
                    icon={<Trash2 size={14} />}
                    background="#DC2626"
                    disabled={suspendedDeleteCandidateCount === 0 || actionLoading}
                    onClick={onBulkDeleteAccounts}
                />
            </div>

            <div style={{
                height: 1,
                background: '#E2E8F0',
            }}
            />

            <div style={{ display: 'grid', gap: 10 }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>
                        選択したアカウント
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <InlineButton
                            label={visibleAccountCount > 0 ? `表示中を全選択 (${visibleAccountCount})` : '表示中はありません'}
                            disabled={visibleAccountCount === 0 || actionLoading}
                            onClick={onSelectAllVisible}
                        />
                        <InlineButton
                            label="選択クリア"
                            disabled={selectedCount === 0 || actionLoading}
                            onClick={onClearSelection}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <SummaryPill label={`選択中 ${selectedCount}件`} tone="slate" />
                    <SummaryPill label={`休止 ${selectedSuspendCount}件`} tone="orange" />
                    <SummaryPill label={`復活 ${selectedUnsuspendCount}件`} tone="green" />
                </div>
                <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
                    一覧の左チェックで個別に選べます。選択した未休止アカウントはまとめて休止、休止中アカウントはまとめて復活できます。
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                    <ActionButton
                        label={selectedSuspendCount > 0 ? `選択中を休止 (${selectedSuspendCount})` : '休止できる選択はありません'}
                        icon={<Pause size={14} />}
                        background="#D97706"
                        disabled={selectedSuspendCount === 0 || actionLoading}
                        onClick={onBulkSuspendSelected}
                    />
                    <ActionButton
                        label={selectedUnsuspendCount > 0 ? `選択中を復活 (${selectedUnsuspendCount})` : '復活できる選択はありません'}
                        icon={<Play size={14} />}
                        background="#16A34A"
                        disabled={selectedUnsuspendCount === 0 || actionLoading}
                        onClick={onBulkUnsuspendSelected}
                    />
                </div>
            </div>
        </div>
    );
};

const ActionButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    background: string;
    disabled: boolean;
    onClick: () => void;
}> = ({ label, icon, background, disabled, onClick }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
            width: '100%',
            border: 'none',
            borderRadius: 12,
            padding: '12px 14px',
            background: disabled ? '#E5E7EB' : background,
            color: '#FFFFFF',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
        }}
    >
        {icon}
        {label}
    </button>
);

const SummaryPill: React.FC<{
    label: string;
    tone: 'orange' | 'blue' | 'slate' | 'red' | 'green';
}> = ({ label, tone }) => {
    const colors = tone === 'orange'
        ? { background: '#FFF7ED', color: '#C2410C' }
        : tone === 'blue'
            ? { background: '#EFF6FF', color: '#1D4ED8' }
            : tone === 'green'
                ? { background: '#DCFCE7', color: '#166534' }
            : tone === 'red'
                ? { background: '#FEE2E2', color: '#B91C1C' }
                : { background: '#F1F5F9', color: '#475569' };

    return (
        <span style={{
            ...colors,
            borderRadius: 999,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 700,
        }}
        >
            {label}
        </span>
    );
};

const InlineButton: React.FC<{
    label: string;
    disabled: boolean;
    onClick: () => void;
}> = ({ label, disabled, onClick }) => (
    <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={{
            border: '1px solid #CBD5E1',
            background: disabled ? '#F8FAFC' : '#FFFFFF',
            color: disabled ? '#94A3B8' : '#334155',
            borderRadius: 999,
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
        }}
    >
        {label}
    </button>
);
