import React from 'react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ExerciseDetailSheet } from '../../components/ExerciseDetailSheet';
import { MenuDetailSheet } from '../../components/MenuDetailSheet';
import { PersonalChallengeDetailSheet } from '../../components/PersonalChallengeDetailSheet';
import {
    PersonalChallengeFormSheet,
    type PersonalChallengeCreateSeed,
} from '../../components/PersonalChallengeFormSheet';
import { PublicExerciseBrowser } from '../../components/PublicExerciseBrowser';
import { PublicMenuBrowser } from '../../components/PublicMenuBrowser';
import type { Challenge, ChallengeCompletion, ChallengeRewardGrant } from '../../lib/challenges';
import type { MenuGroup } from '../../data/menuGroups';
import type { CustomExercise } from '../../lib/db';
import type { PublicExercise } from '../../lib/publicExercises';
import type { PublicMenu } from '../../lib/publicMenus';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import type { UserProfileStore, FuwafuwaMilestoneEvent } from '../../store/useAppStore';
import { ChallengeRewardModal } from './ChallengeRewardModal';
import { ChallengeHubSheet } from './ChallengeHubSheet';
import { HomeMilestoneModal } from './HomeMilestoneModal';
import { TeacherExerciseDetailSheet } from './TeacherExerciseDetailSheet';
import { TeacherMenuDetailSheet } from './TeacherMenuDetailSheet';
import type { ChallengeRewardScene } from './challengeRewardUtils';
import type { PersonalChallengeProgressItem } from './hooks/usePersonalChallenges';
import type { GroupExerciseMap } from '../menu/group-card/groupCardUtils';

interface HomeOverlaysProps {
    activeMilestoneModal: FuwafuwaMilestoneEvent | null;
    activeMilestoneUser: UserProfileStore | null;
    onCloseMilestoneModal: () => void;
    activeChallengeRewardScene: ChallengeRewardScene | null;
    onCloseRewardModal: () => void;
    challengeHubOpen: boolean;
    isHomeActive: boolean;
    filteredChallenges: Challenge[];
    todayDoneChallenges: Challenge[];
    pastChallenges: Challenge[];
    completions: ChallengeCompletion[];
    rewardGrants: ChallengeRewardGrant[];
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    customChallengeExercises: CustomExercise[];
    customChallengeMenus: MenuGroup[];
    personalActiveChallenges: PersonalChallengeProgressItem[];
    personalTodayDoneChallenges: PersonalChallengeProgressItem[];
    personalPastChallenges: PersonalChallengeProgressItem[];
    personalChallengesLoading: boolean;
    canCreatePersonalChallenge: boolean;
    onCloseChallengeHub: () => void;
    onCreatePersonalChallenge: () => void;
    onOpenPersonalChallenge: (item: PersonalChallengeProgressItem) => void;
    onTeacherChallengesUpdated: () => void;
    onTeacherChallengeRewardGranted: (scene: ChallengeRewardScene) => void;
    selectedPersonalChallenge: PersonalChallengeProgressItem | null;
    onClosePersonalChallenge: () => void;
    onEditPersonalChallenge: () => void;
    onEndPersonalChallenge: () => void;
    onPromptDeletePersonalChallenge: () => void;
    onRetryPersonalChallenge: () => void;
    personalChallengeDeleteOpen: boolean;
    deletingPersonalChallenge: boolean;
    onClosePersonalChallengeDelete: () => void;
    onDeletePersonalChallenge: () => void;
    personalFormOpen: boolean;
    personalChallengeFormMember: UserProfileStore | null;
    editingPersonalChallenge: PersonalChallengeProgressItem | null;
    personalChallengeSeed: PersonalChallengeCreateSeed | null;
    onClosePersonalChallengeForm: () => void;
    onPersonalChallengeSaved: () => void;
    menuBrowserOpen: boolean;
    onCloseMenuBrowser: () => void;
    exerciseBrowserOpen: boolean;
    onCloseExerciseBrowser: () => void;
    selectedTeacherMenu: TeacherMenu | null;
    teacherMenuExerciseMap: GroupExerciseMap;
    onCloseTeacherMenu: () => void;
    onOpenMenuTab: () => void;
    onOpenExerciseTab: (placement?: TeacherExercise['placement'] | null) => void;
    onCreatePersonalChallengeFromTeacherMenu?: (menu: TeacherMenu) => void;
    onStartTeacherMenu: (menu: TeacherMenu) => void;
    selectedTeacherExercise: TeacherExercise | null;
    onCloseTeacherExercise: () => void;
    onCreatePersonalChallengeFromTeacherExercise?: (exercise: TeacherExercise) => void;
    onStartTeacherExercise: (exercise: TeacherExercise) => void;
    selectedPublicMenu: PublicMenu | null;
    onClosePublicMenu: () => void;
    onImportedPublicMenu: () => void;
    onCreatePersonalChallengeFromPublicMenu: (seed: PersonalChallengeCreateSeed) => void;
    onTryPublicMenu: (menu: PublicMenu, metadata: { menuId: string; menuName: string; menuSource: 'public' }) => void;
    selectedPublicExercise: PublicExercise | null;
    onClosePublicExercise: () => void;
    onImportedPublicExercise: () => void;
    onCreatePersonalChallengeFromPublicExercise: (seed: PersonalChallengeCreateSeed) => void;
    onTryPublicExercise: (exerciseId: string) => void;
}

