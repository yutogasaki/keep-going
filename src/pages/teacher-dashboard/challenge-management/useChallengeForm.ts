import { useEffect, useMemo, useState } from 'react';
import { EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import { getTodayKey } from '../../../lib/db';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import { sortTeacherContentByRecommendation } from '../../../lib/teacherExerciseMetadata';
import { getDurationPresetSummary } from './durationPresets';
import type { ChallengeFormValues } from './types';

export function useChallengeForm(
    values: ChallengeFormValues,
    teacherMenus: TeacherMenu[],
    teacherExercises: TeacherExercise[],
    onChange: (patch: Partial<ChallengeFormValues>) => void,
) {
    const [teacherMenuQuery, setTeacherMenuQuery] = useState('');
    const [exerciseSource, setExerciseSource] = useState<'standard' | 'teacher'>('standard');
    const [teacherExerciseQuery, setTeacherExerciseQuery] = useState('');

    const sortedTeacherMenus = useMemo(
        () => sortTeacherContentByRecommendation(teacherMenus),
        [teacherMenus],
    );
    const sortedTeacherExercises = useMemo(
        () => sortTeacherContentByRecommendation(teacherExercises),
        [teacherExercises],
    );

    const filteredTeacherExercises = useMemo(() => {
        const normalizedQuery = teacherExerciseQuery.trim().toLowerCase();
        return sortedTeacherExercises.filter((exercise) => (
            normalizedQuery.length === 0 || exercise.name.toLowerCase().includes(normalizedQuery)
        ));
    }, [sortedTeacherExercises, teacherExerciseQuery]);

    const filteredTeacherMenus = useMemo(() => {
        const normalizedQuery = teacherMenuQuery.trim().toLowerCase();
        return sortedTeacherMenus.filter((menu) => (
            normalizedQuery.length === 0 || menu.name.toLowerCase().includes(normalizedQuery)
        ));
    }, [sortedTeacherMenus, teacherMenuQuery]);

    const selectedTeacherExercise = sortedTeacherExercises.find((exercise) => exercise.id === values.exerciseId) ?? null;
    const selectedTeacherMenu = sortedTeacherMenus.find((menu) => menu.id === values.targetMenuId) ?? null;
    const selectedStandardExercise = EXERCISES.find((exercise) => exercise.id === values.exerciseId) ?? EXERCISES[0] ?? null;
    const selectedPresetMenu = PRESET_GROUPS.find((menu) => menu.id === values.targetMenuId) ?? PRESET_GROUPS[0] ?? null;

    const hasExerciseTarget = exerciseSource === 'standard'
        ? EXERCISES.some((exercise) => exercise.id === values.exerciseId)
        : sortedTeacherExercises.some((exercise) => exercise.id === values.exerciseId);
    const hasMenuTarget = values.menuSource === 'preset'
        ? PRESET_GROUPS.some((group) => group.id === values.targetMenuId)
        : sortedTeacherMenus.some((menu) => menu.id === values.targetMenuId);

    const dateError = values.startDate && values.endDate && values.endDate < values.startDate
        ? '終了日は開始日より後にしてください'
        : '';
    const publishDateError = values.publishMode === 'seasonal'
        && values.publishStartDate
        && values.publishEndDate
        && values.publishEndDate < values.publishStartDate
        ? '表示終了日は表示開始日より後にしてください'
        : '';
    const todayKey = getTodayKey();
    const canStartPreviewToday = values.publishMode === 'seasonal'
        && values.startDate > todayKey;
    const isShowingPreviewBeforeStart = values.publishMode === 'seasonal'
        && values.publishStartDate < values.startDate;

    const isDurationChallenge = values.challengeType === 'duration';
    const hasError = !values.title.trim()
        || (values.goalType === 'active_day'
            ? values.requiredDays < 1 || (values.windowType === 'rolling' ? values.windowDays < 1 || values.requiredDays > values.windowDays : false)
            : values.targetCount < 1 || values.dailyCap < 1)
        || (isDurationChallenge && values.dailyMinimumMinutes < 1)
        || !!dateError
        || !!publishDateError
        || (values.challengeType === 'exercise' && !hasExerciseTarget)
        || (values.challengeType === 'menu' && !hasMenuTarget);

    useEffect(() => {
        if (exerciseSource !== 'teacher') {
            setTeacherExerciseQuery('');
        }
    }, [exerciseSource]);

    useEffect(() => {
        if (values.menuSource !== 'teacher') {
            setTeacherMenuQuery('');
        }
    }, [values.menuSource]);

    useEffect(() => {
        if (selectedTeacherExercise) {
            setExerciseSource('teacher');
            return;
        }

        if (EXERCISES.some((exercise) => exercise.id === values.exerciseId)) {
            setExerciseSource('standard');
        }
    }, [selectedTeacherExercise, values.exerciseId]);

    useEffect(() => {
        if (values.challengeType !== 'exercise' || exerciseSource !== 'teacher') {
            return;
        }

        if (filteredTeacherExercises.length === 0) {
            return;
        }

        if (!filteredTeacherExercises.some((exercise) => exercise.id === values.exerciseId)) {
            onChange({ exerciseId: filteredTeacherExercises[0].id });
        }
    }, [exerciseSource, filteredTeacherExercises, onChange, values.challengeType, values.exerciseId]);

    useEffect(() => {
        if (values.challengeType !== 'menu' || values.menuSource !== 'teacher') {
            return;
        }

        if (filteredTeacherMenus.length === 0) {
            return;
        }

        if (!filteredTeacherMenus.some((menu) => menu.id === values.targetMenuId)) {
            onChange({ targetMenuId: filteredTeacherMenus[0].id });
        }
    }, [filteredTeacherMenus, onChange, values.challengeType, values.menuSource, values.targetMenuId]);

    const selectedExercisePreview = exerciseSource === 'teacher' ? selectedTeacherExercise : selectedStandardExercise;
    const selectedMenuPreview = values.menuSource === 'teacher' ? selectedTeacherMenu : selectedPresetMenu;
    const isCustomDuration = values.durationPreset === 'custom';
    const durationSummary = getDurationPresetSummary(values);

    return {
        teacherMenuQuery,
        setTeacherMenuQuery,
        exerciseSource,
        setExerciseSource,
        teacherExerciseQuery,
        setTeacherExerciseQuery,
        sortedTeacherMenus,
        sortedTeacherExercises,
        filteredTeacherExercises,
        filteredTeacherMenus,
        selectedTeacherExercise,
        selectedTeacherMenu,
        selectedStandardExercise,
        selectedPresetMenu,
        hasExerciseTarget,
        hasMenuTarget,
        dateError,
        publishDateError,
        todayKey,
        canStartPreviewToday,
        isShowingPreviewBeforeStart,
        isDurationChallenge,
        hasError,
        selectedExercisePreview,
        selectedMenuPreview,
        isCustomDuration,
        durationSummary,
    };
}

export type ChallengeFormState = ReturnType<typeof useChallengeForm>;
