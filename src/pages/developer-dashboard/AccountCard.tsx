import React from 'react';
import { ChevronDown, Pause, Play, Trash2 } from 'lucide-react';
import { calculateStreak } from '../../lib/teacher';
import type { AdminAccountSummary } from '../../lib/developer';

interface AccountCardProps {
    account: AdminAccountSummary;
    expanded: boolean;
    onToggle: () => void;
    daysAgo: (date: string | null) => string;
    formatDate: (date: string | null) => string;
    onSuspend: () => void;
    onDelete: () => void;
    onDeleteMember: (memberId: string) => void;
    thirtyDaysAgoStr: string;
}

export const AccountCard: React.FC<AccountCardProps> = ({
    account,
    expanded,
    onToggle,
    daysAgo,
    formatDate,
    onSuspend,
    onDelete,
    onDeleteMember,
    thirtyDaysAgoStr,
}) => {
    const isInactive = !account.lastActiveDate || account.lastActiveDate < thirtyDaysAgoStr;

    return (
        <div style={{
            background: '#fff',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: account.suspended ? '2px solid #f59e0b' : 'none',
            opacity: account.suspended ? 0.8 : 1,
        }}>
            <div
                onClick={onToggle}
                style={{
                    padding: '12px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                            {account.members.map((member) => member.name).join(', ')}
                        </span>
                        {account.members.length > 1 && (
                            <span style={{
                                background: '#3b82f6',
                                color: '#fff',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                {account.members.length}人
                            </span>
                        )}
                        {account.suspended && (
                            <span style={{
                                background: '#f59e0b',
                                color: '#fff',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                休止中
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span>{account.members.map((member) => member.classLevel).join('/')}</span>
                        <span>{account.totalSessions}回</span>
                        <span style={{ color: isInactive ? '#ef4444' : '#22c55e' }}>
                            {daysAgo(account.lastActiveDate)}
                        </span>
                    </div>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        color: '#999',
                        flexShrink: 0,
                        transform: expanded ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                    }}
                />
            </div>

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
                                    const memberIds = new Set(account.members.map((member) => member.id));
                                    const isSingleMember = account.members.length === 1;
                                    return account.members.map((member) => {
                                        const memberSessions = account.sessions.filter((session) => {
                                            if (session.userIds.length === 0) return true;
                                            if (session.userIds.includes(member.id)) return true;
                                            if (isSingleMember) return true;
                                            const hasAnyMatch = session.userIds.some((id) => memberIds.has(id));
                                            return !hasAnyMatch;
                                        });
                                        const memberLastActive = memberSessions.length > 0 ? memberSessions[0].date : null;
                                        const memberStreak = calculateStreak(memberSessions);
                                        return (
                                            <div key={member.id} style={{
                                                padding: '6px 8px',
                                                background: '#f8f8f8',
                                                borderRadius: 8,
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{member.name} ({member.classLevel})</span>
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            onDeleteMember(member.id);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            color: '#ccc',
                                                            padding: 2,
                                                            display: 'flex',
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

                    {account.sessions.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>直近セッション</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {account.sessions.slice(0, 10).map((session) => (
                                    <div key={session.id} style={{
                                        fontSize: 11,
                                        display: 'flex',
                                        gap: 8,
                                        padding: '3px 0',
                                        borderBottom: '1px solid #f8f8f8',
                                    }}>
                                        <span style={{ color: '#888' }}>{session.date}</span>
                                        <span>{Math.round(session.totalSeconds / 60)}分</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onSuspend();
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                background: account.suspended ? '#22c55e' : '#f59e0b',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                            }}
                        >
                            {account.suspended ? <><Play size={12} />解除</> : <><Pause size={12} />休止</>}
                        </button>
                        <button
                            onClick={(event) => {
                                event.stopPropagation();
                                onDelete();
                            }}
                            style={{
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: 'none',
                                cursor: 'pointer',
                                background: '#fee2e2',
                                color: '#ef4444',
                                fontSize: 12,
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
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
