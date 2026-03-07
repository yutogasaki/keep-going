import React, { useMemo } from 'react';
import { FuwafuwaCharacter } from '../../components/FuwafuwaCharacter';
import { MagicTank } from '../../components/MagicTank';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import type { PerUserMagic } from './types';

interface FuwafuwaHomeCardProps {
    isTogetherMode: boolean;
    perUserMagic: PerUserMagic[];
    displaySeconds: number;
    targetSeconds: number;
    onTankReset: () => void;
    selectedUser: UserProfileStore | null;
    activeUsers: UserProfileStore[];
    allSessions: SessionRecord[];
    onSelectUser: (userId: string) => void;
}

const formatDuration = (seconds: number) => {
    if (seconds < 60) {
        return `${seconds}秒`;
    }

    return `${Math.floor(seconds / 60)}分`;
};

const getStageLabel = (stage: number) => {
    if (stage === 1) return 'たまご';
    if (stage === 2) return 'ようせい';
    return 'おとな';
};

const getFamilyMessage = (activeCount: number, displaySeconds: number, targetSeconds: number) => {
    const remainingSeconds = Math.max(0, targetSeconds - displaySeconds);
    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;

    if (displaySeconds >= targetSeconds) {
        return 'みんな すごい！ まんたんだよ';
    }

    if (displaySeconds === 0) {
        return `${peopleLabel} ちからを あわせよう！`;
    }

    if (remainingSeconds <= 60) {
        return `${peopleLabel} あと ${formatDuration(remainingSeconds)}！`;
    }

    return `みんなの まほう、あと ${formatDuration(remainingSeconds)} で まんたん！`;
};

const getUserMessage = (displaySeconds: number, targetSeconds: number, stage: number, activeDays: number) => {
    const remainingSeconds = Math.max(0, targetSeconds - displaySeconds);

    if (displaySeconds >= targetSeconds) {
        return 'わあ！ まほうが いっぱいだよ';
    }

    if (displaySeconds === 0) {
        if (stage === 1) {
            return 'きょうも まってたよ';
        }
        return 'いっしょに まほうを あつめよう？';
    }

    if (stage === 2 && activeDays >= 6) {
        return 'もうすぐ おおきくなれそう！';
    }

    if (remainingSeconds <= 60) {
        return `あと ${formatDuration(remainingSeconds)} で まんたん！`;
    }

    return `いいかんじ！ あと ${formatDuration(remainingSeconds)} だよ`;
};

interface SpeechBubbleProps {
    message: string;
    accent: 'primary' | 'info';
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({ message, accent }) => {
    const accentColor = accent === 'info' ? COLOR.info : COLOR.primary;
    const accentBackground = accent === 'info' ? 'rgba(9, 132, 227, 0.08)' : 'rgba(43, 186, 160, 0.08)';

    return (
        <div
            style={{
                position: 'relative',
                maxWidth: 300,
                padding: '12px 16px',
                borderRadius: 20,
                background: accentBackground,
                border: `1px solid ${accent === 'info' ? 'rgba(9, 132, 227, 0.15)' : 'rgba(43, 186, 160, 0.16)'}`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                textAlign: 'center',
            }}
        >
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    lineHeight: 1.6,
                    color: accentColor,
                }}
            >
                {message}
            </div>
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -7,
                    width: 14,
                    height: 14,
                    background: accentBackground,
                    borderRight: `1px solid ${accent === 'info' ? 'rgba(9, 132, 227, 0.15)' : 'rgba(43, 186, 160, 0.16)'}`,
                    borderBottom: `1px solid ${accent === 'info' ? 'rgba(9, 132, 227, 0.15)' : 'rgba(43, 186, 160, 0.16)'}`,
                    transform: 'translateX(-50%) rotate(45deg)',
                }}
            />
        </div>
    );
};

