import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { ParticipantStatusItem } from './challengeParticipantStatus';

interface ChallengeParticipantStatusListProps {
    challengeId: string;
    participants: ParticipantStatusItem[];
    isExpanded: boolean;
    onOpenParticipant: (memberId: string) => void;
    onExpand: () => void;
    onCollapse: () => void;
}

export const ChallengeParticipantStatusList: React.FC<ChallengeParticipantStatusListProps> = ({
    challengeId,
    participants,
    isExpanded,
    onOpenParticipant,
    onExpand,
    onCollapse,
}) => {
    if (participants.length === 0) {
        return null;
    }

    const visibleParticipants = isExpanded ? participants : participants.slice(0, 6);
    const hiddenParticipantCount = isExpanded
        ? 0
        : Math.max(0, participants.length - visibleParticipants.length);

    return (
        <div style={{
            display: 'grid',
            gap: 6,
            marginTop: 6,
        }}>
            {visibleParticipants.map((item) => (
                <button
                    type="button"
                    key={`${challengeId}-${item.memberId}`}
                    onClick={() => onOpenParticipant(item.memberId)}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                        gap: 6,
                        alignItems: 'center',
                        padding: '7px 9px',
                        borderRadius: 10,
                        background: item.completed
                            ? '#E8F8F0'
                            : item.subLabel === '期間が終わった'
                                ? '#F5F5F5'
                                : item.progress > 0
                                    ? 'rgba(9, 132, 227, 0.08)'
                                    : '#F8FAFC',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                    }}
                >
                    <div style={{ minWidth: 0 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#2D3436',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}>
                            <span>{item.name}</span>
                            <span style={{
                                fontSize: 10,
                                padding: '1px 6px',
                                borderRadius: 999,
                                background: '#FFFFFF',
                                color: '#52606D',
                                border: '1px solid rgba(0,0,0,0.05)',
                            }}>
                                {item.attemptLabel}
                            </span>
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 10,
                            color: '#6B7280',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                        }}>
                            <span>{item.subLabel}</span>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span>{item.windowLabel}</span>
                        </div>
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        fontWeight: 700,
                        color: item.completed
                            ? '#1E7F6D'
                            : item.subLabel === '期間が終わった'
                                ? '#94A3B8'
                                : item.progress > 0
                                    ? '#0984E3'
                                    : '#636E72',
                        whiteSpace: 'nowrap',
                    }}>
                        {item.progressLabel}
                    </div>
                    <ChevronRight size={14} color="#94A3B8" />
                </button>
            ))}
            {hiddenParticipantCount > 0 ? (
                <button
                    type="button"
                    onClick={onExpand}
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#8395A7',
                        background: '#F0F3F5',
                        borderRadius: 999,
                        padding: '4px 8px',
                        border: 'none',
                        cursor: 'pointer',
                        justifySelf: 'start',
                    }}
                >
                    +{hiddenParticipantCount}人 つづきを見る
                </button>
            ) : null}
            {isExpanded && participants.length > 6 ? (
                <button
                    type="button"
                    onClick={onCollapse}
                    style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#64748B',
                        background: '#FFFFFF',
                        borderRadius: 999,
                        padding: '4px 8px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        cursor: 'pointer',
                        justifySelf: 'start',
                    }}
                >
                    参加者をたたむ
                </button>
            ) : null}
        </div>
    );
};
