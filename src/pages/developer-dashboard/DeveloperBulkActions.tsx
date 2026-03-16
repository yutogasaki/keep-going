import React from 'react';
import { Pause, Trash2, UserMinus } from 'lucide-react';

interface DeveloperBulkActionsProps {
    suspendCandidateCount: number;
    suspendedDeleteCandidateCount: number;
    cleanupMemberCount: number;
    cleanupAccountCount: number;
    actionLoading: boolean;
    onBulkSuspend: () => void;
    onBulkDeleteAccounts: () => void;
    onBulkDeleteMembers: () => void;
}

export const DeveloperBulkActions: React.FC<DeveloperBulkActionsProps> = ({
    suspendCandidateCount,
    suspendedDeleteCandidateCount,
    cleanupMemberCount,
    cleanupAccountCount,
    actionLoading,
    onBulkSuspend,
    onBulkDeleteAccounts,
    onBulkDeleteMembers,
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
    tone: 'orange' | 'blue' | 'slate' | 'red';
}> = ({ label, tone }) => {
    const colors = tone === 'orange'
        ? { background: '#FFF7ED', color: '#C2410C' }
        : tone === 'blue'
            ? { background: '#EFF6FF', color: '#1D4ED8' }
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
