import { useEffect, useMemo, useRef, useState } from 'react';
import type { SessionRecord } from '../../lib/db';
import { calculateFuwafuwaStatus } from '../../lib/fuwafuwa';
import type { UserProfileStore } from '../../store/useAppStore';
import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import {
    getFamilyDailySpeech,
    getFamilyEventSpeech,
    getUserDailySpeech,
    getUserEventSpeech,
    type FamilyMilestoneLead,
    type FuwafuwaDailySelection,
    type FuwafuwaSpeech,
} from './fuwafuwaHomeCardCopy';
import {
    chooseNextDailyConversation,
    EMPTY_DAILY_CONVERSATION_STATE,
    type DailyConversationCandidate,
    type DailyConversationContext,
    type DailyConversationState,
} from './fuwafuwaDailyConversation';
import { shouldShowFuwafuwaSpeech } from './fuwafuwaSpeechPresence';
import {
    getFamilyHomeContextKey,
    getSoloHomeContextKey,
    type HomeAfterglow,
} from './homeAfterglow';
import type { HomeAnnouncement } from './homeAnnouncementUtils';
import type { HomeAmbientCue } from './homeAmbientUtils';
import type { HomeVisitRecency } from './homeVisitMemory';

function applySpeechName(speech: FuwafuwaSpeech, name: string | null): FuwafuwaSpeech {
    if (!name) return speech;
    return { ...speech, lines: speech.lines.map((line) => line.split('ふわふわ').join(name)) };
}

interface UseFuwafuwaConversationParams {
    isTogetherMode: boolean;
    activeUsers: UserProfileStore[];
    selectedUser: UserProfileStore | null;
    sessionsByUserId: Map<string, SessionRecord[]>;
    milestoneEventsByUserId: Map<string, FuwafuwaMilestoneEvent>;
    recentMilestoneEvent: FuwafuwaMilestoneEvent | null;
    recentAfterglow: HomeAfterglow | null;
    announcement: HomeAnnouncement | null;
    ambientCue: HomeAmbientCue | null;
    familyVisitRecency: HomeVisitRecency;
    selectedUserVisitRecency: HomeVisitRecency;
    displaySeconds: number;
    targetSeconds: number;
    selectedUserDisplaySeconds: number;
    selectedUserTargetSeconds: number;
    isMagicDeliveryActive: boolean;
}

export function useFuwafuwaConversation({
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
}: UseFuwafuwaConversationParams) {
    const [pokeDepth, setPokeDepth] = useState(0);
    const [dailyState, setDailyState] = useState<DailyConversationState>(EMPTY_DAILY_CONVERSATION_STATE);
    const [dailySelection, setDailySelection] = useState<FuwafuwaDailySelection | null>(null);
    const [eventDismissed, setEventDismissed] = useState(false);
    const pokeResetTimerRef = useRef<number | null>(null);
    const idleBeatTimerRef = useRef<number | null>(null);

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
                selectedUserVisitRecency,
            )
            : null,
        [announcement, isMagicDeliveryActive, pokeDepth, recentMilestoneEvent, selectedUserAfterglow, selectedUserDisplaySeconds, selectedUserStatus, selectedUserTargetSeconds, selectedUserVisitRecency],
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

    return {
        familySpeech,
        selectedUserSpeech,
        shouldShowFamilySpeech,
        shouldShowSelectedUserSpeech,
        advanceConversation,
    };
}
