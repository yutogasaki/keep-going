/**
 * テスト用共通ファクトリ関数
 *
 * テストファイルで重複していたファクトリをここに集約する。
 * 新しいテストを書くときはここから import して使う。
 */
import type { UserProfileStore } from '../store/useAppStore';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import type { CustomExercise } from '../lib/db';
import type { MenuGroup } from '../data/menuGroups';

export function createUser(id: string, overrides: Partial<UserProfileStore> = {}): UserProfileStore {
    return {
        id,
        name: overrides.name ?? `user-${id}`,
        classLevel: overrides.classLevel ?? '初級',
        fuwafuwaBirthDate: overrides.fuwafuwaBirthDate ?? '2026-03-01',
        fuwafuwaType: overrides.fuwafuwaType ?? 1,
        fuwafuwaCycleCount: overrides.fuwafuwaCycleCount ?? 1,
        fuwafuwaName: overrides.fuwafuwaName ?? null,
        pastFuwafuwas: overrides.pastFuwafuwas ?? [],
        notifiedFuwafuwaStages: overrides.notifiedFuwafuwaStages ?? [],
        dailyTargetMinutes: overrides.dailyTargetMinutes ?? 10,
        excludedExercises: overrides.excludedExercises ?? [],
        requiredExercises: overrides.requiredExercises ?? [],
        consumedMagicSeconds: overrides.consumedMagicSeconds ?? 0,
        chibifuwas: overrides.chibifuwas ?? [],
    };
}

export function createTeacherExercise(overrides: Partial<TeacherExercise> = {}): TeacherExercise {
    return {
        id: overrides.id ?? 'teacher-ex-1',
        name: overrides.name ?? '先生のストレッチ',
        emoji: overrides.emoji ?? '🧑‍🏫',
        sec: overrides.sec ?? 30,
        placement: overrides.placement ?? 'ending',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description ?? '',
        classLevels: overrides.classLevels ?? ['all'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher-1',
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

export function createTeacherMenu(overrides: Partial<TeacherMenu> = {}): TeacherMenu {
    return {
        id: overrides.id ?? 'teacher-menu-1',
        name: overrides.name ?? '先生メニュー',
        description: overrides.description ?? '',
        emoji: overrides.emoji ?? '📚',
        exerciseIds: overrides.exerciseIds ?? ['teacher-ex-1'],
        classLevels: overrides.classLevels ?? ['all'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher-1',
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

export function createCustomExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return {
        id: overrides.id ?? 'custom-ex-1',
        name: overrides.name ?? 'もらった種目',
        sec: overrides.sec ?? 45,
        emoji: overrides.emoji ?? '🌟',
        placement: overrides.placement ?? 'prep',
        description: overrides.description,
        creatorId: overrides.creatorId ?? 'member-1',
    };
}

export function createMenuGroup(overrides: Partial<MenuGroup> = {}): MenuGroup {
    return {
        id: overrides.id ?? 'menu-1',
        name: overrides.name ?? 'テストメニュー',
        emoji: overrides.emoji ?? '🌸',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds ?? ['S01'],
        items: overrides.items,
        isPreset: overrides.isPreset ?? false,
        creatorId: overrides.creatorId,
    };
}
