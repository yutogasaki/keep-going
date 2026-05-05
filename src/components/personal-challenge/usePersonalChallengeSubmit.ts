import { useEffect, useState } from 'react';
import type { MenuGroup } from '@/data/menuGroups';
import type { CustomExercise } from '@/lib/db';
import {
    PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR,
    createPersonalChallenge,
    PERSONAL_CHALLENGE_ACTIVE_LIMIT,
    PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR,
    updatePersonalChallengeMeta,
    updatePersonalChallengeSetup,
} from '@/lib/personalChallenges';
import type { TeacherExercise, TeacherMenu } from '@/lib/teacherContent';
import type { PersonalChallengeProgressItem } from '@/pages/home/hooks/usePersonalChallenges';
import type { UserProfileStore } from '@/store/useAppStore';
import type { MenuSource, PersonalChallengeType } from './formTypes';
import { buildDefaultPersonalChallengeTitle, type PersonalChallengePresetOption } from './shared';

interface UsePersonalChallengeSubmitParams {
    open: boolean;
    member: UserProfileStore | null;
    isEditing: boolean;
    canEditSetup: boolean;
    initialItem: PersonalChallengeProgressItem | null;
    challengeType: PersonalChallengeType;
    exerciseId: string;
    targetMenuId: string;
    menuSource: MenuSource;
    selectedPreset: PersonalChallengePresetOption;
    title: string;
    description: string;
    iconEmoji: string;
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    customExercises: CustomExercise[];
    customMenus: MenuGroup[];
    hasChallengeAccount: boolean;
    activeCountLoading: boolean;
    limitReached: boolean;
    selectedTargetMissing: boolean;
    onLimitReached: () => void;
    onClose: () => void;
    onSaved: () => void;
}

export function usePersonalChallengeSubmit({
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
    hasChallengeAccount,
    activeCountLoading,
    limitReached,
    selectedTargetMissing,
    onLimitReached,
    onClose,
    onSaved,
}: UsePersonalChallengeSubmitParams) {
    const [submitting, setSubmitting] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const requiresValidTarget = !isEditing || canEditSetup;
    const submitDisabled = !member
        || !hasChallengeAccount
        || submitting
        || (requiresValidTarget && selectedTargetMissing)
        || (!isEditing && (activeCountLoading || limitReached));

    useEffect(() => {
        if (open && member && !isEditing) {
            setSaveError(null);
        }
    }, [isEditing, member, open]);

    const handleSubmit = async () => {
        if (!member || submitDisabled) {
            return;
        }

        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();
        const nextTitle = trimmedTitle || buildDefaultPersonalChallengeTitle({
            challengeType,
            exerciseId: challengeType === 'exercise' ? exerciseId : null,
            targetMenuId: challengeType === 'menu' ? targetMenuId : null,
            menuSource: challengeType === 'menu' ? menuSource : null,
            windowDays: selectedPreset.windowDays,
            requiredDays: selectedPreset.requiredDays,
            teacherExercises,
            teacherMenus,
            customExercises,
            customMenus,
        });

        setSubmitting(true);
        setSaveError(null);
        try {
            if (initialItem) {
                if (canEditSetup) {
                    await updatePersonalChallengeSetup(initialItem.challenge, {
                        challengeType,
                        exerciseId: challengeType === 'exercise' ? exerciseId : null,
                        targetMenuId: challengeType === 'menu' ? targetMenuId : null,
                        menuSource: challengeType === 'menu' ? menuSource : null,
                        targetCount: selectedPreset.requiredDays,
                        dailyCap: 1,
                        countUnit: challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
                        goalType: 'active_day',
                        windowDays: selectedPreset.windowDays,
                        requiredDays: selectedPreset.requiredDays,
                        effectiveStartDate: initialItem.challenge.effectiveStartDate,
                    });
                }

                await updatePersonalChallengeMeta(initialItem.challenge.id, {
                    title: nextTitle,
                    summary: null,
                    description: trimmedDescription || null,
                    iconEmoji: iconEmoji.trim() || null,
                });
            } else {
                await createPersonalChallenge({
                    memberId: member.id,
                    title: nextTitle,
                    summary: null,
                    description: trimmedDescription || null,
                    challengeType,
                    exerciseId: challengeType === 'exercise' ? exerciseId : null,
                    targetMenuId: challengeType === 'menu' ? targetMenuId : null,
                    menuSource: challengeType === 'menu' ? menuSource : null,
                    targetCount: selectedPreset.requiredDays,
                    dailyCap: 1,
                    countUnit: challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
                    goalType: 'active_day',
                    windowDays: selectedPreset.windowDays,
                    requiredDays: selectedPreset.requiredDays,
                    iconEmoji: iconEmoji.trim() || null,
                });
            }

            onSaved();
            onClose();
        } catch (error) {
            console.warn('[personalChallenges] save failed:', error);
            if (error instanceof Error && error.message === PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR) {
                setSaveError(`いまは${PERSONAL_CHALLENGE_ACTIVE_LIMIT}つ進めているよ。どれか終わったら新しくつくれるよ。`);
                onLimitReached();
            } else if (error instanceof Error && error.message === PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR) {
                setSaveError('じぶんチャレンジは アカウントをつないでから使えるよ。');
            } else {
                setSaveError('ほぞんに失敗したよ。もう一度ためしてみてね。');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return {
        handleSubmit,
        saveError,
        submitDisabled,
        submitting,
    };
}