export const HomeOverlays: React.FC<HomeOverlaysProps> = ({
    activeMilestoneModal,
    activeMilestoneUser,
    onCloseMilestoneModal,
    activeChallengeRewardScene,
    onCloseRewardModal,
    challengeHubOpen,
    isHomeActive,
    filteredChallenges,
    todayDoneChallenges,
    pastChallenges,
    completions,
    rewardGrants,
    teacherExercises,
    teacherMenus,
    customChallengeExercises,
    customChallengeMenus,
    personalActiveChallenges,
    personalTodayDoneChallenges,
    personalPastChallenges,
    personalChallengesLoading,
    canCreatePersonalChallenge,
    onCloseChallengeHub,
    onCreatePersonalChallenge,
    onOpenPersonalChallenge,
    onTeacherChallengesUpdated,
    onTeacherChallengeRewardGranted,
    selectedPersonalChallenge,
    onClosePersonalChallenge,
    onEditPersonalChallenge,
    onEndPersonalChallenge,
    onPromptDeletePersonalChallenge,
    onRetryPersonalChallenge,
    personalChallengeDeleteOpen,
    deletingPersonalChallenge,
    onClosePersonalChallengeDelete,
    onDeletePersonalChallenge,
    personalFormOpen,
    personalChallengeFormMember,
    editingPersonalChallenge,
    personalChallengeSeed,
    onClosePersonalChallengeForm,
    onPersonalChallengeSaved,
    menuBrowserOpen,
    onCloseMenuBrowser,
    exerciseBrowserOpen,
    onCloseExerciseBrowser,
    selectedTeacherMenu,
    teacherMenuExerciseMap,
    onCloseTeacherMenu,
    onOpenMenuTab,
    onOpenExerciseTab,
    onCreatePersonalChallengeFromTeacherMenu,
    onStartTeacherMenu,
    selectedTeacherExercise,
    onCloseTeacherExercise,
    onCreatePersonalChallengeFromTeacherExercise,
    onStartTeacherExercise,
    selectedPublicMenu,
    onClosePublicMenu,
    onImportedPublicMenu,
    onCreatePersonalChallengeFromPublicMenu,
    onTryPublicMenu,
    selectedPublicExercise,
    onClosePublicExercise,
    onImportedPublicExercise,
    onCreatePersonalChallengeFromPublicExercise,
    onTryPublicExercise,
}) => {
    return (
        <>
            <HomeMilestoneModal
                activeMilestoneModal={activeMilestoneModal}
                user={activeMilestoneUser}
                onClose={onCloseMilestoneModal}
            />
            <ChallengeRewardModal
                rewardScene={activeChallengeRewardScene}
                onClose={onCloseRewardModal}
            />

            <ChallengeHubSheet
                open={challengeHubOpen}
                challengeCardsEnabled={isHomeActive}
                onClose={onCloseChallengeHub}
                teacherActiveChallenges={filteredChallenges}
                teacherTodayDoneChallenges={todayDoneChallenges}
                teacherPastChallenges={pastChallenges}
                completions={completions}
                rewardGrants={rewardGrants}
                teacherExercises={teacherExercises}
                teacherMenus={teacherMenus}
                customExercises={customChallengeExercises}
                customMenus={customChallengeMenus}
                personalActiveChallenges={personalActiveChallenges}
                personalTodayDoneChallenges={personalTodayDoneChallenges}
                personalPastChallenges={personalPastChallenges}
                personalLoading={personalChallengesLoading}
                canCreatePersonalChallenge={canCreatePersonalChallenge}
                onCreatePersonalChallenge={onCreatePersonalChallenge}
                onOpenPersonalChallenge={onOpenPersonalChallenge}
                onTeacherChallengesUpdated={onTeacherChallengesUpdated}
                onTeacherChallengeRewardGranted={onTeacherChallengeRewardGranted}
            />

            <PersonalChallengeDetailSheet
                open={selectedPersonalChallenge !== null}
                item={selectedPersonalChallenge}
                teacherExercises={teacherExercises}
                teacherMenus={teacherMenus}
                customExercises={customChallengeExercises}
                customMenus={customChallengeMenus}
                onClose={onClosePersonalChallenge}
                onEdit={onEditPersonalChallenge}
                onEnd={onEndPersonalChallenge}
                onDelete={onPromptDeletePersonalChallenge}
                onRetry={onRetryPersonalChallenge}
            />

            <ConfirmDeleteModal
                open={personalChallengeDeleteOpen}
                title="じぶんチャレンジを削除"
                message={`「${selectedPersonalChallenge?.challenge.title ?? ''}」を削除しますか？まだ進んでいないチャレンジだけ削除できます。`}
                onCancel={() => {
                    if (deletingPersonalChallenge) {
                        return;
                    }
                    onClosePersonalChallengeDelete();
                }}
                onConfirm={onDeletePersonalChallenge}
                loading={deletingPersonalChallenge}
            />

            <PersonalChallengeFormSheet
                open={personalFormOpen}
                member={personalChallengeFormMember}
                teacherExercises={teacherExercises}
                teacherMenus={teacherMenus}
                customExercises={customChallengeExercises}
                customMenus={customChallengeMenus}
                initialItem={editingPersonalChallenge}
                initialSeed={personalChallengeSeed}
                onClose={onClosePersonalChallengeForm}
                onSaved={onPersonalChallengeSaved}
            />

            <PublicMenuBrowser
                open={menuBrowserOpen}
                onClose={onCloseMenuBrowser}
            />

            <TeacherMenuDetailSheet
                menu={selectedTeacherMenu}
                exerciseMap={teacherMenuExerciseMap}
                onClose={onCloseTeacherMenu}
                onOpenMenuTab={onOpenMenuTab}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromTeacherMenu}
                onStart={onStartTeacherMenu}
            />

            <TeacherExerciseDetailSheet
                exercise={selectedTeacherExercise}
                onClose={onCloseTeacherExercise}
                onOpenMenuTab={onOpenExerciseTab}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromTeacherExercise}
                onStart={onStartTeacherExercise}
            />

            <PublicExerciseBrowser
                open={exerciseBrowserOpen}
                onClose={onCloseExerciseBrowser}
            />

            <MenuDetailSheet
                menu={selectedPublicMenu}
                onClose={onClosePublicMenu}
                onImported={onImportedPublicMenu}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromPublicMenu}
                onTry={onTryPublicMenu}
            />

            <ExerciseDetailSheet
                exercise={selectedPublicExercise}
                onClose={onClosePublicExercise}
                onImported={onImportedPublicExercise}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromPublicExercise}
                onTry={onTryPublicExercise}
            />
        </>
    );
};
