import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { countChallengeProgressFromSessions } from '../../../lib/challenge-engine';
import { getAllSessions, getTodayKey, type SessionRecord } from '../../../lib/db';
import {
    completePersonalChallenge,
    endPersonalChallenge,
    fetchMyPersonalChallenges,
    getPersonalChallengeGoalTarget,
    toPersonalChallengeEngineInput,
    type PersonalChallenge,
} from '../../../lib/personalChallenges';
import { isChallengeDoneForToday } from '../../../lib/challenges';
import { useAppStore, type UserProfileStore } from '../../../store/useAppStore';
import { buildSessionsByUserId, filterSessionsByDate } from '../homeSessionPerformanceUtils';

export interface PersonalChallengeProgressItem {
    challenge: PersonalChallenge;
    owner: UserProfileStore | null;
    progress: number;
    todayProgress: number;
    goalTarget: number;
    canEditSetup: boolean;
}

export interface PersonalChallengeCompletionNotice {
    challengeId: string;
    title: string;
    memberId: string;
    memberName: string | null;
    rewardStars: number;
}

interface UsePersonalChallengesParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
    enabled?: boolean;
    sessions?: SessionRecord[];
    onChallengeCompleted?: (notice: PersonalChallengeCompletionNotice) => void;
}

interface PersonalChallengeBuckets {
    activeChallenges: PersonalChallengeProgressItem[];
    todayDoneChallenges: PersonalChallengeProgressItem[];
    pastChallenges: PersonalChallengeProgressItem[];
    loading: boolean;
    reload: () => void;
}

function byUpdatedAtDesc(
    left: Pick<PersonalChallenge, 'updatedAt'>,
    right: Pick<PersonalChallenge, 'updatedAt'>,
): number {
    return right.updatedAt.localeCompare(left.updatedAt);
}

