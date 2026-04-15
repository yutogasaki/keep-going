import { useCallback, useState } from 'react';
import type { PersonalChallengeCreateSeed } from '../../components/PersonalChallengeFormSheet';
import {
    canDeletePersonalChallenge,
    deletePersonalChallenge,
    endPersonalChallenge,
} from '../../lib/personalChallenges';
import type { CustomExercise } from '../../lib/db';
import type { MenuGroup } from '../../data/menuGroups';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import type { UserProfileStore } from '../../store/useAppStore';
import {
    findPersonalChallengePreset,
    inferPersonalChallengeExerciseSource,
    inferPersonalChallengeMenuSource,
} from '../../components/personal-challenge/shared';
import type { PersonalChallengeProgressItem } from './hooks/usePersonalChallenges';

interface UseHomePersonalChallengeActionsParams {
    isTogetherMode: boolean;
    selectedUser: UserProfileStore | null;
    teacherMenus: TeacherMenu[];
    teacherExercises: TeacherExercise[];
    customChallengeExercises: CustomExercise[];
    customChallengeMenus: MenuGroup[];
    loadCustomChallengeTargets: () => Promise<void>;
    reloadPersonalChallenges: () => void;
    closeChallengeHub: () => void;
    closePublicMenu: () => void;
    closePublicExercise: () => void;
    closeTeacherMenu: () => void;
    closeTeacherExercise: () => void;
}

