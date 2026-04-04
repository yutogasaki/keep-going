import type { ClassLevel } from '../data/exercises';
import type { MenuSettingStatus, TeacherMenuSetting } from './teacherMenuSettings';

export interface EffectiveExerciseMenuSetting {
    itemId: string;
    defaultStatus: MenuSettingStatus | null;
    teacherStatus: MenuSettingStatus | null;
    userStatus: MenuSettingStatus | null;
    inheritedStatus: MenuSettingStatus;
    effectiveStatus: MenuSettingStatus;
}

interface BuildEffectiveExerciseSettingsParams {
    classLevel: ClassLevel;
    exerciseIds: string[];
    teacherSettings: TeacherMenuSetting[];
    userRequiredExerciseIds: string[];
    userExcludedExerciseIds: string[];
}

const CLASS_DEFAULT_REQUIRED_IDS: Record<ClassLevel, string[]> = {
    '先生': ['S07', 'S02', 'S01', 'S03', 'S05', 'S10', 'C01'],
    'プレ': ['S07', 'S01', 'S02', 'S05', 'S06', 'S08'],
    '初級': ['S07', 'S02', 'S01', 'S03', 'S05', 'S10'],
    '中級': ['S07', 'S02', 'S01', 'S03', 'S05', 'S10', 'C01'],
    '上級': ['S07', 'S02', 'S01', 'S03', 'S05', 'S10', 'C01'],
    'その他': ['S07', 'S02', 'S01', 'S03', 'S05', 'S10'],
};

function dedupeIds(ids: string[]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (const id of ids) {
        if (!id || seen.has(id)) {
            continue;
        }

        seen.add(id);
        ordered.push(id);
    }

    return ordered;
}

function buildTeacherExerciseStatusMap(settings: TeacherMenuSetting[]): Map<string, MenuSettingStatus> {
    const map = new Map<string, MenuSettingStatus>();

    for (const setting of settings) {
        if (setting.itemType !== 'exercise') {
            continue;
        }

        map.set(setting.itemId, setting.status);
    }

    return map;
}

export function getClassDefaultRequiredExerciseIds(classLevel: ClassLevel): string[] {
    return [...(CLASS_DEFAULT_REQUIRED_IDS[classLevel] ?? CLASS_DEFAULT_REQUIRED_IDS['初級'])];
}

export function getClassDefaultExerciseSettings(classLevel: ClassLevel): TeacherMenuSetting[] {
    return getClassDefaultRequiredExerciseIds(classLevel).map((itemId) => ({
        id: `default:${classLevel}:${itemId}`,
        itemId,
        itemType: 'exercise',
        classLevel,
        status: 'required',
        createdBy: 'system-default',
    }));
}

export function getUserExerciseMenuStatus(
    itemId: string,
    userRequiredExerciseIds: string[],
    userExcludedExerciseIds: string[],
): MenuSettingStatus | null {
    const isRequired = userRequiredExerciseIds.includes(itemId);
    const isExcluded = userExcludedExerciseIds.includes(itemId);

    if (isRequired && isExcluded) {
        return 'optional';
    }

    if (isRequired) {
        return 'required';
    }

    if (isExcluded) {
        return 'excluded';
    }

    return null;
}

export function resolveInheritedExerciseStatus(
    defaultStatus: MenuSettingStatus | null,
    teacherStatus: MenuSettingStatus | null,
): MenuSettingStatus {
    if (teacherStatus != null) {
        return teacherStatus;
    }

    return defaultStatus ?? 'optional';
}

export function resolveEffectiveExerciseStatus(
    defaultStatus: MenuSettingStatus | null,
    teacherStatus: MenuSettingStatus | null,
    userStatus: MenuSettingStatus | null,
): MenuSettingStatus {
    const inheritedStatus = resolveInheritedExerciseStatus(defaultStatus, teacherStatus);

    if (inheritedStatus === 'hidden') {
        return 'hidden';
    }

    return userStatus ?? inheritedStatus;
}

export function buildEffectiveExerciseSettings({
    classLevel,
    exerciseIds,
    teacherSettings,
    userRequiredExerciseIds,
    userExcludedExerciseIds,
}: BuildEffectiveExerciseSettingsParams): EffectiveExerciseMenuSetting[] {
    const defaultStatusMap = buildTeacherExerciseStatusMap(getClassDefaultExerciseSettings(classLevel));
    const teacherStatusMap = buildTeacherExerciseStatusMap(teacherSettings);

    return dedupeIds(exerciseIds).map((itemId) => {
        const defaultStatus = defaultStatusMap.get(itemId) ?? null;
        const teacherStatus = teacherStatusMap.get(itemId) ?? null;
        const userStatus = getUserExerciseMenuStatus(itemId, userRequiredExerciseIds, userExcludedExerciseIds);
        const inheritedStatus = resolveInheritedExerciseStatus(defaultStatus, teacherStatus);
        const effectiveStatus = resolveEffectiveExerciseStatus(defaultStatus, teacherStatus, userStatus);

        return {
            itemId,
            defaultStatus,
            teacherStatus,
            userStatus,
            inheritedStatus,
            effectiveStatus,
        };
    });
}

export function getEffectiveExerciseSettingMap(
    params: BuildEffectiveExerciseSettingsParams,
): Map<string, EffectiveExerciseMenuSetting> {
    return new Map(
        buildEffectiveExerciseSettings(params).map((setting) => [setting.itemId, setting]),
    );
}

export function getOrderedEffectiveRequiredExerciseIds({
    classLevel,
    exerciseIds,
    teacherSettings,
    userRequiredExerciseIds,
    userExcludedExerciseIds,
}: BuildEffectiveExerciseSettingsParams): string[] {
    const effectiveMap = getEffectiveExerciseSettingMap({
        classLevel,
        exerciseIds,
        teacherSettings,
        userRequiredExerciseIds,
        userExcludedExerciseIds,
    });
    const defaultRequiredIds = getClassDefaultRequiredExerciseIds(classLevel).filter(
        (itemId) => effectiveMap.get(itemId)?.effectiveStatus === 'required',
    );
    const remainingRequiredIds = dedupeIds(exerciseIds).filter(
        (itemId) => effectiveMap.get(itemId)?.effectiveStatus === 'required' && !defaultRequiredIds.includes(itemId),
    );

    return [...defaultRequiredIds, ...remainingRequiredIds];
}

export function getEffectiveExcludedExerciseIds(
    params: BuildEffectiveExerciseSettingsParams,
): string[] {
    return buildEffectiveExerciseSettings(params)
        .filter((setting) => setting.effectiveStatus === 'excluded' || setting.effectiveStatus === 'hidden')
        .map((setting) => setting.itemId);
}