export function usePersonalChallenges({
    users,
    sessionUserIds,
    enabled = true,
    sessions,
    onChallengeCompleted,
}: UsePersonalChallengesParams): PersonalChallengeBuckets {
    const [activeChallenges, setActiveChallenges] = useState<PersonalChallengeProgressItem[]>([]);
    const [todayDoneChallenges, setTodayDoneChallenges] = useState<PersonalChallengeProgressItem[]>([]);
    const [pastChallenges, setPastChallenges] = useState<PersonalChallengeProgressItem[]>([]);
    const [loading, setLoading] = useState(true);
    const addChallengeStars = useAppStore((state) => state.addChallengeStars);
    const processingIdsRef = useRef<Set<string>>(new Set());

    const visibleUserIds = useMemo(
        () => (sessionUserIds.length > 0 ? sessionUserIds : users.map((user) => user.id)),
        [sessionUserIds, users],
    );
    const usersById = useMemo(
        () => new Map(users.map((user) => [user.id, user])),
        [users],
    );

    const buildBuckets = useCallback(async (
        challenges: PersonalChallenge[],
        allowMutations: boolean,
    ) => {
        const today = getTodayKey();
        const sessionSource = sessions ?? await getAllSessions();
        const sessionsByUserId = buildSessionsByUserId(sessionSource, visibleUserIds);
        const todaySessionsByUserId = new Map<string, SessionRecord[]>();
        for (const [userId, userSessions] of sessionsByUserId) {
            todaySessionsByUserId.set(userId, filterSessionsByDate(userSessions, today));
        }
        const nextActive: PersonalChallengeProgressItem[] = [];
        const nextTodayDone: PersonalChallengeProgressItem[] = [];
        const nextPast: PersonalChallengeProgressItem[] = [];
        let mutated = false;

        for (const challenge of challenges) {
            if (!visibleUserIds.includes(challenge.memberId)) {
                continue;
            }

            const goalTarget = getPersonalChallengeGoalTarget(challenge);
            const memberSessions = sessionsByUserId.get(challenge.memberId) ?? [];
            const memberTodaySessions = todaySessionsByUserId.get(challenge.memberId) ?? [];
            const fullWindow = {
                startDate: challenge.effectiveStartDate,
                endDate: challenge.effectiveEndDate,
            };
            const progress = countChallengeProgressFromSessions(
                toPersonalChallengeEngineInput(challenge),
                memberSessions,
                [challenge.memberId],
                fullWindow,
            );
            const todayProgress = challenge.status === 'active'
                ? countChallengeProgressFromSessions(
                    toPersonalChallengeEngineInput(challenge),
                    memberTodaySessions,
                    [challenge.memberId],
                    { startDate: today, endDate: today },
                )
                : 0;

            if (challenge.status === 'active' && progress >= goalTarget && allowMutations && !processingIdsRef.current.has(challenge.id)) {
                processingIdsRef.current.add(challenge.id);
                try {
                    const completedAt = new Date().toISOString();
                    await completePersonalChallenge(challenge.id, {
                        completedAt,
                        rewardGrantedAt: challenge.rewardGrantedAt ?? completedAt,
                    });
                    const rewardStars = challenge.rewardGrantedAt ? 0 : 1;
                    if (rewardStars > 0) {
                        addChallengeStars(challenge.memberId, 1);
                    }
                    onChallengeCompleted?.({
                        challengeId: challenge.id,
                        title: challenge.title,
                        memberId: challenge.memberId,
                        memberName: usersById.get(challenge.memberId)?.name ?? null,
                        rewardStars,
                    });
                    mutated = true;
                } catch (error) {
                    console.warn('[personalChallenges] completePersonalChallenge failed:', error);
                } finally {
                    processingIdsRef.current.delete(challenge.id);
                }
                continue;
            }

            if (challenge.status === 'active' && challenge.effectiveEndDate < today && allowMutations && !processingIdsRef.current.has(challenge.id)) {
                processingIdsRef.current.add(challenge.id);
                try {
                    await endPersonalChallenge(challenge.id, 'expired');
                    mutated = true;
                } catch (error) {
                    console.warn('[personalChallenges] endPersonalChallenge failed:', error);
                } finally {
                    processingIdsRef.current.delete(challenge.id);
                }
                continue;
            }

            const item: PersonalChallengeProgressItem = {
                challenge,
                owner: usersById.get(challenge.memberId) ?? null,
                progress,
                todayProgress,
                goalTarget,
                canEditSetup: challenge.status === 'active' && progress === 0,
            };

            if (challenge.status !== 'active') {
                nextPast.push(item);
                continue;
            }

            if (isChallengeDoneForToday({
                goalType: challenge.goalType,
                dailyCap: challenge.dailyCap,
            }, todayProgress)) {
                nextTodayDone.push(item);
                continue;
            }

            nextActive.push(item);
        }

        return {
            mutated,
            activeChallenges: nextActive.sort((left, right) => byUpdatedAtDesc(left.challenge, right.challenge)),
            todayDoneChallenges: nextTodayDone.sort((left, right) => byUpdatedAtDesc(left.challenge, right.challenge)),
            pastChallenges: nextPast.sort((left, right) => byUpdatedAtDesc(left.challenge, right.challenge)),
        };
    }, [addChallengeStars, onChallengeCompleted, sessions, usersById, visibleUserIds]);

    const loadChallenges = useCallback(() => {
        let cancelled = false;

        const run = async () => {
            setLoading(true);

            const firstPass = await buildBuckets(await fetchMyPersonalChallenges(), true);
            if (cancelled) {
                return;
            }

            const result = firstPass.mutated
                ? await buildBuckets(await fetchMyPersonalChallenges(), false)
                : firstPass;

            if (cancelled) {
                return;
            }

            setActiveChallenges(result.activeChallenges);
            setTodayDoneChallenges(result.todayDoneChallenges);
            setPastChallenges(result.pastChallenges);
            setLoading(false);
        };

        run().catch((error) => {
            console.warn('[personalChallenges] load failed:', error);
            if (!cancelled) {
                setActiveChallenges([]);
                setTodayDoneChallenges([]);
                setPastChallenges([]);
                setLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [buildBuckets]);

    const reload = useCallback(() => {
        loadChallenges();
    }, [loadChallenges]);

    useEffect(() => {
        if (!enabled || sessions) {
            return;
        }

        const dispose = loadChallenges();
        return dispose;
    }, [enabled, loadChallenges, sessions]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handleSessionSaved = () => {
            reload();
        };

        window.addEventListener('sessionSaved', handleSessionSaved);
        return () => {
            window.removeEventListener('sessionSaved', handleSessionSaved);
        };
    }, [enabled, reload, sessions]);

    return {
        activeChallenges,
        todayDoneChallenges,
        pastChallenges,
        loading,
        reload,
    };
}
