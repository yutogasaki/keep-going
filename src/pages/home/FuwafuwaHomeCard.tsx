import React, { useMemo } from 'react';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSoloView } from './FuwafuwaSoloView';
import { FuwafuwaTogetherView } from './FuwafuwaTogetherView';
import { getFamilySpeech, getUserSpeech } from './fuwafuwaHomeCardCopy';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
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
    onSelectUser,
    announcement,
    onAnnouncementAction,
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
    const familySpeech = useMemo(
        () => getFamilySpeech(activeUsers.length, displaySeconds, targetSeconds, announcement),
        [activeUsers.length, announcement, displaySeconds, targetSeconds],
    );
    const selectedUserSpeech = useMemo(
        () => selectedUserStatus
            ? getUserSpeech(
                selectedUserMagic?.displaySeconds ?? displaySeconds,
                selectedUserMagic?.targetSeconds ?? targetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                announcement,
            )
            : {
                accent: 'primary' as const,
                lines: [],
            },
        [announcement, displaySeconds, selectedUserMagic, selectedUserStatus, targetSeconds],
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
                    familySpeech={familySpeech}
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
