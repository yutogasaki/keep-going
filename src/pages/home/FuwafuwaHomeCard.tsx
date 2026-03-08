import React, { useMemo } from 'react';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSoloView } from './FuwafuwaSoloView';
import { FuwafuwaTogetherView } from './FuwafuwaTogetherView';
import { getFamilyMessage, getUserMessage } from './fuwafuwaHomeCardCopy';
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
                <FuwafuwaTogetherView
                    activeUsers={activeUsers}
                    displaySeconds={displaySeconds}
                    familyMessage={familyMessage}
                    onSelectUser={onSelectUser}
                    onTankReset={onTankReset}
                    perUserMagicMap={perUserMagicMap}
                    sessionsByUserId={sessionsByUserId}
                    targetSeconds={targetSeconds}
                />
            ) : selectedUser ? (
                <FuwafuwaSoloView
                    allSessions={allSessions}
                    displaySeconds={displaySeconds}
                    onTankReset={onTankReset}
                    selectedUser={selectedUser}
                    selectedUserMessage={selectedUserMessage}
                    targetSeconds={targetSeconds}
                />
            ) : null}
        </div>
    );
};
