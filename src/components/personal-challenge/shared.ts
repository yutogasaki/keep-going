import { EXERCISES } from '../../data/exercises';
import { PRESET_GROUPS } from '../../data/menuGroups';
import {
    getPersonalChallengeDaysLeft,
    getPersonalChallengeGoalTarget,
    type PersonalChallenge,
} from '../../lib/personalChallenges';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';

export type PersonalChallengePresetId = 'week' | 'two_weeks' | 'month';

export interface PersonalChallengePresetOption {
    id: PersonalChallengePresetId;
    label: string;
    description: string;
    windowDays: number;
    requiredDays: number;
}

export const PERSONAL_CHALLENGE_PRESET_OPTIONS: readonly PersonalChallengePresetOption[] = [
    { id: 'week', label: '1週間', description: 'まずは 5日でやってみる', windowDays: 7, requiredDays: 5 },
    { id: 'two_weeks', label: '2週間', description: '少し長めに 10日つづける', windowDays: 14, requiredDays: 10 },
    { id: 'month', label: '1ヶ月', description: 'しっかり 20日つづける', windowDays: 30, requiredDays: 20 },
] as const;

export function findPersonalChallengePreset(
    challenge: Pick<PersonalChallenge, 'windowDays' | 'requiredDays' | 'targetCount'>,
): PersonalChallengePresetId | null {
    const goalTarget = Math.max(1, challenge.requiredDays ?? challenge.targetCount);
    const preset = PERSONAL_CHALLENGE_PRESET_OPTIONS.find((option) => (
        option.windowDays === challenge.windowDays
        && option.requiredDays === goalTarget
    ));

    return preset?.id ?? null;
}

export function getPersonalChallengeTargetName(
    challenge: Pick<PersonalChallenge, 'challengeType' | 'exerciseId' | 'targetMenuId' | 'menuSource'>,
    teacherExercises: TeacherExercise[] = [],
    teacherMenus: TeacherMenu[] = [],
): string {
    if (challenge.challengeType === 'menu') {
        if (challenge.menuSource === 'teacher') {
            return teacherMenus.find((menu) => menu.id === challenge.targetMenuId)?.name
                ?? '先生メニュー';
        }

        return PRESET_GROUPS.find((menu) => menu.id === challenge.targetMenuId)?.name
            ?? 'メニュー';
    }

    return EXERCISES.find((exercise) => exercise.id === challenge.exerciseId)?.name
        ?? teacherExercises.find((exercise) => exercise.id === challenge.exerciseId)?.name
        ?? '種目';
}

export function getPersonalChallengeEmoji(
    challenge: Pick<PersonalChallenge, 'challengeType' | 'exerciseId' | 'targetMenuId' | 'menuSource' | 'iconEmoji'>,
    teacherExercises: TeacherExercise[] = [],
    teacherMenus: TeacherMenu[] = [],
): string {
    if (challenge.iconEmoji) {
        return challenge.iconEmoji;
    }

    if (challenge.challengeType === 'menu') {
        if (challenge.menuSource === 'teacher') {
            return teacherMenus.find((menu) => menu.id === challenge.targetMenuId)?.emoji ?? '🗂️';
        }

        return PRESET_GROUPS.find((menu) => menu.id === challenge.targetMenuId)?.emoji ?? '🗂️';
    }

    return EXERCISES.find((exercise) => exercise.id === challenge.exerciseId)?.emoji
        ?? teacherExercises.find((exercise) => exercise.id === challenge.exerciseId)?.emoji
        ?? '🎯';
}

export function getPersonalChallengeGoalLabel(
    challenge: Pick<PersonalChallenge, 'goalType' | 'requiredDays' | 'targetCount'>,
    targetName: string,
): string {
    const goalTarget = getPersonalChallengeGoalTarget(challenge);
    return `${targetName}を ${goalTarget}日`;
}

export function getPersonalChallengeProgressLabel(
    challenge: Pick<PersonalChallenge, 'goalType' | 'requiredDays' | 'targetCount'>,
    progress: number,
): string {
    const goalTarget = getPersonalChallengeGoalTarget(challenge);
    return `${Math.min(progress, goalTarget)} / ${goalTarget}日`;
}

export function getPersonalChallengeDeadlineLabel(
    challenge: Pick<PersonalChallenge, 'effectiveEndDate'>,
    now = new Date(),
): string {
    return `あと${getPersonalChallengeDaysLeft(challenge, now)}日`;
}

export function getPersonalChallengeStatusLabel(
    status: PersonalChallenge['status'],
): string {
    switch (status) {
    case 'completed':
        return 'クリアしたよ';
    case 'ended_manual':
        return 'ここまでにしたよ';
    case 'ended_expired':
        return '期間が終わったよ';
    case 'active':
    default:
        return 'すすめ中';
    }
}

export function buildDefaultPersonalChallengeTitle(params: {
    challengeType: PersonalChallenge['challengeType'];
    exerciseId: string | null;
    targetMenuId: string | null;
    menuSource: PersonalChallenge['menuSource'];
    windowDays: number;
    requiredDays: number;
    teacherExercises?: TeacherExercise[];
    teacherMenus?: TeacherMenu[];
}): string {
    const targetName = getPersonalChallengeTargetName({
        challengeType: params.challengeType,
        exerciseId: params.exerciseId,
        targetMenuId: params.targetMenuId,
        menuSource: params.menuSource,
    }, params.teacherExercises, params.teacherMenus);

    return `${targetName}を ${params.windowDays}日で${params.requiredDays}日`;
}
