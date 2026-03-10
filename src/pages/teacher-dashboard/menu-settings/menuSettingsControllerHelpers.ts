import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { TeacherItemOverride } from '../../../lib/teacherItemOverrides';
import type {
    TeacherContentDisplayMode,
    TeacherExerciseVisibility,
} from '../../../lib/teacherExerciseMetadata';
import {
    upsertTeacherMenuSetting,
    type MenuSettingItemType,
    type MenuSettingStatus,
    type TeacherMenuSetting,
} from '../../../lib/teacherMenuSettings';

export async function saveStatuses(
    itemId: string,
    itemType: MenuSettingItemType,
    statusByClass: Record<string, MenuSettingStatus> | undefined,
    teacherEmail: string,
): Promise<void> {
    if (!statusByClass) return;

    await Promise.all(
        Object.entries(statusByClass).map(([classLevel, status]) =>
            upsertTeacherMenuSetting(itemId, itemType, classLevel, status, teacherEmail)
        )
    );
}

export function getMenuSettingStatus(
    settings: TeacherMenuSetting[],
    itemId: string,
    itemType: MenuSettingItemType,
    classLevel: string,
): MenuSettingStatus {
    const found = settings.find(
        (setting) =>
            setting.itemId === itemId
            && setting.itemType === itemType
            && setting.classLevel === classLevel
    );
    return found?.status ?? 'optional';
}

export function getMenuSettingStatusByClass(
    settings: TeacherMenuSetting[],
    itemId: string,
    itemType: MenuSettingItemType,
) {
    const statusByClass: Record<string, MenuSettingStatus> = {};
    for (const classLevel of CLASS_LEVELS) {
        statusByClass[classLevel.id] = getMenuSettingStatus(settings, itemId, itemType, classLevel.id);
    }
    return statusByClass;
}

export function hasStatusByClassChanges(
    nextStatusByClass: Record<string, MenuSettingStatus> | undefined,
    currentStatusByClass: Record<string, MenuSettingStatus>,
): boolean {
    if (!nextStatusByClass) {
        return false;
    }

    const keys = new Set([
        ...Object.keys(nextStatusByClass),
        ...Object.keys(currentStatusByClass),
    ]);

    for (const key of keys) {
        if ((nextStatusByClass[key] ?? 'optional') !== (currentStatusByClass[key] ?? 'optional')) {
            return true;
        }
    }

    return false;
}

export function getTeacherItemOverride(
    overrides: TeacherItemOverride[],
    itemId: string,
    itemType: TeacherItemOverride['itemType'],
) {
    return overrides.find((override) => override.itemId === itemId && override.itemType === itemType);
}

export function buildBuiltInExerciseInitial(
    exerciseId: string,
    overrides: TeacherItemOverride[],
): TeacherExercise | null {
    const exercise = EXERCISES.find((item) => item.id === exerciseId);
    if (!exercise) return null;

const override = getTeacherItemOverride(overrides, exerciseId, 'exercise');
    return {
        id: exercise.id,
        name: override?.nameOverride ?? exercise.name,
        sec: override?.secOverride ?? exercise.sec,
        emoji: override?.emojiOverride ?? exercise.emoji,
        placement: exercise.placement,
        hasSplit: override?.hasSplitOverride ?? (exercise.hasSplit ?? false),
        description: override?.descriptionOverride ?? (exercise.description ?? ''),
        classLevels: exercise.classes as string[],
        visibility: 'public' as TeacherExerciseVisibility,
        focusTags: [],
        recommended: false,
        recommendedOrder: null,
        displayMode: 'standard_inline' as TeacherContentDisplayMode,
        createdBy: '',
        createdAt: '',
    };
}

export function buildBuiltInMenuInitial(
    menuId: string,
    overrides: TeacherItemOverride[],
): TeacherMenu | null {
    const group = PRESET_GROUPS.find((item) => item.id === menuId);
    if (!group) return null;

    const override = getTeacherItemOverride(overrides, menuId, 'menu_group');
    return {
        id: group.id,
        name: override?.nameOverride ?? group.name,
        emoji: override?.emojiOverride ?? group.emoji,
        description: override?.descriptionOverride ?? (group.description ?? ''),
        exerciseIds: override?.exerciseIdsOverride ?? group.exerciseIds,
        classLevels: [],
        visibility: 'public',
        focusTags: [],
        recommended: false,
        recommendedOrder: null,
        displayMode: 'teacher_section' as TeacherContentDisplayMode,
        createdBy: '',
        createdAt: '',
    };
}
