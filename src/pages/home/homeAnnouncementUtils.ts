import type { Challenge } from '../../lib/challenges';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';

const DAY_MS = 24 * 60 * 60 * 1000;
export const HOME_CHALLENGE_NEW_DAYS = 14;

export type HomeAnnouncementKind = 'challenge' | 'teacher_menu' | 'teacher_exercise';

export interface HomeAnnouncement {
    id: string;
    kind: HomeAnnouncementKind;
    badgeLabel: 'チャレンジ' | '先生';
    title: string;
    detail: string;
    actionLabel: string;
}

interface PickHomeAnnouncementParams {
    activeUserIds: string[];
    challenges: Challenge[];
    joinedChallengeIds: Record<string, string[]>;
    dismissedAnnouncementIds: string[];
    teacherMenuHighlights: TeacherMenu[];
    teacherExerciseHighlight: TeacherExercise | null;
    isNewTeacherContent: (id: string) => boolean;
    now?: number;
}

export function createChallengeAnnouncementId(challengeId: string): string {
    return `challenge:${challengeId}`;
}

export function createTeacherMenuAnnouncementId(menuId: string): string {
    return `teacher-menu:${menuId}`;
}

export function createTeacherExerciseAnnouncementId(exerciseId: string): string {
    return `teacher-exercise:${exerciseId}`;
}

export function isHomeChallengeNew(createdAt: string, now = Date.now()): boolean {
    const createdAtTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtTime)) {
        return false;
    }

    return now - createdAtTime <= HOME_CHALLENGE_NEW_DAYS * DAY_MS;
}

function isChallengeJoinedForAllUsers(
    challengeId: string,
    activeUserIds: string[],
    joinedChallengeIds: Record<string, string[]>,
): boolean {
    if (activeUserIds.length === 0) {
        return false;
    }

    return activeUserIds.every((userId) => (joinedChallengeIds[userId] || []).includes(challengeId));
}

export function pickHomeAnnouncement({
    activeUserIds,
    challenges,
    joinedChallengeIds,
    dismissedAnnouncementIds,
    teacherMenuHighlights,
    teacherExerciseHighlight,
    isNewTeacherContent,
    now = Date.now(),
}: PickHomeAnnouncementParams): HomeAnnouncement | null {
    const dismissedIds = new Set(dismissedAnnouncementIds);

    const challenge = challenges.find((item) => (
        isHomeChallengeNew(item.createdAt, now)
        && !dismissedIds.has(createChallengeAnnouncementId(item.id))
        && !isChallengeJoinedForAllUsers(item.id, activeUserIds, joinedChallengeIds)
    ));

    if (challenge) {
        return {
            id: createChallengeAnnouncementId(challenge.id),
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: challenge.title,
            actionLabel: 'みてみる',
        };
    }

    const teacherMenu = teacherMenuHighlights.find((menu) => (
        isNewTeacherContent(menu.id)
        && !dismissedIds.has(createTeacherMenuAnnouncementId(menu.id))
    ));

    if (teacherMenu) {
        return {
            id: createTeacherMenuAnnouncementId(teacherMenu.id),
            kind: 'teacher_menu',
            badgeLabel: '先生',
            title: 'せんせいから おすすめが とどいたよ',
            detail: teacherMenu.name,
            actionLabel: 'メニューへ',
        };
    }

    if (
        teacherExerciseHighlight
        && isNewTeacherContent(teacherExerciseHighlight.id)
        && !dismissedIds.has(createTeacherExerciseAnnouncementId(teacherExerciseHighlight.id))
    ) {
        return {
            id: createTeacherExerciseAnnouncementId(teacherExerciseHighlight.id),
            kind: 'teacher_exercise',
            badgeLabel: '先生',
            title: 'せんせいが これ どうかなって',
            detail: teacherExerciseHighlight.name,
            actionLabel: 'メニューへ',
        };
    }

    return null;
}
