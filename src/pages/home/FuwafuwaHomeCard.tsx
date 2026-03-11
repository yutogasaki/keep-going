import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSoloView } from './FuwafuwaSoloView';
import { FuwafuwaTogetherView } from './FuwafuwaTogetherView';
import { getFamilySpeech, getUserSpeech } from './fuwafuwaHomeCardCopy';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { PerUserMagic } from './types';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';

interface FuwafuwaHomeCardProps {
    isTogetherMode: boolean;
    perUserMagic: PerUserMagic[];
    displaySeconds: number;
    targetSeconds: number;
    onTankReset: () => void;
    selectedUser: UserProfileStore | null;
    activeUsers: UserProfileStore[];
    allSessions: SessionRecord[];
    milestoneEventsByUserId: Map<string, FuwafuwaMilestoneEvent>;
    onSelectUser: (userId: string) => void;
    announcement: HomeAnnouncement | null;
    onAnnouncementAction: () => void;
}

export const FuwafuwaHomeCard: React.FC<FuwafuwaHomeCardProps> = ({
    isTogetherMode,
    perUserMagic,
    displaySeconds,
    targetSeconds,
    onTankReset,
    selectedUser,
    activeUsers,
    allSessions,
    milestoneEventsByUserId,
    onSelectUser,
    announcement,
    onAnnouncementAction,
}) => {
    const [pokeDepth, setPokeDepth] = useState(0);
    const pokeResetTimerRef = useRef<number | null>(null);
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

    const selectedUserSessions = selectedUser ? sessionsByUserId.get(selectedUser.id) ?? [] : [];
    const selectedUserStatus = selectedUser
        ? calculateFuwafuwaStatus(selectedUser.fuwafuwaBirthDate, selectedUserSessions)
        : null;
    const selectedUserMagic = selectedUser ? perUserMagicMap.get(selectedUser.id) : null;
    const selectedUserDisplaySeconds = selectedUserMagic?.displaySeconds ?? displaySeconds;
    const selectedUserTargetSeconds = selectedUserMagic?.targetSeconds ?? targetSeconds;
    const familySpeech = useMemo(
        () => getFamilySpeech(activeUsers.length, displaySeconds, targetSeconds, announcement),
        [activeUsers.length, announcement, displaySeconds, targetSeconds],
    );
    const selectedUserBaseSpeech = useMemo(
        () => selectedUserStatus
            ? getUserSpeech(
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                announcement,
                0,
                selectedUserStatus.daysAlive,
            )
            : {
                id: 'user:none',
                category: 'relationship' as const,
                accent: 'primary' as const,
                lines: [],
            },
        [announcement, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds],
    );
    const selectedUserSpeech = useMemo(
        () => selectedUserStatus
            ? getUserSpeech(
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                announcement,
                pokeDepth,
                selectedUserStatus.daysAlive,
            )
            : {
                id: 'user:none',
                category: 'relationship' as const,
                accent: 'primary' as const,
                lines: [],
            },
        [announcement, pokeDepth, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds],
    );

    useEffect(() => {
        setPokeDepth(0);
    }, [isTogetherMode, selectedUser?.id, selectedUserBaseSpeech.id]);

    useEffect(() => {
        if (pokeResetTimerRef.current !== null) {
            window.clearTimeout(pokeResetTimerRef.current);
            pokeResetTimerRef.current = null;
        }

        if (pokeDepth === 0 || isTogetherMode || !selectedUser) {
            return undefined;
        }

        pokeResetTimerRef.current = window.setTimeout(() => {
            setPokeDepth(0);
            pokeResetTimerRef.current = null;
        }, 6000);

        return () => {
            if (pokeResetTimerRef.current !== null) {
                window.clearTimeout(pokeResetTimerRef.current);
                pokeResetTimerRef.current = null;
            }
        };
    }, [isTogetherMode, pokeDepth, selectedUser]);

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
                <FuwafuwaTogetherView
                    activeUsers={activeUsers}
                    displaySeconds={displaySeconds}
                    familySpeech={familySpeech}
                    milestoneEventsByUserId={milestoneEventsByUserId}
                    onSelectUser={onSelectUser}
                    onTankReset={onTankReset}
                    onSpeechAction={familySpeech.actionLabel ? onAnnouncementAction : undefined}
                    perUserMagicMap={perUserMagicMap}
                    sessionsByUserId={sessionsByUserId}
                    targetSeconds={targetSeconds}
                />
            ) : selectedUser ? (
                <FuwafuwaSoloView
                    allSessions={allSessions}
                    displaySeconds={displaySeconds}
                    onCharacterTap={() => setPokeDepth((currentDepth) => Math.min(2, currentDepth + 1))}
                    onTankReset={onTankReset}
                    onSpeechAction={selectedUserSpeech.actionLabel ? onAnnouncementAction : undefined}
                    selectedUser={selectedUser}
                    selectedUserSpeech={selectedUserSpeech}
                    targetSeconds={targetSeconds}
                />
            ) : null}
        </div>
    );
};
