import React from 'react';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSpeechBubble } from './FuwafuwaSpeechBubble';
import {
    getSoftProgress,
    getSoftProgressShort,
    getStageLabel,
} from './fuwafuwaHomeCardCopy';
import type { PerUserMagic } from './types';

interface FuwafuwaTogetherViewProps {
    activeUsers: UserProfileStore[];
    displaySeconds: number;
    familyMessage: string;
    onSelectUser: (userId: string) => void;
    onTankReset: () => void;
    perUserMagicMap: Map<string, PerUserMagic>;
    sessionsByUserId: Map<string, SessionRecord[]>;
    targetSeconds: number;
}

export const FuwafuwaTogetherView: React.FC<FuwafuwaTogetherViewProps> = ({
    activeUsers,
    displaySeconds,
    familyMessage,
    onSelectUser,
    onTankReset,
    perUserMagicMap,
    sessionsByUserId,
    targetSeconds,
}) => {
    const familyProgressPercent = Math.min(100, Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100));

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
                <div
                    style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                        color: COLOR.info,
                        background: 'rgba(9, 132, 227, 0.1)',
                        padding: '6px 12px',
                        borderRadius: RADIUS.full,
                    }}
                >
                    みんなの まほうタンク
                </div>
                <MagicTank
                    currentSeconds={displaySeconds}
                    maxSeconds={targetSeconds}
                    onReset={onTankReset}
                    label="みんなの まほうを あつめよう！"
                    fullLabel="みんなの まほうがいっぱい！✨"
                    fullHint="タップしてみんなのふわふわに送る"
                />
                <div
                    style={{
                        fontFamily: FONT.heading,
                        fontSize: FONT_SIZE.lg,
                        fontWeight: 800,
                        color: familyProgressPercent >= 100 ? COLOR.gold : COLOR.dark,
                        marginTop: -2,
                    }}
                >
                    {getSoftProgress(familyProgressPercent)}
                </div>
                <div style={{ marginTop: SPACE.sm }}>
                    <FuwafuwaSpeechBubble message={familyMessage} accent="info" />
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
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: SPACE.md,
                        padding: `0 ${SPACE.xs}px`,
                    }}
                >
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}
                    >
                        みんなのふわふわ
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.muted,
                        }}
                    >
                        タップでこの子を見る
                    </div>
                </div>

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
                                style={{
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
                                            width: 58,
                                            height: 58,
                                            borderRadius: RADIUS.circle,
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(232,248,240,0.9))',
                                            border: '1px solid rgba(43, 186, 160, 0.1)',
                                            boxShadow: '0 6px 16px rgba(43, 186, 160, 0.12)',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
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
                                            {status.activeDays}日 がんばった
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
                                            color: progressPercent >= 100 ? COLOR.gold : COLOR.text,
                                            fontWeight: 600,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {getSoftProgressShort(progressPercent)}
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
