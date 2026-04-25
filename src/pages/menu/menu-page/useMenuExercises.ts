import { useMemo } from 'react';
import { DEFAULT_SESSION_TARGET_SECONDS, EXERCISES, getExercisesByClass, type Exercise } from '../../../data/exercises';
import { EXERCISE_PLACEMENTS } from '../../../data/exercisePlacement';
import type { MenuGroup } from '../../../data/menuGroups';
import type { CustomExercise } from '../../../lib/db';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { ClassLevel } from '../../../data/exercises';
import type { TeacherContentDisplayMode } from '../../../lib/teacherExerciseMetadata';
import {
    buildEffectiveExerciseSettings,
    getOrderedEffectiveRequiredExerciseIds,
} from '../../../lib/menuExerciseSettings';
import type { MenuOverrideMap } from './shared';
import { sortTeacherContentByRecommendation } from '../../../lib/teacherExerciseMetadata';
import type { TeacherMenuSetting } from '../../../lib/teacherMenuSettings';

interface UseMenuExercisesParams {
    classLevel: ClassLevel;
    presets: MenuGroup[];
    customExercises: CustomExercise[];
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    teacherSettings: TeacherMenuSetting[];
    teacherHiddenExerciseIds: Set<string>;
    teacherHiddenMenuIds: Set<string>;
    overrideMap: MenuOverrideMap;
    requiredExercises: string[];
    excludedExercises: string[];
}

export function orderMenuExercisesForDisplay(
    builtInExercises: Exercise[],
    restExercises: Exercise[],
    teacherExercises: Exercise[],
): Exercise[] {
    const inlineTeacherExercises = teacherExercises.filter((exercise) => exercise.displayMode === 'standard_inline');
    const teacherSectionExercises = sortTeacherContentByRecommendation(
        teacherExercises.filter((exercise) => exercise.displayMode !== 'standard_inline'),
    );
    const standardBuiltInExercises = [...builtInExercises, ...restExercises];

    return [
        ...EXERCISE_PLACEMENTS.flatMap((placement) => [
            ...standardBuiltInExercises.filter((exercise) => exercise.placement === placement),
            ...sortTeacherContentByRecommendation(
                inlineTeacherExercises.filter((exercise) => exercise.placement === placement),
            ),
        ]),
        ...teacherSectionExercises,
    ];
}

export function orderMenuGroupsForDisplay(presetGroups: MenuGroup[], teacherGroups: MenuGroup[]): MenuGroup[] {
    return [
        ...presetGroups,
        ...sortTeacherContentByRecommendation(teacherGroups.filter((group) => group.displayMode === 'standard_inline')),
        ...sortTeacherContentByRecommendation(teacherGroups.filter((group) => group.displayMode !== 'standard_inline')),
    ];
}

