import React from 'react';
import { ConfirmDeleteModal } from '../../../components/ConfirmDeleteModal';
import { PersonalChallengeFormSheet, type PersonalChallengeCreateSeed } from '../../../components/PersonalChallengeFormSheet';
import { PublicExerciseBrowser } from '../../../components/PublicExerciseBrowser';
import { PublicMenuBrowser } from '../../../components/PublicMenuBrowser';
import { Toast } from '../../../components/Toast';
import type { ClassLevel } from '../../../data/exercises';
import type { MenuGroup } from '../../../data/menuGroups';
import {
    buildCustomExerciseDeletePlan,
    buildCustomGroupDeletePlan,
} from '../../../lib/customContentDeletePlan';
import type { CustomExercise } from '../../../lib/db';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { TeacherMenuSetting } from '../../../lib/teacherMenuSettings';
import type { UserProfileStore } from '../../../store/useAppStore';
import { CustomMenuModal } from '../CustomMenuModal';

interface MenuPageOverlaysProps {
    showCustomMenu: boolean;
    isTogetherMode: boolean;
    dailyTargetMinutes: number;
    requiredExercises: string[];
    excludedExercises: string[];
    customExercises: CustomExercise[];
    classLevel: ClassLevel;
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    teacherSettings: TeacherMenuSetting[];
    teacherExcludedExerciseIds: Set<string>;
    teacherRequiredExerciseIds: Set<string>;
    teacherHiddenExerciseIds: Set<string>;
    onCloseCustomMenu: () => void;
    onSetDailyTargetMinutes: (minutes: number) => void;
    onSetExcludedExercises: (exerciseIds: string[]) => void;
    onSetRequiredExercises: (exerciseIds: string[]) => void;
    showPublicBrowser: boolean;
    onClosePublicBrowser: () => void;
    onImportedPublicMenu: () => void;
    onCreatePersonalChallengeFromPublicMenu?: (seed: PersonalChallengeCreateSeed) => Promise<void>;
    showPublicExerciseBrowser: boolean;
    onClosePublicExerciseBrowser: () => void;
    onImportedPublicExercise: () => void;
    onCreatePersonalChallengeFromPublicExercise?: (seed: PersonalChallengeCreateSeed) => Promise<void>;
    personalChallengeFormOpen: boolean;
    personalChallengeMember: UserProfileStore | null;
    customGroups: MenuGroup[];
    personalChallengeSeed: PersonalChallengeCreateSeed | null;
    onClosePersonalChallengeForm: () => void;
    onPersonalChallengeSaved: () => void;
    deleteGroupId: string | null;
    deleteGroupLoading: boolean;
    customGroupDeleteImpact: ReturnType<typeof buildCustomGroupDeletePlan>;
    onCancelDeleteGroup: () => void;
    onConfirmDeleteGroup: () => void;
    deleteExId: string | null;
    deleteExLoading: boolean;
    customExerciseDeleteImpact: ReturnType<typeof buildCustomExerciseDeletePlan>;
    onCancelDeleteExercise: () => void;
    onConfirmDeleteExercise: () => void;
    toastMessage: { text: string; type: 'success' | 'error' } | null;
    onCloseToast: () => void;
}

