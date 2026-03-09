import React, { useEffect, useState } from 'react';
import {
    createChallenge,
    deleteChallenge,
    type Challenge,
    updateChallenge,
} from '../../lib/challenges';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ChallengeFormCard } from './challenge-management/ChallengeFormCard';
import { ChallengeList } from './challenge-management/ChallengeList';
import { CreateChallengeButton } from './challenge-management/CreateChallengeButton';
import { fetchTeacherExercises, fetchTeacherMenus, type TeacherExercise, type TeacherMenu } from '../../lib/teacherContent';
import {
    createChallengeFormValuesFromChallenge,
    createDefaultChallengeFormValues,
} from './challenge-management/getInitialFormValues';
import type { ChallengeFormValues } from './challenge-management/types';

interface ChallengeManagementProps {
    challenges: Challenge[];
    loading: boolean;
    showCreateForm: boolean;
    setShowCreateForm: (show: boolean) => void;
    teacherEmail: string;
    onCreated: () => void;
    onDeleted: () => void;
}

export const ChallengeManagement: React.FC<ChallengeManagementProps> = ({
    challenges,
    loading,
    showCreateForm,
    setShowCreateForm,
    teacherEmail,
    onCreated,
    onDeleted,
}) => {
    const [formValues, setFormValues] = useState<ChallengeFormValues>(() => createDefaultChallengeFormValues());
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [teacherMenus, setTeacherMenus] = useState<TeacherMenu[]>([]);
    const [teacherExercises, setTeacherExercises] = useState<TeacherExercise[]>([]);

    useEffect(() => {
        Promise.all([fetchTeacherMenus(), fetchTeacherExercises()])
            .then(([menus, exercises]) => {
                setTeacherMenus(menus);
                setTeacherExercises(exercises);
            })
            .catch((error) => {
                console.warn('[teacher] Failed to load teacher content for challenge form:', error);
                setTeacherMenus([]);
                setTeacherExercises([]);
            });
    }, []);

    const resetForm = () => {
        setFormValues(createDefaultChallengeFormValues());
        setEditingId(null);
    };

    const startEdit = (challenge: Challenge) => {
        setFormValues(createChallengeFormValuesFromChallenge(challenge));
        setEditingId(challenge.id);
        setShowCreateForm(true);
    };

    const toggleClassLevel = (level: string) => {
        setFormValues((previous) => ({
            ...previous,
            classLevels: previous.classLevels.includes(level)
                ? previous.classLevels.filter((target) => target !== level)
                : [...previous.classLevels, level],
        }));
    };

    const handleSubmit = async () => {
        if (!formValues.title.trim()) {
            return;
        }

        setSubmitting(true);
        const trimmedTitle = formValues.title.trim();
        const trimmedDescription = formValues.description.trim();

        try {
            if (editingId) {
                await updateChallenge(editingId, {
                    title: trimmedTitle,
                    summary: null,
                    description: trimmedDescription || null,
                    challengeType: formValues.challengeType,
                    exerciseId: formValues.challengeType === 'exercise' ? formValues.exerciseId : null,
                    targetMenuId: formValues.challengeType === 'menu' ? formValues.targetMenuId : null,
                    menuSource: formValues.challengeType === 'menu' ? formValues.menuSource : null,
                    targetCount: formValues.targetCount,
                    dailyCap: formValues.dailyCap,
                    countUnit: formValues.challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
                    startDate: formValues.startDate,
                    endDate: formValues.endDate,
                    rewardKind: formValues.rewardKind,
                    rewardValue: formValues.rewardValue,
                    tier: formValues.tier,
                    iconEmoji: formValues.iconEmoji.trim() || null,
                    classLevels: formValues.classLevels,
                });
            } else {
                await createChallenge({
                    title: trimmedTitle,
                    summary: null,
                    description: trimmedDescription || null,
                    challengeType: formValues.challengeType,
                    exerciseId: formValues.challengeType === 'exercise' ? formValues.exerciseId : null,
                    targetMenuId: formValues.challengeType === 'menu' ? formValues.targetMenuId : null,
                    menuSource: formValues.challengeType === 'menu' ? formValues.menuSource : null,
                    targetCount: formValues.targetCount,
                    dailyCap: formValues.dailyCap,
                    countUnit: formValues.challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
                    startDate: formValues.startDate,
                    endDate: formValues.endDate,
                    createdBy: teacherEmail,
                    rewardKind: formValues.rewardKind,
                    rewardValue: formValues.rewardValue,
                    tier: formValues.tier,
                    iconEmoji: formValues.iconEmoji.trim() || null,
                    classLevels: formValues.classLevels,
                });
            }

            resetForm();
            setShowCreateForm(false);
            onCreated();
        } catch (error) {
            console.warn('[teacher] Failed to save challenge:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        resetForm();
        setShowCreateForm(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTargetId) return;
        setDeleting(true);
        try {
            await deleteChallenge(deleteTargetId);
            onDeleted();
        } catch (error) {
            console.warn('[teacher] Failed to delete challenge:', error);
        } finally {
            setDeleting(false);
            setDeleteTargetId(null);
        }
    };

    return (
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!showCreateForm && (
                <CreateChallengeButton
                    onClick={() => {
                        resetForm();
                        setShowCreateForm(true);
                    }}
                />
            )}

            {showCreateForm && (
                <ChallengeFormCard
                    values={formValues}
                    teacherMenus={teacherMenus}
                    teacherExercises={teacherExercises}
                    submitting={submitting}
                    isEditing={!!editingId}
                    onChange={(patch) => {
                        setFormValues((previous) => ({ ...previous, ...patch }));
                    }}
                    onToggleClassLevel={toggleClassLevel}
                    onCancel={handleCancel}
                    onSubmit={handleSubmit}
                />
            )}

            <ChallengeList
                loading={loading}
                challenges={challenges}
                teacherMenus={teacherMenus}
                teacherExercises={teacherExercises}
                onEdit={startEdit}
                onDelete={(id) => setDeleteTargetId(id)}
            />

            <ConfirmDeleteModal
                open={deleteTargetId !== null}
                title="チャレンジを削除"
                message="このチャレンジを削除しますか？この操作は取り消せません。"
                onCancel={() => setDeleteTargetId(null)}
                onConfirm={handleDeleteConfirm}
                loading={deleting}
            />
        </div>
    );
};
