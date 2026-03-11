import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSoloView } from './FuwafuwaSoloView';
import { FuwafuwaTogetherView } from './FuwafuwaTogetherView';
import { getFamilySpeech, getUserSpeech } from './fuwafuwaHomeCardCopy';
import type { FamilyMilestoneLead } from './fuwafuwaHomeCardCopy';
import {
    getFamilyHomeContextKey,
    getSoloHomeContextKey,
    type HomeAfterglow,
} from './homeAfterglow';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { HomeAmbientCue } from './homeAmbientUtils';
import type { HomeVisitRecency } from './homeVisitMemory';
import { shouldShowFuwafuwaSpeech } from './fuwafuwaSpeechPresence';
import type { PerUserMagic } from './types';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';

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
    const [pokeDepth, setPokeDepth] = useState(0);
    const [speechVariantSeed, setSpeechVariantSeed] = useState(0);
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
    const familyMilestoneLead = useMemo<FamilyMilestoneLead | null>(() => {
        const pendingUsers = activeUsers.flatMap((user) => {
            const event = milestoneEventsByUserId.get(user.id);
            if (!event) {
                return [];
            }

            return [{
                kind: event.kind,
                userId: event.userId,
                userName: user.name,
            }];
        });

        if (pendingUsers.length === 0) {
            return null;
        }

        return {
            ...pendingUsers[0],
            hasMultiple: pendingUsers.length > 1,
        };
    }, [activeUsers, milestoneEventsByUserId]);
    const familyContextKey = useMemo(
        () => getFamilyHomeContextKey(activeUsers.map((user) => user.id)),
        [activeUsers],
    );
    const soloContextKey = useMemo(
        () => getSoloHomeContextKey(selectedUser?.id),
        [selectedUser?.id],
    );
    const familyAfterglow = useMemo(
        () => (recentAfterglow && recentAfterglow.contextKey === familyContextKey ? recentAfterglow : null),
        [familyContextKey, recentAfterglow],
    );
    const selectedUserAfterglow = useMemo(
        () => (recentAfterglow && recentAfterglow.contextKey === soloContextKey ? recentAfterglow : null),
        [recentAfterglow, soloContextKey],
    );
    const familyBaseSpeech = useMemo(
        () => getFamilySpeech(
            activeUsers.length,
            displaySeconds,
            targetSeconds,
            announcement,
            ambientCue,
            familyMilestoneLead,
            0,
            speechVariantSeed,
            familyVisitRecency,
            familyAfterglow,
            isMagicDeliveryActive,
        ),
        [activeUsers.length, ambientCue, announcement, displaySeconds, familyAfterglow, familyMilestoneLead, familyVisitRecency, isMagicDeliveryActive, speechVariantSeed, targetSeconds],
    );
    const familySpeech = useMemo(
        () => getFamilySpeech(
            activeUsers.length,
            displaySeconds,
            targetSeconds,
            announcement,
            ambientCue,
            familyMilestoneLead,
            pokeDepth,
            speechVariantSeed,
            familyVisitRecency,
            familyAfterglow,
            isMagicDeliveryActive,
        ),
        [activeUsers.length, ambientCue, announcement, displaySeconds, familyAfterglow, familyMilestoneLead, familyVisitRecency, isMagicDeliveryActive, pokeDepth, speechVariantSeed, targetSeconds],
    );
    const selectedUserBaseSpeech = useMemo(
        () => selectedUserStatus
            ? getUserSpeech(
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                recentMilestoneEvent,
                announcement,
                ambientCue,
                0,
                selectedUserStatus.daysAlive,
                speechVariantSeed,
                selectedUserVisitRecency,
                selectedUserAfterglow,
                isMagicDeliveryActive,
            )
            : {
                id: 'user:none',
                category: 'relationship' as const,
                accent: 'primary' as const,
                lines: [],
            },
        [ambientCue, announcement, isMagicDeliveryActive, recentMilestoneEvent, selectedUserAfterglow, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds, selectedUserVisitRecency, speechVariantSeed],
    );
    const selectedUserSpeech = useMemo(
        () => selectedUserStatus
            ? getUserSpeech(
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                recentMilestoneEvent,
                announcement,
                ambientCue,
                pokeDepth,
                selectedUserStatus.daysAlive,
                speechVariantSeed,
                selectedUserVisitRecency,
                selectedUserAfterglow,
                isMagicDeliveryActive,
            )
            : {
                id: 'user:none',
                category: 'relationship' as const,
                accent: 'primary' as const,
                lines: [],
            },
        [ambientCue, announcement, isMagicDeliveryActive, pokeDepth, recentMilestoneEvent, selectedUserAfterglow, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds, selectedUserVisitRecency, speechVariantSeed],
    );

    useEffect(() => {
        setSpeechVariantSeed((currentSeed) => currentSeed + 1);
    }, [isTogetherMode, selectedUser?.id]);

    useEffect(() => {
        setPokeDepth(0);
    }, [familyBaseSpeech.id, isTogetherMode, selectedUser?.id, selectedUserBaseSpeech.id]);

    useEffect(() => {
        if (pokeResetTimerRef.current !== null) {
            window.clearTimeout(pokeResetTimerRef.current);
            pokeResetTimerRef.current = null;
        }

        if (pokeDepth === 0 || (!isTogetherMode && !selectedUser)) {
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

    const shouldShowFamilySpeech = useMemo(
        () => shouldShowFuwafuwaSpeech({
            speech: familySpeech,
            visitRecency: familyVisitRecency,
            pokeDepth,
        }),
        [familySpeech, familyVisitRecency, pokeDepth],
    );
    const shouldShowSelectedUserSpeech = useMemo(
        () => shouldShowFuwafuwaSpeech({
            speech: selectedUserSpeech,
            visitRecency: selectedUserVisitRecency,
            pokeDepth,
        }),
        [pokeDepth, selectedUserSpeech, selectedUserVisitRecency],
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
                    isMagicDeliveryActive={isMagicDeliveryActive}
                    showSpeechBubble={shouldShowFamilySpeech}
                    onFamilySpeechTap={() => setPokeDepth((currentDepth) => Math.min(2, currentDepth + 1))}
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
                    onCharacterTap={() => setPokeDepth((currentDepth) => Math.min(2, currentDepth + 1))}
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
