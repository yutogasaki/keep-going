export type TeacherContentVisibility = 'public' | 'class_limited' | 'teacher_only';
export type TeacherExerciseVisibility = TeacherContentVisibility;
export type TeacherMenuVisibility = TeacherContentVisibility;

export const TEACHER_EXERCISE_VISIBILITY_OPTIONS: Array<{
    id: TeacherContentVisibility;
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

export function getTeacherVisibilityLabel(visibility: TeacherContentVisibility): string {
    return TEACHER_EXERCISE_VISIBILITY_OPTIONS.find((option) => option.id === visibility)?.label ?? 'みんな';
}

export function getTeacherExerciseVisibilityLabel(visibility: TeacherExerciseVisibility): string {
    return getTeacherVisibilityLabel(visibility);
}

export function isTeacherContentVisible(
    visibility: TeacherContentVisibility,
    classLevels: string[],
    classLevel: string,
): boolean {
    if (visibility === 'teacher_only' && classLevel !== '先生') {
        return false;
    }

    if (visibility === 'class_limited') {
        return classLevels.length === 0 || classLevels.includes(classLevel);
    }

    return classLevels.length === 0 || classLevels.includes(classLevel);
}

export function sortTeacherContentByRecommendation<T extends {
    name: string;
    recommended?: boolean;
    recommendedOrder?: number | null;
}>(items: T[]): T[] {
    return [...items].sort((left, right) => {
        const leftRecommended = left.recommended ? 0 : 1;
        const rightRecommended = right.recommended ? 0 : 1;
        if (leftRecommended !== rightRecommended) {
            return leftRecommended - rightRecommended;
        }

        const leftOrder = left.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
        }

        return left.name.localeCompare(right.name, 'ja');
    });
}
