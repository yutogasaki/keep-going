import type { CustomExercise } from '../../../lib/db';
import { PUBLIC_MENU_UNSUPPORTED_EXERCISE_ERROR } from '../../../lib/publicMenus';
import type { TeacherExercise } from '../../../lib/teacherContent';
import type { PickerExercise } from './ExercisePickerList';

export const EMOJI_OPTIONS = ['🌸', '💪', '🦵', '🩰', '⭐', '🌈', '🔥', '💃', '🧘', '🎯', '✨', '🌙'];
export const DEFAULT_INLINE_EMOJI = '✨';
export const DEFAULT_INLINE_PLACEMENT = 'stretch';
export const DEFAULT_INLINE_INTERNAL = 'single';

export interface QuickAddDraft {
    name: string;
    sec: number;
    saveAsCustom: boolean;
}

export const DEFAULT_QUICK_ADD_DRAFT: QuickAddDraft = {
    name: '',
    sec: 30,
    saveAsCustom: false,
};

export function getMenuPublishErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message === PUBLIC_MENU_UNSUPPORTED_EXERCISE_ERROR) {
        return '先生の種目が入っているメニューは公開できないよ';
    }

    return '公開の更新に失敗しました。もう一度ためしてみてね。';
}

export function toPickerExercise(exercise: CustomExercise | TeacherExercise): PickerExercise {
    return {
        id: exercise.id,
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        splitLabel: exercise.hasSplit ? 'みぎ→ひだり' : undefined,
        placement: exercise.placement,
    };
}
