import { useCallback, useEffect, useMemo, useState } from 'react';
import { countChallengeProgressFromSessions } from '../../../lib/challenge-engine';
import {
    fetchAllChallenges,
    fetchMyEnrollments,
    fetchMyCompletions,
    fetchMyChallengeRewardGrants,
    buildChallengeEnrollmentState,
    getChallengeActiveWindow,
    getChallengeGoalTarget,
    isChallengeDoneForToday,
    isChallengeFinishedOverall,
    isChallengePastForUsers,
    isChallengePublishedOnDate,
    type Challenge,
    type ChallengeCompletion,
    type ChallengeRewardGrant,
} from '../../../lib/challenges';
import { getAllSessions, getTodayKey } from '../../../lib/db';
import { fetchTeacherExercises, type TeacherExercise } from '../../../lib/teacherContent';
import { useAppStore, type UserProfileStore } from '../../../store/useAppStore';
import { isTeacherChallengeCompletedToday } from '../challengeRewardUtils';

interface UseHomeChallengesParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
}

export function useHomeChallenges({ users, sessionUserIds }: UseHomeChallengesParams) {
    const [allChallenges, setAllChallenges] = useState<Challenge[]>([]);
    const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
    const [todayDoneChallenges, setTodayDoneChallenges] = useState<Challenge[]>([]);
    const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
    const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
    const [rewardGrants, setRewardGrants] = useState<ChallengeRewardGrant[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [pastExpanded, setPastExpanded] = useState(false);
    const hydrateChallengeEnrollmentState = useAppStore((state) => state.hydrateChallengeEnrollmentState);
    const joinedChallengeIds = useAppStore((state) => state.joinedChallengeIds);
    const challengeEnrollmentWindows = useAppStore((state) => state.challengeEnrollmentWindows);

    const loadChallenges = useCallback(() => {
        fetchAllChallenges().then(setAllChallenges).catch(console.warn);
        fetchMyCompletions().then(setCompletions).catch(console.warn);
        fetchMyChallengeRewardGrants().then(setRewardGrants).catch(console.warn);
        fetchMyEnrollments()
            .then((enrollments) => {
                const enrollmentState = buildChallengeEnrollmentState(enrollments);
                hydrateChallengeEnrollmentState(
                    enrollmentState.joinedChallengeIds,
                    enrollmentState.challengeEnrollmentWindows,
                );
            })
            .catch(console.warn);
        fetchTeacherExercises().then(setTeacherExercises).catch(console.warn);
    }, [hydrateChallengeEnrollmentState]);

    useEffect(() => {
        loadChallenges();
    }, [loadChallenges]);

    useEffect(() => {
        const handleSessionSaved = () => {
            loadChallenges();
        };

        window.addEventListener('sessionSaved', handleSessionSaved);
        return () => {
            window.removeEventListener('sessionSaved', handleSessionSaved);
        };
    }, [loadChallenges]);

    const classMatchedChallenges = useMemo(() => {
        const activeClassLevels = new Set<string>();

        for (const userId of sessionUserIds) {
            const user = users.find((targetUser) => targetUser.id === userId);
            if (user?.classLevel) {
                activeClassLevels.add(user.classLevel);
            }
        }

        return allChallenges.filter((challenge) => (
            challenge.classLevels.length === 0
            || challenge.classLevels.some((classLevel) => activeClassLevels.has(classLevel))
        ));
    }, [allChallenges, sessionUserIds, users]);

    const activeUserIds = useMemo(
        () => (sessionUserIds.length > 0 ? sessionUserIds : users.map((user) => user.id)),
        [sessionUserIds, users],
    );

    useEffect(() => {
        let cancelled = false;
        const today = getTodayKey();

        const computeBuckets = async () => {
            const nextAvailable: Challenge[] = [];
            const nextTodayDone: Challenge[] = [];
            const nextPast: Challenge[] = [];
            const sessions = await getAllSessions();

            for (const challenge of classMatchedChallenges) {
                const relevantCompletions = completions.filter(
                    (completion) => completion.challengeId === challenge.id && activeUserIds.includes(completion.memberId),
                );
                const completedUserIds = new Set(relevantCompletions.map((completion) => completion.memberId));
                const finishedOverall = isChallengeFinishedOverall(activeUserIds, completedUserIds);
                const joined = activeUserIds.some((userId) => (joinedChallengeIds[userId] || []).includes(challenge.id));
                const effectiveWindow = activeUserIds
                    .map((userId) => challengeEnrollmentWindows[userId]?.[challenge.id] ?? null)
                    .find((window): window is NonNullable<typeof window> => Boolean(window)) ?? null;

                if (finishedOverall) {
                    if (isTeacherChallengeCompletedToday({
                        challengeId: challenge.id,
                        activeUserIds,
                        completions: relevantCompletions,
                        today,
                    })) {
                        nextTodayDone.push(challenge);
                        continue;
                    }

                    nextPast.push(challenge);
                    continue;
                }

                if (isChallengePastForUsers(challenge, today, effectiveWindow)) {
                    nextPast.push(challenge);
                    continue;
                }

                // Keep already-started seasonal rolling challenges visible until their own window ends.
                if (!joined && !isChallengePublishedOnDate(challenge, today)) {
                    continue;
                }

                if (!joined) {
                    nextAvailable.push(challenge);
                    continue;
                }

                const activeWindow = getChallengeActiveWindow(challenge, effectiveWindow);
                if (activeWindow.startDate > today) {
                    nextAvailable.push(challenge);
                    continue;
                }

                const todayProgress = countChallengeProgressFromSessions({
                    challengeType: challenge.challengeType,
                    exerciseId: challenge.exerciseId,
                    targetMenuId: challenge.targetMenuId,
                    menuSource: challenge.menuSource,
                    targetCount: getChallengeGoalTarget(challenge),
                    dailyCap: challenge.dailyCap,
                    countUnit: challenge.countUnit,
                    startDate: challenge.startDate,
                    endDate: challenge.endDate,
                    windowType: challenge.windowType,
                    goalType: challenge.goalType,
                    windowDays: challenge.windowDays,
                    dailyMinimumMinutes: challenge.dailyMinimumMinutes,
                }, sessions, activeUserIds, {
                    startDate: today,
                    endDate: today,
                    joinedAt: effectiveWindow?.joinedAt ?? null,
                });

                if (isChallengeDoneForToday(challenge, todayProgress)) {
                    nextTodayDone.push(challenge);
                    continue;
                }

                nextAvailable.push(challenge);
            }

            if (cancelled) {
                return;
            }

            setFilteredChallenges(nextAvailable);
            setTodayDoneChallenges(nextTodayDone);
            setPastChallenges(nextPast);
        };

        computeBuckets().catch((error) => {
            console.warn('[home] Failed to bucket challenges:', error);
            if (!cancelled) {
                setFilteredChallenges(classMatchedChallenges);
                setTodayDoneChallenges([]);
                setPastChallenges([]);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [
        activeUserIds,
        challengeEnrollmentWindows,
        classMatchedChallenges,
        completions,
        joinedChallengeIds,
    ]);

    return {
        filteredChallenges,
        todayDoneChallenges,
        pastChallenges,
        completions,
        rewardGrants,
        teacherExercises,
        pastExpanded,
        setPastExpanded,
        loadChallenges,
    };
}