export function useMenuExercises({
    classLevel,
    presets,
    customExercises,
    teacherExercises,
    teacherMenus,
    teacherSettings,
    teacherHiddenExerciseIds,
    teacherHiddenMenuIds,
    overrideMap,
    requiredExercises,
    excludedExercises,
}: UseMenuExercisesParams) {
    const exercises = useMemo(() => {
        const builtIn = getExercisesByClass(classLevel)
            .filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id))
            .map((exercise) => {
                const override = overrideMap.get(`exercise:${exercise.id}`);
                if (!override) {
                    return {
                        ...exercise,
                        origin: 'builtin' as const,
                    };
                }

                return {
                    ...exercise,
                    origin: 'builtin' as const,
                    name: override.name ?? exercise.name,
                    description: override.description ?? exercise.description,
                    emoji: override.emoji ?? exercise.emoji,
                    sec: override.sec ?? exercise.sec,
                    hasSplit: override.hasSplit ?? exercise.hasSplit,
                    displayMode: (override.displayMode ?? undefined) as TeacherContentDisplayMode | undefined,
                };
            });

        // Built-in exercises overridden to teacher_section should move to the teacher list
        const builtInStandard = builtIn.filter((exercise) => exercise.displayMode !== 'teacher_section');
        const builtInPromoted = builtIn.filter((exercise) => exercise.displayMode === 'teacher_section');

        const restExercises = EXERCISES.filter(
            (exercise) => exercise.placement === 'rest' && !teacherHiddenExerciseIds.has(exercise.id),
        ).map((exercise) => ({ ...exercise, origin: 'builtin' as const }));

        const teacherAsExercise: Exercise[] = teacherExercises
            .filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id))
            .map((exercise) => ({
                id: exercise.id,
                name: exercise.name,
                sec: exercise.sec,
                emoji: exercise.emoji,
                placement: exercise.placement,
                hasSplit: exercise.hasSplit,
                description: exercise.description,
                internal: exercise.hasSplit ? 'R30→L30' : 'single',
                classes: ['プレ', '初級', '中級', '上級'],
                priority: 'medium' as const,
                origin: 'teacher' as const,
                visibility: exercise.visibility,
                focusTags: exercise.focusTags,
                recommended: exercise.recommended,
                recommendedOrder: exercise.recommendedOrder,
                displayMode: exercise.displayMode,
            }));

        return orderMenuExercisesForDisplay(builtInStandard, restExercises, [...builtInPromoted, ...teacherAsExercise]);
    }, [classLevel, overrideMap, teacherExercises, teacherHiddenExerciseIds]);

    const exerciseMap = useMemo(() => {
        const map = new Map<string, { name: string; emoji: string; sec: number; placement: Exercise['placement'] }>();
        for (const exercise of exercises) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }
        for (const exercise of customExercises) {
            map.set(exercise.id, {
                name: exercise.name,
                emoji: exercise.emoji,
                sec: exercise.sec,
                placement: exercise.placement,
            });
        }
        return map;
    }, [customExercises, exercises]);

    const mergedPresets = useMemo(() => {
        const filteredPresets = presets
            .filter((preset) => !teacherHiddenMenuIds.has(preset.id))
            .map((preset) => {
                const override = overrideMap.get(`menu_group:${preset.id}`);
                if (!override) {
                    return preset;
                }

                return {
                    ...preset,
                    name: override.name ?? preset.name,
                    description: override.description ?? preset.description,
                    emoji: override.emoji ?? preset.emoji,
                    exerciseIds: override.exerciseIds ?? preset.exerciseIds,
                    displayMode: (override.displayMode ?? undefined) as TeacherContentDisplayMode | undefined,
                };
            });

        const teacherAsGroup: MenuGroup[] = teacherMenus
            .filter((menu) => !teacherHiddenMenuIds.has(menu.id))
            .map((menu) => ({
                id: menu.id,
                name: menu.name,
                emoji: menu.emoji,
                description: menu.description,
                exerciseIds: menu.exerciseIds,
                isPreset: true,
                origin: 'teacher' as const,
                visibility: menu.visibility,
                focusTags: menu.focusTags,
                recommended: menu.recommended,
                recommendedOrder: menu.recommendedOrder,
                displayMode: menu.displayMode,
            }));

        return orderMenuGroupsForDisplay(filteredPresets, teacherAsGroup);
    }, [overrideMap, presets, teacherHiddenMenuIds, teacherMenus]);

    const effectiveCounts = useMemo(() => {
        const builtInIds = getExercisesByClass(classLevel)
            .filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id))
            .map((exercise) => exercise.id);
        const teacherIds = teacherExercises
            .filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id) && exercise.placement !== 'rest')
            .map((exercise) => exercise.id);
        const allVisibleIds = [...builtInIds, ...teacherIds];
        const effectiveSettings = buildEffectiveExerciseSettings({
            classLevel,
            exerciseIds: allVisibleIds,
            teacherSettings,
            userRequiredExerciseIds: requiredExercises,
            userExcludedExerciseIds: excludedExercises,
        });
        const requiredCount = effectiveSettings.filter((setting) => setting.effectiveStatus === 'required').length;
        const excludedCount = effectiveSettings.filter((setting) => setting.effectiveStatus === 'excluded').length;
        const effectiveRequiredExerciseIds = getOrderedEffectiveRequiredExerciseIds({
            classLevel,
            exerciseIds: allVisibleIds,
            teacherSettings,
            userRequiredExerciseIds: requiredExercises,
            userExcludedExerciseIds: excludedExercises,
        });

        return { requiredCount, excludedCount, effectiveRequiredExerciseIds };
    }, [classLevel, excludedExercises, requiredExercises, teacherSettings, teacherExercises, teacherHiddenExerciseIds]);

    return {
        exercises,
        exerciseMap,
        mergedPresets,
        autoMenuMinutes: Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60),
        effectiveRequiredCount: effectiveCounts.requiredCount,
        effectiveExcludedCount: effectiveCounts.excludedCount,
        effectiveRequiredExerciseIds: effectiveCounts.effectiveRequiredExerciseIds,
    };
}
