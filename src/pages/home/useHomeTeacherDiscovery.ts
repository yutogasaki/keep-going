import { useMemo } from 'react';
import { EXERCISES, type ClassLevel } from '../../data/exercises';
import type { Challenge } from '../../lib/challenges';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import { useTeacherContent } from '../../hooks/useTeacherContent';
import { pickTeacherContentHighlights } from '../../lib/teacherExerciseMetadata';
import { pickHomeAnnouncement } from './homeAnnouncementUtils';
import { selectHomeTeacherChallenges } from './homeChallengeSelection';
import { pickTeacherExerciseDiscovery } from './homeMenuUtils';

const noop = () => {};

interface UseHomeTeacherDiscoveryParams {
    currentClassLevel: ClassLevel;
    activeAnnouncementUserIds: string[];
    activeHomeUserIds: string[];
    filteredChallenges: Challenge[];
    todayDoneChallenges: Challenge[];
    joinedChallengeIds: Record<string, string[]>;
    dismissedHomeAnnouncementIds: string[];
}

export function useHomeTeacherDiscovery({
    currentClassLevel,
    activeAnnouncementUserIds,
    activeHomeUserIds,
    filteredChallenges,
    todayDoneChallenges,
    joinedChallengeIds,
    dismissedHomeAnnouncementIds,
}: UseHomeTeacherDiscoveryParams) {
    const teacherContent = useTeacherContent({
        classLevel: currentClassLevel,
        onLoadError: noop,
    });
    const teacherMenuHighlights = useMemo(
        () => pickTeacherContentHighlights(
            teacherContent.teacherMenus.filter((menu) => menu.displayMode === 'teacher_section'),
            2,
        ),
        [teacherContent.teacherMenus],
    );
    const teacherExerciseHighlight = useMemo(
        () => pickTeacherExerciseDiscovery(teacherContent.teacherExercises),
        [teacherContent.teacherExercises],
    );
    const teacherMenuExerciseMap = useMemo(() => {
        const map = new Map<string, {
            name: string;
            emoji: string;
            sec: number;
            placement: ExercisePlacement;
        }>();

        for (const exercise of EXERCISES) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }

        for (const exercise of teacherContent.teacherExercises) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }

        return map;
    }, [teacherContent.teacherExercises]);
    const homeAnnouncement = useMemo(
        () => pickHomeAnnouncement({
            activeUserIds: activeAnnouncementUserIds,
            challenges: filteredChallenges,
            joinedChallengeIds,
            dismissedAnnouncementIds: dismissedHomeAnnouncementIds,
            teacherMenuHighlights,
            teacherExerciseHighlight,
            isNewTeacherContent: teacherContent.isNewTeacherContent,
        }),
        [
            activeAnnouncementUserIds,
            dismissedHomeAnnouncementIds,
            filteredChallenges,
            joinedChallengeIds,
            teacherContent.isNewTeacherContent,
            teacherExerciseHighlight,
            teacherMenuHighlights,
        ],
    );
    const { joinedTeacherChallenges, recommendedTeacherChallenge } = useMemo(
        () => selectHomeTeacherChallenges({
            activeUserIds: activeHomeUserIds,
            availableChallenges: filteredChallenges,
            todayDoneChallenges,
            joinedChallengeIds,
        }),
        [activeHomeUserIds, filteredChallenges, joinedChallengeIds, todayDoneChallenges],
    );

    return {
        teacherContent,
        teacherMenuHighlights,
        teacherExerciseHighlight,
        teacherMenuExerciseMap,
        homeAnnouncement,
        joinedTeacherChallenges,
        recommendedTeacherChallenge,
    };
}
