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

export const TEACHER_CONTENT_NEW_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

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

export function isTeacherContentNew(createdAt: string, now = Date.now()): boolean {
    const createdAtTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtTime)) {
        return false;
    }

    return now - createdAtTime <= TEACHER_CONTENT_NEW_DAYS * DAY_MS;
}

export function pickTeacherContentHighlights<T extends {
    name: string;
    createdAt: string;
    recommended?: boolean;
    recommendedOrder?: number | null;
}>(items: T[], limit = 2, now = Date.now()): T[] {
    return [...items]
        .filter((item) => item.recommended || isTeacherContentNew(item.createdAt, now))
        .sort((left, right) => {
            const leftNewPriority = isTeacherContentNew(left.createdAt, now) ? 0 : 1;
            const rightNewPriority = isTeacherContentNew(right.createdAt, now) ? 0 : 1;
            if (leftNewPriority !== rightNewPriority) {
                return leftNewPriority - rightNewPriority;
            }

            const leftRecommendedPriority = left.recommended ? 0 : 1;
            const rightRecommendedPriority = right.recommended ? 0 : 1;
            if (leftRecommendedPriority !== rightRecommendedPriority) {
                return leftRecommendedPriority - rightRecommendedPriority;
            }

            const leftRecommendedOrder = left.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
            const rightRecommendedOrder = right.recommendedOrder ?? Number.MAX_SAFE_INTEGER;
            if (leftRecommendedOrder !== rightRecommendedOrder) {
                return leftRecommendedOrder - rightRecommendedOrder;
            }

            const leftCreatedAtTime = new Date(left.createdAt).getTime();
            const rightCreatedAtTime = new Date(right.createdAt).getTime();
            if (!Number.isNaN(leftCreatedAtTime) && !Number.isNaN(rightCreatedAtTime)
                && leftCreatedAtTime !== rightCreatedAtTime) {
                return rightCreatedAtTime - leftCreatedAtTime;
            }

            return left.name.localeCompare(right.name, 'ja');
        })
        .slice(0, limit);
}
