import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import { fetchTeacherExercises, fetchTeacherMenus } from '../../../lib/teacherContent';
import { fetchAllTeacherItemOverrides } from '../../../lib/teacherItemOverrides';
import { fetchTeacherMenuSettingsForClass } from '../../../lib/teacherMenuSettings';
import { subscribeTeacherContentUpdated } from '../../../lib/teacherContentEvents';
import type { ClassLevel } from '../../../data/exercises';
import type { MenuOverrideMap } from './shared';

const NEW_BADGE_DAYS = 14;

interface UseTeacherContentParams {
    classLevel: ClassLevel;
    onLoadError: () => void;
}

export function useTeacherContent({
    classLevel,
    onLoadError,
}: UseTeacherContentParams) {
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [teacherExcludedExerciseIds, setTeacherExcludedExerciseIds] = useState<Set<string>>(new Set());
    const [teacherRequiredExerciseIds, setTeacherRequiredExerciseIds] = useState<Set<string>>(new Set());
    const [teacherHiddenExerciseIds, setTeacherHiddenExerciseIds] = useState<Set<string>>(new Set());
    const [teacherHiddenMenuIds, setTeacherHiddenMenuIds] = useState<Set<string>>(new Set());
    const [overrideMap, setOverrideMap] = useState<MenuOverrideMap>(new Map());

    const loadTeacherContent = useCallback(async (forceRefresh = false) => {
        try {
            const [allExercises, allMenus, settings, overrides] = await Promise.all([
                fetchTeacherExercises(forceRefresh),
                fetchTeacherMenus(forceRefresh),
                fetchTeacherMenuSettingsForClass(classLevel, forceRefresh),
                fetchAllTeacherItemOverrides(forceRefresh),
            ]);

            setTeacherExercises(
                allExercises.filter(
                    (exercise) => exercise.classLevels.length === 0 || exercise.classLevels.includes(classLevel),
                ),
            );
            setTeacherMenus(
                allMenus.filter(
                    (menu) => menu.classLevels.length === 0 || menu.classLevels.includes(classLevel),
                ),
            );

            setTeacherExcludedExerciseIds(new Set(
                settings
                    .filter((setting) => setting.itemType === 'exercise' && setting.status === 'excluded')
                    .map((setting) => setting.itemId),
            ));
            setTeacherRequiredExerciseIds(new Set(
                settings
                    .filter((setting) => setting.itemType === 'exercise' && setting.status === 'required')
                    .map((setting) => setting.itemId),
            ));
            setTeacherHiddenExerciseIds(new Set(
                settings
                    .filter((setting) => setting.itemType === 'exercise' && setting.status === 'hidden')
                    .map((setting) => setting.itemId),
            ));
            setTeacherHiddenMenuIds(new Set(
                settings
                    .filter((setting) => setting.itemType === 'menu_group' && setting.status === 'hidden')
                    .map((setting) => setting.itemId),
            ));

            const nextOverrideMap: MenuOverrideMap = new Map();
            for (const override of overrides) {
                nextOverrideMap.set(`${override.itemType}:${override.itemId}`, {
                    name: override.nameOverride,
                    description: override.descriptionOverride,
                    emoji: override.emojiOverride,
                    sec: override.secOverride,
                    hasSplit: override.hasSplitOverride,
                    exerciseIds: override.exerciseIdsOverride,
                });
            }
            setOverrideMap(nextOverrideMap);
        } catch (error) {
            console.warn('[menu] Failed to load teacher content:', error);
            setTeacherExercises([]);
            setTeacherMenus([]);
            setTeacherExcludedExerciseIds(new Set());
            setTeacherRequiredExerciseIds(new Set());
            setTeacherHiddenExerciseIds(new Set());
            setTeacherHiddenMenuIds(new Set());
            setOverrideMap(new Map());
            onLoadError();
        }
    }, [classLevel, onLoadError]);

    useEffect(() => {
        void loadTeacherContent();
    }, [loadTeacherContent]);

    useEffect(() => {
        return subscribeTeacherContentUpdated(() => {
            void loadTeacherContent(true);
        });
    }, [loadTeacherContent]);

    const teacherExerciseIds = useMemo(
        () => new Set(teacherExercises.map((exercise) => exercise.id)),
        [teacherExercises],
    );

    const teacherMenuIds = useMemo(
        () => new Set(teacherMenus.map((menu) => menu.id)),
        [teacherMenus],
    );

    const isNewTeacherContent = useCallback((id: string): boolean => {
        const exercise = teacherExercises.find((target) => target.id === id);
        if (exercise) {
            const daysDiff = (Date.now() - new Date(exercise.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= NEW_BADGE_DAYS;
        }

        const menu = teacherMenus.find((target) => target.id === id);
        if (menu) {
            const daysDiff = (Date.now() - new Date(menu.createdAt).getTime()) / (1000 * 60 * 60 * 24);
            return daysDiff <= NEW_BADGE_DAYS;
        }

        return false;
    }, [teacherExercises, teacherMenus]);

    return {
        teacherExercises,
        teacherMenus,
        teacherExcludedExerciseIds,
        teacherRequiredExerciseIds,
        teacherHiddenExerciseIds,
        teacherHiddenMenuIds,
        overrideMap,
        teacherExerciseIds,
        teacherMenuIds,
        isNewTeacherContent,
        loadTeacherContent,
    };
}
