import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    fetchActiveChallenges,
    fetchMyCompletions,
    fetchPastChallenges,
    type Challenge,
    type ChallengeCompletion,
} from '../../../lib/challenges';
import { fetchTeacherExercises, type TeacherExercise } from '../../../lib/teacherContent';
import type { UserProfileStore } from '../../../store/useAppStore';

interface UseHomeChallengesParams {
    users: UserProfileStore[];
    sessionUserIds: string[];
}

export function useHomeChallenges({ users, sessionUserIds }: UseHomeChallengesParams) {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [pastChallenges, setPastChallenges] = useState<Challenge[]>([]);
    const [completions, setCompletions] = useState<ChallengeCompletion[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [pastExpanded, setPastExpanded] = useState(false);

    const loadChallenges = useCallback(() => {
        fetchActiveChallenges().then(setChallenges).catch(console.warn);
        fetchPastChallenges().then(setPastChallenges).catch(console.warn);
        fetchMyCompletions().then(setCompletions).catch(console.warn);
        fetchTeacherExercises().then(setTeacherExercises).catch(console.warn);
    }, []);

    useEffect(() => {
        loadChallenges();
    }, [loadChallenges]);

    const filteredChallenges = useMemo(() => {
        const activeClassLevels = new Set<string>();

        for (const userId of sessionUserIds) {
            const user = users.find((targetUser) => targetUser.id === userId);
            if (user?.classLevel) {
                activeClassLevels.add(user.classLevel);
            }
        }

        return challenges.filter((challenge) => (
            challenge.classLevels.length === 0
            || challenge.classLevels.some((classLevel) => activeClassLevels.has(classLevel))
        ));
    }, [challenges, sessionUserIds, users]);

    return {
        filteredChallenges,
        pastChallenges,
        completions,
        teacherExercises,
        pastExpanded,
        setPastExpanded,
        loadChallenges,
    };
}
