import React from 'react';
import { Check, ChevronDown, Pause, Play, Trash2 } from 'lucide-react';
import type { AdminAccountSummary } from '../../lib/developer';
import { NEW_ACCOUNT_GRACE_DAYS, type AccountSegmentation } from './accountSegmentation';

interface AccountCardProps {
    account: AdminAccountSummary;
    analysis: AccountSegmentation;
    selected: boolean;
    expanded: boolean;
    onToggleSelected: () => void;
    onToggle: () => void;
    daysAgo: (date: string | null) => string;
    formatDate: (date: string | null) => string;
    onSuspend: () => void;
    onDelete: () => void;
    onDeleteMember: (memberId: string) => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
    account,
    analysis,
    selected,
    expanded,
    onToggleSelected,
    onToggle,
    daysAgo,
    formatDate,
    onSuspend,
    onDelete,
    onDeleteMember,
}) => {
    const memberSignalsById = new Map(analysis.memberSignals.map((signal) => [signal.memberId, signal]));

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
                <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={selected ? '選択解除' : '選択'}
                    onClick={(event) => {
                        event.stopPropagation();
                        onToggleSelected();
                    }}
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        border: selected ? 'none' : '1px solid #CBD5E1',
                        background: selected ? '#2563EB' : '#FFFFFF',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                    }}
                >
                    {selected ? <Check size={14} /> : null}
                </button>
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
                        {!account.suspended && analysis.isSuspendCandidate && (
                            <span style={{
                                background: '#ef4444',
                                color: '#fff',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                休止候補
                            </span>
                        )}
                        {!account.suspended && analysis.hasUnusedCleanupRisk && (
                            <span style={{
                                background: '#FFF7ED',
                                color: '#C2410C',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                未使用整理候補
                            </span>
                        )}
                        {!account.suspended && !analysis.isSuspendCandidate && analysis.isInactive && (
                            <span style={{
                                background: '#e5e7eb',
                                color: '#374151',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                非アクティブ
                            </span>
                        )}
                        {analysis.isNewGrace && (
                            <span style={{
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                新規{NEW_ACCOUNT_GRACE_DAYS}日
                            </span>
                        )}
                        {analysis.cleanupCandidateMemberCount > 0 && (
                            <span style={{
                                background: '#DBEAFE',
                                color: '#1D4ED8',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                整理候補 {analysis.cleanupCandidateMemberCount}人
                            </span>
                        )}
                        {analysis.hasDuplicateNames && (
                            <span style={{
                                background: '#ede9fe',
                                color: '#6d28d9',
                                padding: '1px 6px',
                                borderRadius: 8,
                                fontSize: 10,
                                fontWeight: 700,
                            }}>
                                同名あり
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span>{account.members.map((member) => member.classLevel).join('/')}</span>
                        <span>{account.totalSessions}回</span>
                        <span style={{ color: analysis.isInactive || analysis.isSuspendCandidate ? '#ef4444' : '#22c55e' }}>
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
                                {account.members.map((member) => {
                                    const signal = memberSignalsById.get(member.id);
                                    const shortMemberId = member.id.slice(0, 6);

                                    return (
                                        <div key={member.id} style={{
                                            padding: '6px 8px',
                                            background: '#f8f8f8',
                                            borderRadius: 8,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>
                                                    {member.name} ({member.classLevel})
                                                </span>
                                                <button
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        onDeleteMember(member.id);
                                                    }}
                                                    style={{
                                                        background: '#FFFFFF',
                                                        border: '1px solid rgba(239, 68, 68, 0.14)',
                                                        borderRadius: 999,
                                                        cursor: 'pointer',
                                                        color: '#DC2626',
                                                        padding: '4px 8px',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                    }}
                                                >
                                                    <Trash2 size={12} />ユーザーだけ削除
                                                </button>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 4,
                                                marginTop: 4,
                                            }}>
                                                {signal?.hasDuplicateName && (
                                                    <span style={pillStyle('#ede9fe', '#6d28d9')}>
                                                        同名 {signal.duplicateGroupSize}人
                                                    </span>
                                                )}
                                                {!signal?.hasNamedSessions && account.members.length > 1 && (
                                                    <span style={pillStyle('#fff7ed', '#c2410c')}>
                                                        未参照
                                                    </span>
                                                )}
                                                {signal?.isCleanupCandidate && (
                                                    <span style={pillStyle('#fee2e2', '#b91c1c')}>
                                                        整理候補
                                                    </span>
                                                )}
                                                {signal?.cleanupReasonLabels.map((label) => (
                                                    <span key={`${member.id}-${label}`} style={pillStyle('#EFF6FF', '#1D4ED8')}>
                                                        {label}
                                                    </span>
                                                ))}
                                                <span style={pillStyle('#e5e7eb', '#4b5563')}>
                                                    ID {shortMemberId}
                                                </span>
                                                {member.createdAt && (
                                                    <span style={pillStyle('#e0f2fe', '#0369a1')}>
                                                        作成 {formatDate(member.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: 10, color: '#888', flexWrap: 'wrap' }}>
                                                <span>🔥 {signal?.streak ?? 0}日</span>
                                                <span>最終: {signal?.lastActiveDate ? daysAgo(signal.lastActiveDate) : '未使用'}</span>
                                                <span>{signal?.inferredSessionCount ?? 0}回</span>
                                                {account.members.length > 1 && (
                                                    <span>直接参照 {signal?.directSessionCount ?? 0}回</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{
                                marginTop: 6,
                                fontSize: 10,
                                color: '#64748B',
                                lineHeight: 1.5,
                            }}>
                                ユーザー削除はメンバーだけを消して、アカウント自体は残します。
                            </div>
                        </div>
                        {(analysis.suspendReasonLabels.length > 0 || analysis.cleanupCandidateMemberCount > 0) && (
                            <div style={{
                                padding: '8px 10px',
                                background: '#F8FAFC',
                                borderRadius: 8,
                                color: '#475569',
                                fontSize: 11,
                                lineHeight: 1.6,
                            }}>
                                {analysis.suspendReasonLabels.length > 0
                                    ? `休止候補理由: ${analysis.suspendReasonLabels.join(' / ')}`
                                    : '休止候補理由はありません'}
                                {analysis.cleanupCandidateMemberCount > 0
                                    ? ` / 整理候補ユーザー ${analysis.cleanupCandidateMemberCount}人`
                                    : ''}
                            </div>
                        )}
                        {analysis.hasDuplicateNames && (
                            <div style={{
                                padding: '8px 10px',
                                background: '#faf5ff',
                                borderRadius: 8,
                                color: '#6d28d9',
                                fontSize: 11,
                                lineHeight: 1.5,
                            }}>
                                同名グループ: {analysis.duplicateNames.join(', ')}
                                <br />
                                「未参照」は session.user_ids に出てこないメンバーです。端末上に残っていない可能性があるため、削除前の確認対象にします。
                            </div>
                        )}
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

function pillStyle(background: string, color: string): React.CSSProperties {
    return {
        background,
        color,
        padding: '1px 6px',
        borderRadius: 8,
        fontSize: 10,
        fontWeight: 700,
    };
}