export const MenuPageOverlays: React.FC<MenuPageOverlaysProps> = ({
    showCustomMenu,
    isTogetherMode,
    dailyTargetMinutes,
    requiredExercises,
    excludedExercises,
    customExercises,
    classLevel,
    teacherExercises,
    teacherMenus,
    teacherSettings,
    teacherExcludedExerciseIds,
    teacherRequiredExerciseIds,
    teacherHiddenExerciseIds,
    onCloseCustomMenu,
    onSetDailyTargetMinutes,
    onSetExcludedExercises,
    onSetRequiredExercises,
    showPublicBrowser,
    onClosePublicBrowser,
    onImportedPublicMenu,
    onCreatePersonalChallengeFromPublicMenu,
    showPublicExerciseBrowser,
    onClosePublicExerciseBrowser,
    onImportedPublicExercise,
    onCreatePersonalChallengeFromPublicExercise,
    personalChallengeFormOpen,
    personalChallengeMember,
    customGroups,
    personalChallengeSeed,
    onClosePersonalChallengeForm,
    onPersonalChallengeSaved,
    deleteGroupId,
    deleteGroupLoading,
    customGroupDeleteImpact,
    onCancelDeleteGroup,
    onConfirmDeleteGroup,
    deleteExId,
    deleteExLoading,
    customExerciseDeleteImpact,
    onCancelDeleteExercise,
    onConfirmDeleteExercise,
    toastMessage,
    onCloseToast,
}) => {
    return (
        <>
            <CustomMenuModal
                show={showCustomMenu}
                isTogetherMode={isTogetherMode}
                dailyTargetMinutes={dailyTargetMinutes}
                requiredExercises={requiredExercises}
                excludedExercises={excludedExercises}
                customExercises={customExercises}
                classLevel={classLevel}
                teacherExercises={teacherExercises.filter((exercise) => !teacherHiddenExerciseIds.has(exercise.id))}
                teacherSettings={teacherSettings}
                teacherExcludedExerciseIds={teacherExcludedExerciseIds}
                teacherRequiredExerciseIds={teacherRequiredExerciseIds}
                teacherHiddenExerciseIds={teacherHiddenExerciseIds}
                onClose={onCloseCustomMenu}
                onSetDailyTargetMinutes={onSetDailyTargetMinutes}
                onSetExcludedExercises={onSetExcludedExercises}
                onSetRequiredExercises={onSetRequiredExercises}
            />

            <PublicMenuBrowser
                open={showPublicBrowser}
                onClose={onClosePublicBrowser}
                onImported={onImportedPublicMenu}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromPublicMenu}
            />

            <PublicExerciseBrowser
                open={showPublicExerciseBrowser}
                onClose={onClosePublicExerciseBrowser}
                onImported={onImportedPublicExercise}
                onCreatePersonalChallenge={onCreatePersonalChallengeFromPublicExercise}
            />

            <PersonalChallengeFormSheet
                open={personalChallengeFormOpen}
                member={personalChallengeMember}
                teacherExercises={teacherExercises}
                teacherMenus={teacherMenus}
                customExercises={customExercises}
                customMenus={customGroups}
                initialSeed={personalChallengeSeed}
                onClose={onClosePersonalChallengeForm}
                onSaved={onPersonalChallengeSaved}
            />

            <ConfirmDeleteModal
                open={deleteGroupId !== null}
                title="メニューをさくじょ"
                message={
                    customGroupDeleteImpact.isPublished
                        ? 'このメニューは公開中です。先に非公開にしてから削除します。'
                        : 'このメニューをさくじょしますか？この操作は取り消せません。'
                }
                details={
                    customGroupDeleteImpact.isPublished ? (
                        <div
                            style={{
                                padding: '10px 12px',
                                borderRadius: 12,
                                background: 'rgba(9, 132, 227, 0.08)',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                lineHeight: 1.6,
                                color: '#0984E3',
                            }}
                        >
                            公開中のまま削除すると公開版だけ残るため、削除前に自動で非公開にします。
                        </div>
                    ) : null
                }
                loading={deleteGroupLoading}
                confirmLabel={customGroupDeleteImpact.isPublished ? '非公開にして削除する' : '削除する'}
                loadingLabel={customGroupDeleteImpact.isPublished ? '非公開にしています...' : '削除中...'}
                onCancel={onCancelDeleteGroup}
                onConfirm={onConfirmDeleteGroup}
            />

            <ConfirmDeleteModal
                open={deleteExId !== null}
                title="種目をさくじょ"
                message={
                    customExerciseDeleteImpact.isPublished ||
                    customExerciseDeleteImpact.publishedMenuNames.length > 0
                        ? 'このじぶん種目は公開に関係しています。公開中の種目やメニューを先に非公開にしてから削除します。'
                        : customExerciseDeleteImpact.updatedMenuNames.length > 0 ||
                            customExerciseDeleteImpact.removedMenuNames.length > 0
                          ? 'このじぶん種目をさくじょします。使っているメニューからは自動で外し、空になったメニューは自動でさくじょします。'
                        : 'このじぶん種目をさくじょしますか？この操作は取り消せません。'
                }
                details={
                    customExerciseDeleteImpact.isPublished ||
                    customExerciseDeleteImpact.publishedMenuNames.length > 0 ||
                    customExerciseDeleteImpact.updatedMenuNames.length > 0 ||
                    customExerciseDeleteImpact.removedMenuNames.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {customExerciseDeleteImpact.isPublished ? (
                                <div
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 12,
                                        background: 'rgba(9, 132, 227, 0.08)',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        lineHeight: 1.6,
                                        color: '#0984E3',
                                    }}
                                >
                                    この種目は公開中なので、削除前に自動で非公開にします。
                                </div>
                            ) : null}
                            {customExerciseDeleteImpact.publishedMenuNames.length > 0 ? (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: 6,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#0984E3',
                                        }}
                                    >
                                        先に非公開になるメニュー
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {customExerciseDeleteImpact.publishedMenuNames.map((name) => (
                                            <span
                                                key={`published-${name}`}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(9, 132, 227, 0.1)',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#0984E3',
                                                }}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {customExerciseDeleteImpact.updatedMenuNames.length > 0 ? (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: 6,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#2BBAA0',
                                        }}
                                    >
                                        自動で外れるメニュー
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {customExerciseDeleteImpact.updatedMenuNames.map((name) => (
                                            <span
                                                key={`update-${name}`}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(43, 186, 160, 0.1)',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#00796B',
                                                }}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {customExerciseDeleteImpact.removedMenuNames.length > 0 ? (
                                <div>
                                    <div
                                        style={{
                                            marginBottom: 6,
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#E17055',
                                        }}
                                    >
                                        空になるので削除されるメニュー
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {customExerciseDeleteImpact.removedMenuNames.map((name) => (
                                            <span
                                                key={`remove-${name}`}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 999,
                                                    background: 'rgba(225, 112, 85, 0.1)',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 12,
                                                    color: '#E17055',
                                                }}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null
                }
                loading={deleteExLoading}
                confirmLabel={
                    customExerciseDeleteImpact.isPublished ||
                    customExerciseDeleteImpact.publishedMenuNames.length > 0
                        ? '非公開にして削除する'
                        : customExerciseDeleteImpact.updatedMenuNames.length > 0 ||
                            customExerciseDeleteImpact.removedMenuNames.length > 0
                          ? '外して削除する'
                        : '削除する'
                }
                loadingLabel={
                    customExerciseDeleteImpact.isPublished ||
                    customExerciseDeleteImpact.publishedMenuNames.length > 0
                        ? '非公開にしています...'
                        : '更新中...'
                }
                onCancel={onCancelDeleteExercise}
                onConfirm={onConfirmDeleteExercise}
            />

            <Toast
                message={toastMessage?.text ?? null}
                type={toastMessage?.type ?? 'success'}
                onClose={onCloseToast}
            />
        </>
    );
};
