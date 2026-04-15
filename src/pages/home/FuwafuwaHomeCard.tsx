import React, { useMemo } from 'react';
import type { SessionRecord } from '../../lib/db';
import { RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSoloView } from './FuwafuwaSoloView';
import { FuwafuwaTogetherView } from './FuwafuwaTogetherView';
import type { HomeAfterglow } from './homeAfterglow';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { HomeAmbientCue } from './homeAmbientUtils';
import type { HomeVisitRecency } from './homeVisitMemory';
import type { PerUserMagic } from './types';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import { useFuwafuwaConversation } from './useFuwafuwaConversation';

interface FuwafuwaHomeCardProps {
    isTogetherMode: boolean;
    perUserMagic: PerUserMagic[];
    displaySeconds: number;
    targetSeconds: number;
    isMagicDeliveryActive: boolean;
    onTankReset: () => void;
    selectedUser: UserProfileStore | null;
    activeUsers: UserProfileStore[];
    allSessions: SessionRecord[];
    milestoneEventsByUserId: Map<string, FuwafuwaMilestoneEvent>;
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null;
    recentAfterglow: HomeAfterglow | null;
    onSelectUser: (userId: string) => void;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    familyVisitRecency: HomeVisitRecency;
    selectedUserVisitRecency: HomeVisitRecency;
    onAnnouncementAction: () => void;
}

export const FuwafuwaHomeCard: React.FC<FuwafuwaHomeCardProps> = ({
    isTogetherMode,
    perUserMagic,
    displaySeconds,
    targetSeconds,
    isMagicDeliveryActive,
    onTankReset,
    selectedUser,
    activeUsers,
    allSessions,
    milestoneEventsByUserId,
    recentMilestoneEvent,
    recentAfterglow,
    onSelectUser,
    announcement,
    ambientCue,
    familyVisitRecency,
    selectedUserVisitRecency,
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
    const selectedUserMagic = selectedUser ? perUserMagicMap.get(selectedUser.id) : null;
    const selectedUserDisplaySeconds = selectedUserMagic?.displaySeconds ?? displaySeconds;
    const selectedUserTargetSeconds = selectedUserMagic?.targetSeconds ?? targetSeconds;
    const {
        familySpeech,
        selectedUserSpeech,
        shouldShowFamilySpeech,
        shouldShowSelectedUserSpeech,
        advanceConversation,
    } = useFuwafuwaConversation({
        isTogetherMode,
        activeUsers,
        selectedUser,
        sessionsByUserId,
        milestoneEventsByUserId,
        recentMilestoneEvent,
        recentAfterglow,
        announcement,
        ambientCue,
        familyVisitRecency,
        selectedUserVisitRecency,
        displaySeconds,
        targetSeconds,
        selectedUserDisplaySeconds,
        selectedUserTargetSeconds,
        isMagicDeliveryActive,
    });

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
                    isMagicDeliveryActive={isMagicDeliveryActive}
                    showSpeechBubble={shouldShowFamilySpeech}
                    onFamilySpeechTap={advanceConversation}
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
                    isMagicDeliveryActive={isMagicDeliveryActive}
                    onCharacterTap={advanceConversation}
                    onSpeechTap={advanceConversation}
                    onTankReset={onTankReset}
                    onSpeechAction={selectedUserSpeech.actionLabel ? onAnnouncementAction : undefined}
                    selectedUser={selectedUser}
                    selectedUserSpeech={selectedUserSpeech}
                    showSpeechBubble={shouldShowSelectedUserSpeech}
                    targetSeconds={targetSeconds}
                />
            ) : null}
        </div>
    );
};
