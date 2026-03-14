import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { countChallengeProgressFromSessions } from '../../../lib/challenge-engine';
import { getAllSessions, getTodayKey } from '../../../lib/db';
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

export interface PersonalChallengeProgressItem {
    challenge: PersonalChallenge;
    owner: UserProfileStore | null;
    progress: number;
    todayProgress: number;
    goalTarget: number;
    canEditSetup: boolean;
}

interface UsePersonalChallengesParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
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
        const sessions = await getAllSessions();
        const nextActive: PersonalChallengeProgressItem[] = [];
        const nextTodayDone: PersonalChallengeProgressItem[] = [];
        const nextPast: PersonalChallengeProgressItem[] = [];
        let mutated = false;

        for (const challenge of challenges) {
            if (!visibleUserIds.includes(challenge.memberId)) {
                continue;
            }

            const goalTarget = getPersonalChallengeGoalTarget(challenge);
            const fullWindow = {
                startDate: challenge.effectiveStartDate,
                endDate: challenge.effectiveEndDate,
            };
            const progress = countChallengeProgressFromSessions(
                toPersonalChallengeEngineInput(challenge),
                sessions,
                [challenge.memberId],
                fullWindow,
            );
            const todayProgress = challenge.status === 'active'
                ? countChallengeProgressFromSessions(
                    toPersonalChallengeEngineInput(challenge),
                    sessions,
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
                    if (!challenge.rewardGrantedAt) {
                        addChallengeStars(challenge.memberId, 1);
                    }
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
    }, [addChallengeStars, usersById, visibleUserIds]);

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
        const dispose = loadChallenges();
        return dispose;
    }, [loadChallenges]);

    useEffect(() => {
        const handleSessionSaved = () => {
            reload();
        };

        window.addEventListener('sessionSaved', handleSessionSaved);
        return () => {
            window.removeEventListener('sessionSaved', handleSessionSaved);
        };
    }, [reload]);

    return {
        activeChallenges,
        todayDoneChallenges,
        pastChallenges,
        loading,
        reload,
    };
}
