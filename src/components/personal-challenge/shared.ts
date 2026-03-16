import type { MenuGroup } from '../../data/menuGroups';
import { EXERCISES } from '../../data/exercises';
import { PRESET_GROUPS } from '../../data/menuGroups';
import type { CustomExercise } from '../../lib/db';
import {
    getPersonalChallengeDaysLeft,
    getPersonalChallengeGoalTarget,
    type PersonalChallenge,
} from '../../lib/personalChallenges';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';

export type PersonalChallengePresetId = 'week' | 'two_weeks' | 'month';
export type PersonalChallengeExerciseSource = 'standard' | 'teacher' | 'custom';
export type PersonalChallengeMenuSourceOption = 'preset' | 'teacher' | 'custom';

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
    customExercises: CustomExercise[] = [],
    customMenus: MenuGroup[] = [],
): string {
    return resolvePersonalChallengeTargetMeta(
        challenge,
        teacherExercises,
        teacherMenus,
        customExercises,
        customMenus,
    ).name;
}

export function getPersonalChallengeEmoji(
    challenge: Pick<PersonalChallenge, 'challengeType' | 'exerciseId' | 'targetMenuId' | 'menuSource' | 'iconEmoji'>,
    teacherExercises: TeacherExercise[] = [],
    teacherMenus: TeacherMenu[] = [],
    customExercises: CustomExercise[] = [],
    customMenus: MenuGroup[] = [],
): string {
    if (challenge.iconEmoji) {
        return challenge.iconEmoji;
    }

    return resolvePersonalChallengeTargetMeta(
        challenge,
        teacherExercises,
        teacherMenus,
        customExercises,
        customMenus,
    ).emoji;
}

export function isPersonalChallengeTargetMissing(
    challenge: Pick<PersonalChallenge, 'challengeType' | 'exerciseId' | 'targetMenuId' | 'menuSource'>,
    teacherExercises: TeacherExercise[] = [],
    teacherMenus: TeacherMenu[] = [],
    customExercises: CustomExercise[] = [],
    customMenus: MenuGroup[] = [],
): boolean {
    return resolvePersonalChallengeTargetMeta(
        challenge,
        teacherExercises,
        teacherMenus,
        customExercises,
        customMenus,
    ).missing;
}

export function inferPersonalChallengeExerciseSource(
    exerciseId: string | null | undefined,
    teacherExercises: TeacherExercise[] = [],
    customExercises: CustomExercise[] = [],
): PersonalChallengeExerciseSource {
    if (!exerciseId) {
        return 'standard';
    }

    if (teacherExercises.some((exercise) => exercise.id === exerciseId) || exerciseId.startsWith('teacher-')) {
        return 'teacher';
    }

    if (customExercises.some((exercise) => exercise.id === exerciseId) || exerciseId.startsWith('custom-ex-')) {
        return 'custom';
    }

    return 'standard';
}

export function inferPersonalChallengeMenuSource(
    menuSource: PersonalChallenge['menuSource'] | null | undefined,
    targetMenuId: string | null | undefined,
    teacherMenus: TeacherMenu[] = [],
    customMenus: MenuGroup[] = [],
): PersonalChallengeMenuSourceOption {
    if (menuSource === 'teacher') {
        return 'teacher';
    }

    if (menuSource === 'custom' || menuSource === 'public') {
        return 'custom';
    }

    if (targetMenuId && teacherMenus.some((menu) => menu.id === targetMenuId)) {
        return 'teacher';
    }

    if (targetMenuId && customMenus.some((menu) => menu.id === targetMenuId)) {
        return 'custom';
    }

    if (targetMenuId?.startsWith('teacher-menu-')) {
        return 'teacher';
    }

    if (targetMenuId?.startsWith('custom-')) {
        return 'custom';
    }

    return 'preset';
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
    customExercises?: CustomExercise[];
    customMenus?: MenuGroup[];
}): string {
    const targetName = getPersonalChallengeTargetName({
        challengeType: params.challengeType,
        exerciseId: params.exerciseId,
        targetMenuId: params.targetMenuId,
        menuSource: params.menuSource,
    }, params.teacherExercises, params.teacherMenus, params.customExercises, params.customMenus);

    return `${targetName}を ${params.windowDays}日で${params.requiredDays}日`;
}

interface PersonalChallengeTargetMeta {
    name: string;
    emoji: string;
    missing: boolean;
}

function resolvePersonalChallengeTargetMeta(
    challenge: Pick<PersonalChallenge, 'challengeType' | 'exerciseId' | 'targetMenuId' | 'menuSource'>,
    teacherExercises: TeacherExercise[] = [],
    teacherMenus: TeacherMenu[] = [],
    customExercises: CustomExercise[] = [],
    customMenus: MenuGroup[] = [],
): PersonalChallengeTargetMeta {
    if (challenge.challengeType === 'menu') {
        if (challenge.menuSource === 'teacher') {
            const menu = teacherMenus.find((item) => item.id === challenge.targetMenuId);
            return menu
                ? { name: menu.name, emoji: menu.emoji, missing: false }
                : {
                    name: '見つからない先生メニュー',
                    emoji: '⚠️',
                    missing: true,
                };
        }

        if (challenge.menuSource === 'custom') {
            const menu = customMenus.find((item) => item.id === challenge.targetMenuId);
            return menu
                ? { name: menu.name, emoji: menu.emoji, missing: false }
                : {
                    name: '見つからないもらったメニュー',
                    emoji: '⚠️',
                    missing: true,
                };
        }

        if (challenge.menuSource === 'public') {
            return challenge.targetMenuId
                ? { name: 'みんなのメニュー', emoji: '🌍', missing: false }
                : { name: '見つからない公開メニュー', emoji: '⚠️', missing: true };
        }

        const menu = PRESET_GROUPS.find((item) => item.id === challenge.targetMenuId);
        return menu
            ? { name: menu.name, emoji: menu.emoji, missing: false }
            : {
                name: '見つからないメニュー',
                emoji: '⚠️',
                missing: true,
            };
    }

    const exercise = EXERCISES.find((item) => item.id === challenge.exerciseId)
        ?? teacherExercises.find((item) => item.id === challenge.exerciseId)
        ?? customExercises.find((item) => item.id === challenge.exerciseId);

    if (exercise) {
        return {
            name: exercise.name,
            emoji: exercise.emoji,
            missing: false,
        };
    }

    if (challenge.exerciseId?.startsWith('teacher-')) {
        return {
            name: '見つからない先生の種目',
            emoji: '⚠️',
            missing: true,
        };
    }

    if (challenge.exerciseId?.startsWith('custom-ex-')) {
        return {
            name: '見つからないもらった種目',
            emoji: '⚠️',
            missing: true,
        };
    }

    return {
        name: '見つからない種目',
        emoji: '⚠️',
        missing: true,
    };
}
