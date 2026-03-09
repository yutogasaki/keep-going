export type TeacherExerciseVisibility = 'public' | 'class_limited' | 'teacher_only';

export const TEACHER_EXERCISE_VISIBILITY_OPTIONS: Array<{
    id: TeacherExerciseVisibility;
    label: string;
    description: string;
}> = [
    { id: 'public', label: 'みんな', description: '対象クラスのみんなに見せる' },
    { id: 'class_limited', label: 'クラス限定', description: '対象クラスを意識して使う' },
    { id: 'teacher_only', label: '先生だけ', description: '先生の編集画面だけで使う' },
];

export const TEACHER_FOCUS_TAG_OPTIONS = [
    '開脚',
    '前後開脚',
    '横開脚',
    '体幹',
    '姿勢',
    '足先',
    'バランス',
    'バレエ前',
    'リラックス',
] as const;

export function getTeacherExerciseVisibilityLabel(visibility: TeacherExerciseVisibility): string {
    return TEACHER_EXERCISE_VISIBILITY_OPTIONS.find((option) => option.id === visibility)?.label ?? 'みんな';
}