export function useHomePersonalChallengeActions({
    isTogetherMode,
    selectedUser,
    teacherMenus,
    teacherExercises,
    customChallengeExercises,
    customChallengeMenus,
    loadCustomChallengeTargets,
    reloadPersonalChallenges,
    closeChallengeHub,
    closePublicMenu,
    closePublicExercise,
    closeTeacherMenu,
    closeTeacherExercise,
}: UseHomePersonalChallengeActionsParams) {
    const [selectedPersonalChallenge, setSelectedPersonalChallenge] = useState<PersonalChallengeProgressItem | null>(null);
    const [editingPersonalChallenge, setEditingPersonalChallenge] = useState<PersonalChallengeProgressItem | null>(null);
    const [personalChallengeSeed, setPersonalChallengeSeed] = useState<PersonalChallengeCreateSeed | null>(null);
    const [personalFormOpen, setPersonalFormOpen] = useState(false);
    const [personalChallengeDeleteOpen, setPersonalChallengeDeleteOpen] = useState(false);
    const [deletingPersonalChallenge, setDeletingPersonalChallenge] = useState(false);

    const canCreatePersonalChallenge = !isTogetherMode && Boolean(selectedUser);
    const personalChallengeFormMember = editingPersonalChallenge?.owner ?? selectedUser;

    const handleOpenPersonalChallenge = useCallback((item: PersonalChallengeProgressItem) => {
        setSelectedPersonalChallenge(item);
    }, []);

    const openPersonalChallengeForm = useCallback((seed: PersonalChallengeCreateSeed | null = null) => {
        closeChallengeHub();
        setSelectedPersonalChallenge(null);
        setEditingPersonalChallenge(null);
        setPersonalChallengeSeed(seed);
        setPersonalFormOpen(true);
    }, [closeChallengeHub]);

    const handleCreatePersonalChallenge = useCallback(() => {
        openPersonalChallengeForm(null);
    }, [openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromPublicMenu = useCallback(async (seed: PersonalChallengeCreateSeed) => {
        await loadCustomChallengeTargets();
        closePublicMenu();
        openPersonalChallengeForm(seed);
    }, [closePublicMenu, loadCustomChallengeTargets, openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromPublicExercise = useCallback(async (seed: PersonalChallengeCreateSeed) => {
        await loadCustomChallengeTargets();
        closePublicExercise();
        openPersonalChallengeForm(seed);
    }, [closePublicExercise, loadCustomChallengeTargets, openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromTeacherMenu = useCallback((menu: TeacherMenu) => {
        closeTeacherMenu();
        openPersonalChallengeForm({
            challengeType: 'menu',
            menuSource: 'teacher',
            targetMenuId: menu.id,
            description: menu.description ?? '',
            iconEmoji: menu.emoji,
        });
    }, [closeTeacherMenu, openPersonalChallengeForm]);

    const handleCreatePersonalChallengeFromTeacherExercise = useCallback((exercise: TeacherExercise) => {
        closeTeacherExercise();
        openPersonalChallengeForm({
            challengeType: 'exercise',
            exerciseSource: 'teacher',
            exerciseId: exercise.id,
            description: exercise.description ?? '',
            iconEmoji: exercise.emoji,
        });
    }, [closeTeacherExercise, openPersonalChallengeForm]);

    const handleEditPersonalChallenge = useCallback(() => {
        if (!selectedPersonalChallenge) {
            return;
        }

        setEditingPersonalChallenge(selectedPersonalChallenge);
        setSelectedPersonalChallenge(null);
        closeChallengeHub();
        setPersonalChallengeSeed(null);
        setPersonalFormOpen(true);
    }, [closeChallengeHub, selectedPersonalChallenge]);

    const handleRetryPersonalChallenge = useCallback(async () => {
        if (!selectedPersonalChallenge) {
            return;
        }

        const { challenge } = selectedPersonalChallenge;
        const presetId = findPersonalChallengePreset(challenge) ?? 'week';
        const nextExerciseSource = inferPersonalChallengeExerciseSource(
            challenge.exerciseId,
            teacherExercises,
            customChallengeExercises,
        );
        const nextMenuSource = inferPersonalChallengeMenuSource(
            challenge.menuSource,
            challenge.targetMenuId,
            teacherMenus,
            customChallengeMenus,
        );

        if (
            challenge.challengeType === 'menu'
            || nextExerciseSource === 'custom'
            || nextMenuSource === 'custom'
        ) {
            await loadCustomChallengeTargets();
        }

        openPersonalChallengeForm({
            challengeType: challenge.challengeType === 'menu' ? 'menu' : 'exercise',
            presetId,
            exerciseSource: challenge.challengeType === 'exercise'
                ? nextExerciseSource
                : undefined,
            menuSource: challenge.challengeType === 'menu'
                ? nextMenuSource
                : undefined,
            exerciseId: challenge.exerciseId,
            targetMenuId: challenge.targetMenuId,
            title: challenge.title,
            description: challenge.description ?? '',
            iconEmoji: challenge.iconEmoji ?? '',
        });
    }, [
        customChallengeExercises,
        customChallengeMenus,
        loadCustomChallengeTargets,
        openPersonalChallengeForm,
        selectedPersonalChallenge,
        teacherExercises,
        teacherMenus,
    ]);

    const handleEndPersonalChallenge = useCallback(async () => {
        if (!selectedPersonalChallenge) {
            return;
        }

        try {
            await endPersonalChallenge(selectedPersonalChallenge.challenge.id, 'manual');
            setSelectedPersonalChallenge(null);
            reloadPersonalChallenges();
        } catch (error) {
            console.warn('[personalChallenges] manual end failed:', error);
        }
    }, [reloadPersonalChallenges, selectedPersonalChallenge]);

    const handlePromptDeletePersonalChallenge = useCallback(() => {
        if (!selectedPersonalChallenge) {
            return;
        }
        setPersonalChallengeDeleteOpen(true);
    }, [selectedPersonalChallenge]);

    const handleDeletePersonalChallenge = useCallback(async () => {
        if (!selectedPersonalChallenge) {
            return;
        }
        if (!canDeletePersonalChallenge(selectedPersonalChallenge.challenge, selectedPersonalChallenge.progress)) {
            setPersonalChallengeDeleteOpen(false);
            return;
        }

        setDeletingPersonalChallenge(true);
        try {
            await deletePersonalChallenge(selectedPersonalChallenge.challenge.id);
            setPersonalChallengeDeleteOpen(false);
            setSelectedPersonalChallenge(null);
            reloadPersonalChallenges();
        } catch (error) {
            console.warn('[personalChallenges] delete failed:', error);
        } finally {
            setDeletingPersonalChallenge(false);
        }
    }, [reloadPersonalChallenges, selectedPersonalChallenge]);

    return {
        canCreatePersonalChallenge,
        selectedPersonalChallenge,
        editingPersonalChallenge,
        personalChallengeSeed,
        personalFormOpen,
        personalChallengeDeleteOpen,
        deletingPersonalChallenge,
        personalChallengeFormMember,
        handleOpenPersonalChallenge,
        handleCreatePersonalChallenge,
        handleCreatePersonalChallengeFromPublicMenu,
        handleCreatePersonalChallengeFromPublicExercise,
        handleCreatePersonalChallengeFromTeacherMenu,
        handleCreatePersonalChallengeFromTeacherExercise,
        handleEditPersonalChallenge,
        handleRetryPersonalChallenge,
        handleEndPersonalChallenge,
        handlePromptDeletePersonalChallenge,
        handleDeletePersonalChallenge,
        closeSelectedPersonalChallenge: () => setSelectedPersonalChallenge(null),
        closePersonalChallengeDelete: () => setPersonalChallengeDeleteOpen(false),
        closePersonalChallengeForm: () => {
            setPersonalFormOpen(false);
            setEditingPersonalChallenge(null);
            setPersonalChallengeSeed(null);
        },
        handlePersonalChallengeSaved: () => {
            reloadPersonalChallenges();
            setEditingPersonalChallenge(null);
            setPersonalChallengeSeed(null);
        },
    };
}