export const FuwafuwaHomeCard: React.FC<FuwafuwaHomeCardProps> = ({
    isTogetherMode,
    perUserMagic,
    displaySeconds,
    targetSeconds,
    onTankReset,
    selectedUser,
    activeUsers,
    allSessions,
    onSelectUser,
}) => {
    const perUserMagicMap = useMemo(
        () => new Map(perUserMagic.map((userMagic) => [userMagic.userId, userMagic])),
        [perUserMagic],
    );

    const sessionsByUserId = useMemo(
        () => new Map(
            activeUsers.map((user) => [
                user.id,
                allSessions.filter((session) => !session.userIds || session.userIds.includes(user.id)),
            ]),
        ),
        [activeUsers, allSessions],
    );

    const familyProgressPercent = Math.min(100, Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100));
    const familyRemainingSeconds = Math.max(0, targetSeconds - displaySeconds);
    const selectedUserSessions = selectedUser ? sessionsByUserId.get(selectedUser.id) ?? [] : [];
    const selectedUserStatus = selectedUser
        ? calculateFuwafuwaStatus(selectedUser.fuwafuwaBirthDate, selectedUserSessions)
        : null;
    const selectedUserMagic = selectedUser ? perUserMagicMap.get(selectedUser.id) : null;
    const familyMessage = useMemo(
        () => getFamilyMessage(activeUsers.length, displaySeconds, targetSeconds),
        [activeUsers.length, displaySeconds, targetSeconds],
    );
    const selectedUserMessage = useMemo(
        () => selectedUserStatus
            ? getUserMessage(
                selectedUserMagic?.displaySeconds ?? displaySeconds,
                selectedUserMagic?.targetSeconds ?? targetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
            )
            : '',
        [displaySeconds, selectedUserMagic, selectedUserStatus, targetSeconds],
    );

    return (
        <div
            style={{
                width: 'calc(100% - 32px)',
                maxWidth: 420,
                background: 'var(--card-bg)',
                backdropFilter: 'blur(var(--blur-md))',
                WebkitBackdropFilter: 'blur(var(--blur-md))',
                borderRadius: RADIUS['3xl'],
                boxShadow: 'var(--card-shadow)',
                border: 'var(--glass-border)',
                padding: '18px 0 22px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isTogetherMode ? SPACE.lg : SPACE.md,
            }}
        >
            {isTogetherMode ? (
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
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: SPACE.sm,
                                marginTop: -2,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: FONT.heading,
                                    fontSize: FONT_SIZE['2xl'],
                                    fontWeight: 800,
                                    color: COLOR.dark,
                                }}
                            >
                                {familyProgressPercent}%
                            </span>
                            <span
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    color: COLOR.text,
                                }}
                            >
                                {formatDuration(displaySeconds)} / {formatDuration(targetSeconds)}
                            </span>
                        </div>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: familyRemainingSeconds > 0 ? COLOR.text : COLOR.gold,
                                fontWeight: 600,
                            }}
                        >
                            {familyRemainingSeconds > 0
                                ? `あと ${formatDuration(familyRemainingSeconds)} で まんたん`
                                : 'みんなで まんたん！'}
                        </div>
                        <div style={{ marginTop: SPACE.sm }}>
                            <SpeechBubble
                                message={familyMessage}
                                accent="info"
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
                                const remainingSeconds = Math.max(0, (userMagic?.targetSeconds ?? 0) - (userMagic?.displaySeconds ?? 0));

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
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    gap: SPACE.sm,
                                                    fontFamily: FONT.body,
                                                    fontSize: FONT_SIZE.xs,
                                                    color: COLOR.text,
                                                }}
                                            >
                                                <span>{progressPercent}%</span>
                                                <span>
                                                    {remainingSeconds > 0 ? `あと ${formatDuration(remainingSeconds)}` : 'まんたん'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            ) : selectedUser ? (
                <>
                    <div style={{ marginBottom: 4 }}>
                        <MagicTank
                            currentSeconds={displaySeconds}
                            maxSeconds={targetSeconds}
                            onReset={onTankReset}
                        />
                    </div>

                    <SpeechBubble
                        message={selectedUserMessage}
                        accent="primary"
                    />

                    <div
                        style={{
                            width: '100%',
                            padding: `0 ${SPACE.xl}px`,
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <FuwafuwaCharacter
                            user={selectedUser}
                            sessions={allSessions}
                        />
                    </div>
                </>
            ) : null}
        </div>
    );
};
