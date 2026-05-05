import { useCallback, useEffect, useMemo, useState } from 'react';
import { getExercisesByClass } from '@/data/exercises';
import { getPresetsForClass, type MenuGroup } from '@/data/menuGroups';
import type { CustomExercise } from '@/lib/db';
import type { TeacherExercise, TeacherMenu } from '@/lib/teacherContent';
import type { PersonalChallengeProgressItem } from '@/pages/home/hooks/usePersonalChallenges';
import type { UserProfileStore } from '@/store/useAppStore';
import type {
    ExerciseSource,
    MenuSource,
    PersonalChallengeCreateSeed,
    PersonalChallengeType,
} from './formTypes';
import {
    findPersonalChallengePreset,
    inferPersonalChallengeExerciseSource,
    inferPersonalChallengeMenuSource,
    PERSONAL_CHALLENGE_PRESET_OPTIONS,
    type PersonalChallengePresetId,
} from './shared';
import { usePersonalChallengeLimit } from './usePersonalChallengeLimit';
import { usePersonalChallengeSubmit } from './usePersonalChallengeSubmit';

interface UsePersonalChallengeFormControllerParams {
    open: boolean;
    member: UserProfileStore | null;
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    customExercises: CustomExercise[];
    customMenus: MenuGroup[];
    initialItem: PersonalChallengeProgressItem | null;
    initialSeed: PersonalChallengeCreateSeed | null;
    onClose: () => void;
    onSaved: () => void;
}

