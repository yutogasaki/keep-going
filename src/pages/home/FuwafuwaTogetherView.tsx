import React from 'react';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSpeechBubble } from './FuwafuwaSpeechBubble';
import {
    type FuwafuwaSpeech,
    getStageLabel,
} from './fuwafuwaHomeCardCopy';
import {
    getMilestoneAriaLabel,
    getMilestoneEmoji,
} from './milestoneCopy';
import type { PerUserMagic } from './types';

interface FuwafuwaTogetherViewProps {
    activeUsers: UserProfileStore[];
    displaySeconds: number;
    familySpeech: FuwafuwaSpeech;
    milestoneEventsByUserId: Map<string, FuwafuwaMilestoneEvent>;
    onSelectUser: (userId: string) => void;
    onTankReset: () => void;
    onSpeechAction?: () => void;
    perUserMagicMap: Map<string, PerUserMagic>;
    sessionsByUserId: Map<string, SessionRecord[]>;
    targetSeconds: number;
}

export const FuwafuwaTogetherView: React.FC<FuwafuwaTogetherViewProps> = ({
    activeUsers,
    displaySeconds,
    familySpeech,
    milestoneEventsByUserId,
    onSelectUser,
    onTankReset,
    onSpeechAction,
    perUserMagicMap,
    sessionsByUserId,
    targetSeconds,
}) => {
    return (
        <>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: SPACE.xs,
                    width: '100%',
                    padding: `0 ${SPACE.xl}px`,
                }}
            >
                <MagicTank
                    currentSeconds={displaySeconds}
                    maxSeconds={targetSeconds}
                    onReset={onTankReset}
                    ariaLabel="みんなの まほうタンク"
                />
                <div style={{ marginTop: SPACE.sm }}>
                    <FuwafuwaSpeechBubble
                        lines={familySpeech.lines}
                        accent={familySpeech.accent}
                        actionLabel={familySpeech.actionLabel}
                        onAction={onSpeechAction}
                    />
                </div>
            </div>

            <div
                style={{
                    width: '100%',
                    padding: `0 ${SPACE.lg}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACE.sm,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: SPACE.md,
                        overflowX: 'auto',
                        padding: `4px ${SPACE.xs}px 2px`,
                        width: '100%',
                        WebkitOverflowScrolling: 'touch',
                        scrollSnapType: 'x proximity',
                    }}
                >
                    {activeUsers.map((user) => {
                        const userMagic = perUserMagicMap.get(user.id);
                        const userSessions = sessionsByUserId.get(user.id) ?? [];
                        const milestoneEvent = milestoneEventsByUserId.get(user.id) ?? null;
                        const status = calculateFuwafuwaStatus(user.fuwafuwaBirthDate, userSessions);
                        const imagePath = `/ikimono/${user.fuwafuwaType}-${status.stage}.webp`;
                        const progressPercent = Math.min(
                            100,
                            Math.round(((userMagic?.displaySeconds ?? 0) / Math.max(1, userMagic?.targetSeconds ?? 1)) * 100),
                        );

                        return (
                            <button
                                key={user.id}
                                type="button"
                                onClick={() => onSelectUser(user.id)}
                                aria-label={milestoneEvent
                                    ? `${user.name}のふわふわを見る（${getMilestoneAriaLabel(milestoneEvent.kind)}）`
                                    : `${user.name}のふわふわを見る`}
                                style={{
                                    position: 'relative',
                                    minWidth: 164,
                                    maxWidth: 164,
                                    padding: '14px 14px 12px',
                                    borderRadius: RADIUS.xl,
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    background: 'rgba(255,255,255,0.9)',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: SPACE.md,
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    scrollSnapAlign: 'start',
                                    flexShrink: 0,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.sm }}>
                                    <div
                                        style={{
                                            position: 'relative',
                                            width: 58,
                                            height: 58,
                                            borderRadius: RADIUS.circle,
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(232,248,240,0.9))',
                                            border: milestoneEvent
                                                ? '1px solid rgba(43, 186, 160, 0.2)'
                                                : '1px solid rgba(43, 186, 160, 0.1)',
                                            boxShadow: milestoneEvent
                                                ? '0 8px 20px rgba(43, 186, 160, 0.16)'
                                                : '0 6px 16px rgba(43, 186, 160, 0.12)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {milestoneEvent ? (
                                            <div
                                                aria-hidden="true"
                                                style={{
                                                    position: 'absolute',
                                                    top: -4,
                                                    right: -4,
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: RADIUS.circle,
                                                    background: 'rgba(255,255,255,0.98)',
                                                    border: '1px solid rgba(43, 186, 160, 0.16)',
                                                    boxShadow: '0 6px 16px rgba(43, 186, 160, 0.16)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: 12,
                                                    lineHeight: 1,
                                                    zIndex: 1,
                                                }}
                                            >
                                                {getMilestoneEmoji(milestoneEvent.kind)}
                                            </div>
                                        ) : null}

                                        <img
                                            src={imagePath}
                                            alt={user.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transform: 'scale(1.08)',
                                            }}
                                        />
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <div
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.md,
                                                fontWeight: 700,
                                                color: COLOR.dark,
                                                marginBottom: 2,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {user.name}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.sm,
                                                color: COLOR.muted,
                                                marginBottom: 4,
                                            }}
                                        >
                                            {getStageLabel(status.stage)}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.xs,
                                                color: COLOR.text,
                                            }}
                                        >
                                            {status.activeDays}日
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            height: 8,
                                            borderRadius: RADIUS.full,
                                            background: 'rgba(43, 186, 160, 0.14)',
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${progressPercent}%`,
                                                height: '100%',
                                                borderRadius: RADIUS.full,
                                                background: progressPercent >= 100
                                                    ? 'linear-gradient(135deg, #FFEAA7 0%, #FDCB6E 100%)'
                                                    : 'linear-gradient(135deg, #2BBAA0 0%, #66D9C2 100%)',
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs,
                                            color: COLOR.muted,
                                            textAlign: 'right',
                                        }}
                                    >
                                        {Math.round(progressPercent)}%
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
