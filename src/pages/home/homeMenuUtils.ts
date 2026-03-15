import { getExercisePlacementLabel } from '../../data/exercisePlacement';
import type { PublicExercise } from '../../lib/publicExercises';
import type { PublicMenu } from '../../lib/publicMenuTypes';
import {
    buildPublicMenuExercisePreview as buildPublicMenuPreviewText,
    getPublicMenuDiscoverableExercises,
    getPublicMenuMinutes as getResolvedPublicMenuMinutes,
} from '../../lib/publicMenuUtils';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import { isTeacherContentNew } from '../../lib/teacherExerciseMetadata';
import type { MenuGroup } from '../../data/menuGroups';

export function toTeacherMenuGroup(menu: TeacherMenu): MenuGroup {
    return {
        id: menu.id,
        name: menu.name,
        emoji: menu.emoji,
        description: menu.description,
        exerciseIds: menu.exerciseIds,
        isPreset: true,
        origin: 'teacher',
        visibility: menu.visibility,
        focusTags: menu.focusTags,
        recommended: menu.recommended,
        recommendedOrder: menu.recommendedOrder,
        displayMode: menu.displayMode,
    };
}

export function isRecentContent(createdAt: string, now = Date.now(), days = 7): boolean {
    const createdAtTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdAtTime)) {
        return false;
    }

    return now - createdAtTime <= days * 24 * 60 * 60 * 1000;
}

export function getTeacherMenuLead(menu: TeacherMenu, now = Date.now()): string {
    const description = menu.description.trim();
    if (description.length > 0) {
        return description;
    }

    if (menu.recommended) {
        return '先生がおすすめしているメニュー';
    }

    if (isTeacherContentNew(menu.createdAt, now)) {
        return '先生から届いた新しいメニュー';
    }

    if (menu.focusTags.length > 0) {
        return `${menu.focusTags[0]} を意識したメニュー`;
    }

    return '先生がホームに置いたメニュー';
}

export function getTeacherExerciseLead(exercise: TeacherExercise, now = Date.now()): string {
    const description = exercise.description.trim();
    if (description.length > 0) {
        return description;
    }

    if (isTeacherContentNew(exercise.createdAt, now)) {
        return '先生から届いた新しい種目';
    }

    if (exercise.recommended) {
        return '先生がおすすめしている種目';
    }

    if (exercise.focusTags.length > 0) {
        return `${exercise.focusTags[0]} を意識した種目`;
    }

    return `${getExercisePlacementLabel(exercise.placement)}の先生種目`;
}

export function pickTeacherExerciseDiscovery(
    exercises: TeacherExercise[],
    now = Date.now(),
): TeacherExercise | null {
    const discoveryExercises = exercises
        .filter((exercise) => exercise.displayMode === 'teacher_section' && isTeacherContentNew(exercise.createdAt, now))
        .sort((left, right) => {
            const leftRecommended = left.recommended ? 0 : 1;
            const rightRecommended = right.recommended ? 0 : 1;
            if (leftRecommended !== rightRecommended) {
                return leftRecommended - rightRecommended;
            }

            const leftCreatedAtTime = new Date(left.createdAt).getTime();
            const rightCreatedAtTime = new Date(right.createdAt).getTime();
            if (!Number.isNaN(leftCreatedAtTime) && !Number.isNaN(rightCreatedAtTime)
                && leftCreatedAtTime !== rightCreatedAtTime) {
                return rightCreatedAtTime - leftCreatedAtTime;
            }

            return left.name.localeCompare(right.name, 'ja');
        });

    return discoveryExercises[0] ?? null;
}

export function getPublicMenuBadgeLabel(menu: PublicMenu, now = Date.now()): string | null {
    if (getPublicMenuDiscoverableExercises(menu).length > 0) {
        return 'みんなの種目あり';
    }

    if (isRecentContent(menu.createdAt, now)) {
        return 'New';
    }

    if (menu.downloadCount > 0) {
        return '人気';
    }

    return null;
}

export function buildPublicMenuExercisePreview(menu: PublicMenu, limit = 3): string {
    return buildPublicMenuPreviewText(menu, limit);
}

export function getPublicMenuMinutes(menu: PublicMenu): number {
    return getResolvedPublicMenuMinutes(menu);
}

export function buildFeaturedExerciseCopy(exercise: PublicExercise): string {
    return `${exercise.authorName} さんの ${exercise.sec}秒の種目`;
}
