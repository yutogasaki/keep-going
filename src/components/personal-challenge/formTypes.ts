import type { PersonalChallengeExerciseSource, PersonalChallengeMenuSourceOption, PersonalChallengePresetId } from './shared';

export type PersonalChallengeType = 'exercise' | 'menu';
export type ExerciseSource = PersonalChallengeExerciseSource;
export type MenuSource = PersonalChallengeMenuSourceOption;

export interface PersonalChallengeCreateSeed {
    challengeType: PersonalChallengeType;
    presetId?: PersonalChallengePresetId;
    exerciseSource?: ExerciseSource;
    menuSource?: MenuSource;
    exerciseId?: string | null;
    targetMenuId?: string | null;
    title?: string;
    description?: string | null;
    iconEmoji?: string | null;
}

export interface PersonalChallengeTargetOption {
    id: string;
    name: string;
    emoji: string;
}
