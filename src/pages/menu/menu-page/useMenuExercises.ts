import { useMemo } from 'react';
import {
    DEFAULT_SESSION_TARGET_SECONDS,
    EXERCISES,
    getExercisesByClass,
    type Exercise,
} from '../../../data/exercises';
import type { MenuGroup } from '../../../data/menuGroups';
import type { CustomExercise } from '../../../lib/db';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { ClassLevel } from '../../../data/exercises';
import type { MenuOverrideMap } from './shared';
import { sortTeacherContentByRecommendation } from '../../../lib/teacherExerciseMetadata';

interface UseMenuExercisesParams {
    classLevel: ClassLevel;
    presets: MenuGroup[];
    customExercises: CustomExercise[];
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    teacherExcludedExerciseIds: Set<string>;
    teacherRequiredExerciseIds: Set<string>;
    teacherHiddenExerciseIds: Set<string>;
    teacherHiddenMenuIds: Set<string>;
    overrideMap: MenuOverrideMap;
    requiredExercises: string[];
    excludedExercises: string[];
}

export function useMenuExercises({
    classLevel,
    presets,
    customExercises,
    teacherExercises,
    teacherMenus,
    teacherExcludedExerciseIds,
    teacherRequiredExerciseIds,
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
                };
            });

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
            }));

        const restExercises = EXERCISES
            .filter((exercise) => exercise.placement === 'rest' && !teacherHiddenExerciseIds.has(exercise.id))
            .map((exercise) => ({ ...exercise, origin: 'builtin' as const }));

        return [...builtIn, ...teacherAsExercise, ...restExercises];
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
            }));

        return [...filteredPresets, ...sortTeacherContentByRecommendation(teacherAsGroup)];
    }, [overrideMap, presets, teacherHiddenMenuIds, teacherMenus]);

    const effectiveCounts = useMemo(() => {
        const userRequiredSet = new Set(requiredExercises);
        const userExcludedSet = new Set(excludedExercises);
        let requiredCount = 0;
        let excludedCount = 0;

        const builtInIds = getExercisesByClass(classLevel)
            .filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id))
            .map((exercise) => exercise.id);
        const teacherIds = teacherExercises
            .filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id) && exercise.placement !== 'rest')
            .map((exercise) => exercise.id);
        const allVisibleIds = [...builtInIds, ...teacherIds];

        for (const id of allVisibleIds) {
            const isTeacherRequired = teacherRequiredExerciseIds.has(id);
            const isTeacherExcluded = teacherExcludedExerciseIds.has(id);
            const isUserRequired = userRequiredSet.has(id);
            const isUserExcluded = userExcludedSet.has(id);

            const isRequired = isUserRequired || (isTeacherRequired && !isUserExcluded);
            const isExcluded = !isRequired && (isUserExcluded || (isTeacherExcluded && !isUserRequired));

            if (isRequired) requiredCount++;
            if (isExcluded) excludedCount++;
        }

        return { requiredCount, excludedCount };
    }, [
        classLevel,
        excludedExercises,
        requiredExercises,
        teacherExcludedExerciseIds,
        teacherExercises,
        teacherHiddenExerciseIds,
        teacherRequiredExerciseIds,
    ]);

    return {
        exercises,
        exerciseMap,
        mergedPresets,
        autoMenuMinutes: Math.ceil(DEFAULT_SESSION_TARGET_SECONDS / 60),
        effectiveRequiredCount: effectiveCounts.requiredCount,
        effectiveExcludedCount: effectiveCounts.excludedCount,
    };
}
