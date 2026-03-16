import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import { RADIUS, SPACE } from '../../lib/styles';
import type { UserProfileStore } from '../../store/useAppStore';
import { FuwafuwaSoloView } from './FuwafuwaSoloView';
import { FuwafuwaTogetherView } from './FuwafuwaTogetherView';
import {
    getFamilyDailySpeech,
    getFamilyEventSpeech,
    getUserDailySpeech,
    getUserEventSpeech,
    type FuwafuwaDailySelection,
    type FuwafuwaSpeech,
} from './fuwafuwaHomeCardCopy';
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
import {
    chooseNextDailyConversation,
    EMPTY_DAILY_CONVERSATION_STATE,
    type DailyConversationCandidate,
    type DailyConversationContext,
    type DailyConversationState,
} from './fuwafuwaDailyConversation';

function applySpeechName(speech: FuwafuwaSpeech, name: string | null): FuwafuwaSpeech {
    if (!name) return speech;
    return { ...speech, lines: speech.lines.map((line) => line.split('ふわふわ').join(name)) };
}

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
    const [dailyState, setDailyState] = useState<DailyConversationState>(EMPTY_DAILY_CONVERSATION_STATE);
    const [dailySelection, setDailySelection] = useState<FuwafuwaDailySelection | null>(null);
    const [eventDismissed, setEventDismissed] = useState(false);
    const pokeResetTimerRef = useRef<number | null>(null);
    const idleBeatTimerRef = useRef<number | null>(null);
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

    const selectedUserSessions = useMemo(
        () => (selectedUser ? sessionsByUserId.get(selectedUser.id) ?? [] : []),
        [selectedUser, sessionsByUserId],
    );
    const selectedUserStatus = useMemo(
        () => (selectedUser
            ? calculateFuwafuwaStatus(selectedUser.fuwafuwaBirthDate, selectedUserSessions)
            : null),
        [selectedUser, selectedUserSessions],
    );
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
    const familyEventSpeech = useMemo(
        () => getFamilyEventSpeech(
            activeUsers.length,
            displaySeconds,
            targetSeconds,
            announcement,
            familyMilestoneLead,
            pokeDepth,
            familyVisitRecency,
            familyAfterglow,
            isMagicDeliveryActive,
        ),
        [activeUsers.length, announcement, displaySeconds, familyAfterglow, familyMilestoneLead, familyVisitRecency, isMagicDeliveryActive, pokeDepth, targetSeconds],
    );
    const selectedUserEventSpeech = useMemo(
        () => selectedUserStatus
            ? getUserEventSpeech(
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                recentMilestoneEvent,
                announcement,
                pokeDepth,
                selectedUserStatus.daysAlive,
                selectedUserAfterglow,
                isMagicDeliveryActive,
            )
            : null,
        [announcement, isMagicDeliveryActive, pokeDepth, recentMilestoneEvent, selectedUserAfterglow, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds],
    );

    const buildFamilyDailyCandidate = useMemo(
        () => (selection: FuwafuwaDailySelection): DailyConversationCandidate => {
            const speech = getFamilyDailySpeech(
                selection,
                activeUsers.length,
                displaySeconds,
                targetSeconds,
                ambientCue,
                familyVisitRecency,
            );

            return {
                selection: {
                    group: speech.dailyGroup ?? selection.group,
                    topic: speech.dailyTopic ?? selection.topic,
                    replyIndex: selection.replyIndex,
                },
                replyId: [
                    speech.accent,
                    speech.actionLabel ?? '',
                    ...speech.lines,
                ].join('|'),
            };
        },
        [activeUsers.length, ambientCue, displaySeconds, familyVisitRecency, targetSeconds],
    );

    const buildUserDailyCandidate = useMemo(
        () => (selection: FuwafuwaDailySelection): DailyConversationCandidate | null => {
            if (!selectedUserStatus) {
                return null;
            }

            const speech = getUserDailySpeech(
                selection,
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                ambientCue,
                selectedUserStatus.daysAlive,
                selectedUserVisitRecency,
            );

            return {
                selection: {
                    group: speech.dailyGroup ?? selection.group,
                    topic: speech.dailyTopic ?? selection.topic,
                    replyIndex: selection.replyIndex,
                },
                replyId: [
                    speech.accent,
                    speech.actionLabel ?? '',
                    ...speech.lines,
                ].join('|'),
            };
        },
        [ambientCue, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds, selectedUserVisitRecency],
    );

    const buildDailyContext = useMemo(
        () => (): DailyConversationContext => {
            const growthAvailable = selectedUserStatus
                ? (
                    (selectedUserStatus.stage === 1 && selectedUserStatus.daysAlive === 3)
                    || (selectedUserStatus.stage === 2 && selectedUserStatus.activeDays >= 6)
                )
                : false;

            const namingAvailable = Boolean(
                !isTogetherMode
                && selectedUser
                && !selectedUser.fuwafuwaName
                && selectedUserStatus
                && selectedUserStatus.stage > 1,
            );

            const baseSelections: FuwafuwaDailySelection[] = isTogetherMode
                ? [
                    { group: 'everyday', topic: 'greeting', replyIndex: 0 },
                    { group: 'everyday', topic: 'mood', replyIndex: 0 },
                    { group: 'magic', topic: 'mechanic', replyIndex: 0 },
                    { group: 'magic', topic: 'progress', replyIndex: 0 },
                    { group: 'magic', topic: 'omen', replyIndex: 0 },
                    ...(ambientCue ? [{ group: 'ambient' as const, topic: 'ambient' as const, replyIndex: 0 }] : []),
                ]
                : [
                    { group: 'everyday', topic: 'greeting', replyIndex: 0 },
                    { group: 'everyday', topic: 'mood', replyIndex: 0 },
                    { group: 'magic', topic: 'mechanic', replyIndex: 0 },
                    { group: 'magic', topic: 'progress', replyIndex: 0 },
                    { group: 'magic', topic: 'omen', replyIndex: 0 },
                    ...(growthAvailable ? [{ group: 'magic' as const, topic: 'growth' as const, replyIndex: 0 }] : []),
                    ...(namingAvailable ? [{ group: 'everyday' as const, topic: 'naming' as const, replyIndex: 0 }] : []),
                    ...(ambientCue ? [{ group: 'ambient' as const, topic: 'ambient' as const, replyIndex: 0 }] : []),
                ];

            const rawCandidates = baseSelections.flatMap((selection) => {
                return Array.from({ length: 4 }, (_, replyIndex) => ({
                    ...selection,
                    replyIndex,
                }));
            });

            const candidates = rawCandidates.flatMap((selection) => {
                const candidate = isTogetherMode
                    ? buildFamilyDailyCandidate(selection)
                    : buildUserDailyCandidate(selection);

                return candidate ? [candidate] : [];
            }).filter((candidate, index, allCandidates) => {
                return allCandidates.findIndex((other) => (
                    other.selection.group === candidate.selection.group
                    && other.selection.topic === candidate.selection.topic
                    && other.replyId === candidate.replyId
                )) === index;
            });

            return {
                ambientAvailable: Boolean(ambientCue),
                percent: selectedUserStatus && !isTogetherMode
                    ? Math.round((selectedUserDisplaySeconds / Math.max(1, selectedUserTargetSeconds)) * 100)
                    : Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100),
                hasGrowthLite: growthAvailable,
                hasNamingHint: Boolean(namingAvailable),
                candidates,
            };
        },
        [ambientCue, buildFamilyDailyCandidate, buildUserDailyCandidate, displaySeconds, isTogetherMode, selectedUser, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds, targetSeconds],
    );

    const dailyContext = useMemo(
        () => buildDailyContext(),
        [buildDailyContext],
    );
    const dailyCandidateSignature = useMemo(
        () => dailyContext.candidates
            .map((candidate) => `${candidate.selection.group}:${candidate.selection.topic}:${candidate.replyId}`)
            .join('|'),
        [dailyContext.candidates],
    );
    const initialDailyConversation = useMemo(
        () => chooseNextDailyConversation(EMPTY_DAILY_CONVERSATION_STATE, dailyContext, 'initial'),
        [dailyContext],
    );
    const resolvedDailySelection = dailySelection ?? initialDailyConversation.candidate?.selection ?? null;
    const resolvedDailyState = dailySelection ? dailyState : initialDailyConversation.nextState;

    const familyDailySpeech = useMemo(
        () => resolvedDailySelection
            ? getFamilyDailySpeech(
                resolvedDailySelection,
                activeUsers.length,
                displaySeconds,
                targetSeconds,
                ambientCue,
                familyVisitRecency,
            )
            : {
                id: 'family:none',
                category: 'relationship' as const,
                accent: 'everyday' as const,
                lines: [],
            },
        [activeUsers.length, ambientCue, displaySeconds, familyVisitRecency, resolvedDailySelection, targetSeconds],
    );

    const selectedUserDailySpeech = useMemo(
        () => (resolvedDailySelection && selectedUserStatus)
            ? getUserDailySpeech(
                resolvedDailySelection,
                selectedUserDisplaySeconds,
                selectedUserTargetSeconds,
                selectedUserStatus.stage,
                selectedUserStatus.activeDays,
                ambientCue,
                selectedUserStatus.daysAlive,
                selectedUserVisitRecency,
            )
            : {
                id: 'user:none',
                category: 'relationship' as const,
                accent: 'everyday' as const,
                lines: [],
            },
        [ambientCue, resolvedDailySelection, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds, selectedUserVisitRecency],
    );

    const fuwafuwaName = selectedUser?.fuwafuwaName ?? null;
    const rawEventSpeechId = isTogetherMode ? familyEventSpeech?.id : selectedUserEventSpeech?.id;
    const hasActiveEventSpeech = Boolean(rawEventSpeechId) && !eventDismissed;
    const familySpeech = (familyEventSpeech && !eventDismissed) ? familyEventSpeech : familyDailySpeech;
    const selectedUserSpeech = applySpeechName(
        (selectedUserEventSpeech && !eventDismissed) ? selectedUserEventSpeech : selectedUserDailySpeech,
        fuwafuwaName,
    );
    const activeSpeech = isTogetherMode ? familySpeech : selectedUserSpeech;
    const advanceConversation = () => {
        if (!hasActiveEventSpeech) {
            const { candidate, nextState } = chooseNextDailyConversation(resolvedDailyState, dailyContext, 'tap');
            if (!candidate) {
                return;
            }

            setDailyState(nextState);
            setDailySelection(candidate.selection);
            setPokeDepth(1);
            return;
        }

        if (pokeDepth >= 2) {
            setEventDismissed(true);
            setPokeDepth(0);
            const { candidate, nextState } = chooseNextDailyConversation(resolvedDailyState, dailyContext, 'tap');
            if (candidate) {
                setDailyState(nextState);
                setDailySelection(candidate.selection);
            }
            return;
        }

        setPokeDepth((currentDepth) => currentDepth + 1);
    };

    useEffect(() => {
        setEventDismissed(false);
    }, [rawEventSpeechId]);

    useEffect(() => {
        const { candidate, nextState } = chooseNextDailyConversation(
            EMPTY_DAILY_CONVERSATION_STATE,
            dailyContext,
            'initial',
        );

        setDailyState(nextState);
        setDailySelection(candidate?.selection ?? null);
        setPokeDepth(0);
    }, [
        isTogetherMode,
        selectedUser?.id,
        dailyCandidateSignature,
        dailyContext,
    ]);

    useEffect(() => {
        if (hasActiveEventSpeech) {
            setPokeDepth(0);
        }
    }, [activeSpeech.id, hasActiveEventSpeech]);

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

    useEffect(() => {
        if (idleBeatTimerRef.current !== null) {
            window.clearTimeout(idleBeatTimerRef.current);
            idleBeatTimerRef.current = null;
        }

        const isAutoRotatingSpeech = pokeDepth === 0
            && !hasActiveEventSpeech
            && Boolean(resolvedDailySelection);

        if (!isAutoRotatingSpeech) {
            return undefined;
        }

        idleBeatTimerRef.current = window.setTimeout(() => {
            const { candidate, nextState } = chooseNextDailyConversation(resolvedDailyState, dailyContext, 'tick');
            if (candidate) {
                setDailyState(nextState);
                setDailySelection(candidate.selection);
            }
            idleBeatTimerRef.current = null;
        }, 12000);

        return () => {
            if (idleBeatTimerRef.current !== null) {
                window.clearTimeout(idleBeatTimerRef.current);
                idleBeatTimerRef.current = null;
            }
        };
    }, [dailyContext, hasActiveEventSpeech, pokeDepth, resolvedDailySelection, resolvedDailyState]);

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
