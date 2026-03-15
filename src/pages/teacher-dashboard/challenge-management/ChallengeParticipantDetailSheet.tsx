import React from 'react';
import { Calendar, History, Sparkles, Target } from 'lucide-react';
import { Modal } from '../../../components/Modal';
import type { Challenge } from '../../../lib/challenges';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

export interface ChallengeParticipantAttemptDetail {
    id: string;
    attemptLabel: string;
    statusLabel: string;
    progressLabel: string;
    periodLabel: string;
    completedLabel: string | null;
    isLatest: boolean;
}

export interface ChallengeParticipantDetailData {
    memberId: string;
    name: string;
    challengeTitle: string;
    latestAttemptLabel: string;
    latestStatusLabel: string;
    latestProgressLabel: string;
    latestWindowLabel: string;
    previousClearLabel: string | null;
    attempts: ChallengeParticipantAttemptDetail[];
}

interface ChallengeParticipantDetailSheetProps {
    open: boolean;
    challenge: Challenge | null;
    participant: ChallengeParticipantDetailData | null;
    onClose: () => void;
}

export const ChallengeParticipantDetailSheet: React.FC<ChallengeParticipantDetailSheetProps> = ({
    open,
    challenge,
    participant,
    onClose,
}) => {
    if (!challenge || !participant) {
        return null;
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            align="bottom"
            maxWidth={420}
            ariaLabel={`${participant.name}のチャレンジ状況`}
            contentStyle={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: 20,
                maxHeight: '85vh',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xl,
                        fontWeight: 700,
                        color: COLOR.dark,
                    }}>
                        {participant.name}
                    </div>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.text,
                        lineHeight: 1.7,
                    }}>
                        {participant.challengeTitle}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={pillStyle('rgba(9,132,227,0.08)', '#0984E3')}>{participant.latestAttemptLabel}</span>
                        <span style={pillStyle('rgba(43,186,160,0.10)', '#1E7F6D')}>{participant.latestStatusLabel}</span>
                    </div>
                </div>

                <div style={panelStyle}>
                    <div style={panelTitleStyle}>いまの状況</div>
                    <div style={{ display: 'grid', gap: SPACE.sm }}>
                        <DetailRow icon={<Sparkles size={15} />} label="進みぐあい" value={participant.latestProgressLabel} />
                        <DetailRow icon={<Calendar size={15} />} label="今の期間" value={participant.latestWindowLabel} />
                        <DetailRow icon={<Target size={15} />} label="最近クリア" value={participant.previousClearLabel ?? 'まだないよ'} />
                    </div>
                </div>

                <div style={panelStyle}>
                    <div style={panelTitleStyle}>
                        <History size={15} />
                        これまでの挑戦
                    </div>
                    <div style={{ display: 'grid', gap: SPACE.sm }}>
                        {participant.attempts.map((attempt) => (
                            <div
                                key={attempt.id}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: RADIUS.md,
                                    background: attempt.isLatest ? 'rgba(43,186,160,0.08)' : 'rgba(255,255,255,0.7)',
                                    border: attempt.isLatest
                                        ? '1px solid rgba(43,186,160,0.16)'
                                        : '1px solid rgba(0,0,0,0.05)',
                                    display: 'grid',
                                    gap: 4,
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    gap: 8,
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                }}>
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 700,
                                        color: COLOR.dark,
                                    }}>
                                        {attempt.attemptLabel}
                                    </div>
                                    <span style={pillStyle(
                                        attempt.statusLabel.includes('クリア')
                                            ? 'rgba(43,186,160,0.10)'
                                            : attempt.statusLabel.includes('終')
                                                ? 'rgba(0,0,0,0.05)'
                                                : 'rgba(9,132,227,0.08)',
                                        attempt.statusLabel.includes('クリア')
                                            ? '#1E7F6D'
                                            : attempt.statusLabel.includes('終')
                                                ? '#7F8C8D'
                                                : '#0984E3',
                                    )}>
                                        {attempt.statusLabel}
                                    </span>
                                </div>
                                <div style={attemptMetaStyle}>{attempt.progressLabel}</div>
                                <div style={attemptMetaStyle}>{attempt.periodLabel}</div>
                                {attempt.completedLabel ? (
                                    <div style={attemptMetaStyle}>{attempt.completedLabel}</div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '24px 68px 1fr',
                alignItems: 'center',
                gap: SPACE.sm,
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.sm,
                color: COLOR.text,
            }}
        >
            <div style={{ color: COLOR.primaryDark, display: 'grid', placeItems: 'center' }}>{icon}</div>
            <div style={{ fontWeight: 700, color: COLOR.dark }}>{label}</div>
            <div>{value}</div>
        </div>
    );
}

function pillStyle(background: string, color: string): React.CSSProperties {
    return {
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.xs + 1,
        fontWeight: 700,
        color,
        background,
        borderRadius: RADIUS.full,
        padding: '3px 8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
    };
}

const panelStyle: React.CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(0,0,0,0.05)',
    display: 'grid',
    gap: SPACE.md,
};

const panelTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.dark,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};

const attemptMetaStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.text,
    lineHeight: 1.6,
};