export function usePersonalChallengeFormController({
    open,
    member,
    teacherExercises,
    teacherMenus,
    customExercises,
    customMenus,
    initialItem,
    initialSeed,
    onClose,
    onSaved,
}: UsePersonalChallengeFormControllerParams) {
    const isEditing = Boolean(initialItem);
    const canEditSetup = initialItem?.canEditSetup ?? true;
    const standardExercises = useMemo(
        () => (member ? getExercisesByClass(member.classLevel) : []),
        [member],
    );
    const presetMenus = useMemo(
        () => (member ? getPresetsForClass(member.classLevel) : []),
        [member],
    );

    const [challengeType, setChallengeType] = useState<PersonalChallengeType>('exercise');
    const [exerciseSource, setExerciseSource] = useState<ExerciseSource>('standard');
    const [menuSource, setMenuSource] = useState<MenuSource>('preset');
    const [exerciseId, setExerciseId] = useState('');
    const [targetMenuId, setTargetMenuId] = useState('');
    const [presetId, setPresetId] = useState<PersonalChallengePresetId>('week');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [iconEmoji, setIconEmoji] = useState('');

    const getExerciseOptions = useCallback((source: ExerciseSource) => {
        if (source === 'teacher') {
            return teacherExercises;
        }
        if (source === 'custom') {
            return customExercises;
        }
        return standardExercises;
    }, [customExercises, standardExercises, teacherExercises]);

    const getMenuOptions = useCallback((source: MenuSource) => {
        if (source === 'teacher') {
            return teacherMenus;
        }
        if (source === 'custom') {
            return customMenus;
        }
        return presetMenus;
    }, [customMenus, presetMenus, teacherMenus]);

    const resolveFirstExerciseId = useCallback((source: ExerciseSource): string => {
        return getExerciseOptions(source)[0]?.id ?? '';
    }, [getExerciseOptions]);

    const resolveFirstMenuId = useCallback((source: MenuSource): string => {
        return getMenuOptions(source)[0]?.id ?? '';
    }, [getMenuOptions]);

    const hasExerciseOption = useCallback((source: ExerciseSource, id: string | null | undefined) => (
        Boolean(id) && getExerciseOptions(source).some((exercise) => exercise.id === id)
    ), [getExerciseOptions]);

    const hasMenuOption = useCallback((source: MenuSource, id: string | null | undefined) => (
        Boolean(id) && getMenuOptions(source).some((menu) => menu.id === id)
    ), [getMenuOptions]);

    useEffect(() => {
        if (!open || !member) {
            return;
        }

        if (initialItem) {
            const { challenge } = initialItem;
            const nextExerciseSource = inferPersonalChallengeExerciseSource(
                challenge.exerciseId,
                teacherExercises,
                customExercises,
            );
            const nextMenuSource = inferPersonalChallengeMenuSource(
                challenge.menuSource,
                challenge.targetMenuId,
                teacherMenus,
                customMenus,
            );
            const nextPreset = findPersonalChallengePreset(challenge) ?? 'week';

            setChallengeType(challenge.challengeType === 'menu' ? 'menu' : 'exercise');
            setExerciseSource(nextExerciseSource);
            setMenuSource(nextMenuSource);
            setExerciseId(hasExerciseOption(nextExerciseSource, challenge.exerciseId) ? challenge.exerciseId ?? '' : '');
            setTargetMenuId(hasMenuOption(nextMenuSource, challenge.targetMenuId) ? challenge.targetMenuId ?? '' : '');
            setPresetId(nextPreset);
            setTitle(challenge.title);
            setDescription(challenge.description ?? '');
            setIconEmoji(challenge.iconEmoji ?? '');
            return;
        }

        if (initialSeed) {
            const nextChallengeType = initialSeed.challengeType;
            const nextExerciseSource = initialSeed.exerciseSource
                ?? inferPersonalChallengeExerciseSource(initialSeed.exerciseId, teacherExercises, customExercises);
            const nextMenuSource = initialSeed.menuSource
                ?? inferPersonalChallengeMenuSource(null, initialSeed.targetMenuId, teacherMenus, customMenus);

            setChallengeType(nextChallengeType);
            setExerciseSource(nextExerciseSource);
            setMenuSource(nextMenuSource);
            setExerciseId(
                initialSeed.exerciseId === undefined
                    ? resolveFirstExerciseId(nextExerciseSource)
                    : (hasExerciseOption(nextExerciseSource, initialSeed.exerciseId) ? initialSeed.exerciseId ?? '' : ''),
            );
            setTargetMenuId(
                initialSeed.targetMenuId === undefined
                    ? resolveFirstMenuId(nextMenuSource)
                    : (hasMenuOption(nextMenuSource, initialSeed.targetMenuId) ? initialSeed.targetMenuId ?? '' : ''),
            );
            setPresetId(initialSeed.presetId ?? 'week');
            setTitle(initialSeed.title ?? '');
            setDescription(initialSeed.description ?? '');
            setIconEmoji(initialSeed.iconEmoji ?? '');
            return;
        }

        setChallengeType('exercise');
        setExerciseSource('standard');
        setMenuSource('preset');
        setExerciseId(resolveFirstExerciseId('standard'));
        setTargetMenuId(resolveFirstMenuId('preset'));
        setPresetId('week');
        setTitle('');
        setDescription('');
        setIconEmoji('');
    }, [
        customExercises,
        customMenus,
        initialItem,
        initialSeed,
        member,
        open,
        resolveFirstExerciseId,
        resolveFirstMenuId,
        hasExerciseOption,
        hasMenuOption,
        teacherExercises,
        teacherMenus,
    ]);

    const selectedPreset = PERSONAL_CHALLENGE_PRESET_OPTIONS.find((option) => option.id === presetId)
        ?? PERSONAL_CHALLENGE_PRESET_OPTIONS[0];
    const selectedExerciseOptions = useMemo(
        () => getExerciseOptions(exerciseSource),
        [exerciseSource, getExerciseOptions],
    );
    const selectedMenuOptions = useMemo(
        () => getMenuOptions(menuSource),
        [getMenuOptions, menuSource],
    );
    const selectedExerciseValid = exerciseId !== ''
        && selectedExerciseOptions.some((exercise) => exercise.id === exerciseId);
    const selectedMenuValid = targetMenuId !== ''
        && selectedMenuOptions.some((menu) => menu.id === targetMenuId);
    const selectedTargetMissing = challengeType === 'exercise'
        ? !selectedExerciseValid
        : !selectedMenuValid;
    const missingTargetMessage = challengeType === 'exercise'
        ? '前に選んだ種目が見つからないよ。保存する前に、いま使う種目をえらび直してね。'
        : '前に選んだメニューが見つからないよ。保存する前に、いま使うメニューをえらび直してね。';
    const challengeLimit = usePersonalChallengeLimit({ open, member, isEditing });

    const handleChallengeTypeSelect = useCallback((nextChallengeType: PersonalChallengeType) => {
        setChallengeType(nextChallengeType);
        if (nextChallengeType === 'exercise' && !hasExerciseOption(exerciseSource, exerciseId)) {
            setExerciseId(resolveFirstExerciseId(exerciseSource));
        }
        if (nextChallengeType === 'menu' && !hasMenuOption(menuSource, targetMenuId)) {
            setTargetMenuId(resolveFirstMenuId(menuSource));
        }
    }, [
        exerciseId,
        exerciseSource,
        hasExerciseOption,
        hasMenuOption,
        menuSource,
        resolveFirstExerciseId,
        resolveFirstMenuId,
        targetMenuId,
    ]);

    const handleExerciseSourceSelect = useCallback((source: ExerciseSource) => {
        setExerciseSource(source);
        const options = getExerciseOptions(source);
        if (options[0]) {
            setExerciseId((current) => (
                options.some((exercise) => exercise.id === current)
                    ? current
                    : options[0].id
            ));
        }
    }, [getExerciseOptions]);

    const handleMenuSourceSelect = useCallback((source: MenuSource) => {
        setMenuSource(source);
        const options = getMenuOptions(source);
        if (options[0]) {
            setTargetMenuId((current) => (
                options.some((menu) => menu.id === current)
                    ? current
                    : options[0].id
            ));
        }
    }, [getMenuOptions]);

    const submit = usePersonalChallengeSubmit({
        open,
        member,
        isEditing,
        canEditSetup,
        initialItem,
        challengeType,
        exerciseId,
        targetMenuId,
        menuSource,
        selectedPreset,
        title,
        description,
        iconEmoji,
        teacherExercises,
        teacherMenus,
        customExercises,
        customMenus,
        hasChallengeAccount: challengeLimit.hasChallengeAccount,
        activeCountLoading: challengeLimit.activeCountLoading,
        limitReached: challengeLimit.limitReached,
        selectedTargetMissing,
        onLimitReached: challengeLimit.markLimitReached,
        onClose,
        onSaved,
    });

    return {
        activeCountLoading: challengeLimit.activeCountLoading,
        canEditSetup,
        challengeType,
        customExercises,
        customMenus,
        description,
        exerciseId,
        exerciseSource,
        handleChallengeTypeSelect,
        handleExerciseSourceSelect,
        handleMenuSourceSelect,
        handleSubmit: submit.handleSubmit,
        hasChallengeAccount: challengeLimit.hasChallengeAccount,
        iconEmoji,
        isEditing,
        limitReached: challengeLimit.limitReached,
        menuSource,
        missingTargetMessage,
        presetId,
        remainingSlots: challengeLimit.remainingSlots,
        saveError: submit.saveError,
        selectedExerciseOptions,
        selectedExerciseValid,
        selectedMenuOptions,
        selectedMenuValid,
        selectedTargetMissing,
        setDescription,
        setExerciseId,
        setIconEmoji,
        setPresetId,
        setTargetMenuId,
        setTitle,
        submitDisabled: submit.submitDisabled,
        submitting: submit.submitting,
        targetMenuId,
        teacherExercises,
        teacherMenus,
        title,
    };
}
