import React from 'react';
import type { MenuGroup } from '@/data/menuGroups';
import type { CustomExercise } from '@/lib/db';
import { PERSONAL_CHALLENGE_ACTIVE_LIMIT } from '@/lib/personalChallenges';
import type { TeacherExercise, TeacherMenu } from '@/lib/teacherContent';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '@/lib/styles';
import type { PersonalChallengeProgressItem } from '@/pages/home/hooks/usePersonalChallenges';
import type { UserProfileStore } from '@/store/useAppStore';
import { Modal } from './Modal';
import {
    AppearanceFields,
    ChallengeLimitSummary,
    DurationPresetGrid,
    PreviewRow,
    Section,
} from './personal-challenge/FormParts';
import { TargetSelectionSection } from './personal-challenge/TargetSelectionSection';
import type { PersonalChallengeCreateSeed } from './personal-challenge/formTypes';
import { usePersonalChallengeFormController } from './personal-challenge/usePersonalChallengeFormController';

export type { PersonalChallengeCreateSeed } from './personal-challenge/formTypes';

interface PersonalChallengeFormSheetProps {
    open: boolean;
    member: UserProfileStore | null;
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    customExercises?: CustomExercise[];
    customMenus?: MenuGroup[];
    initialItem?: PersonalChallengeProgressItem | null;
    initialSeed?: PersonalChallengeCreateSeed | null;
    onClose: () => void;
    onSaved: () => void;
}

export const PersonalChallengeFormSheet: React.FC<PersonalChallengeFormSheetProps> = ({
    open,
    member,
    teacherExercises,
    teacherMenus,
    customExercises = [],
    customMenus = [],
    initialItem = null,
    initialSeed = null,
    onClose,
    onSaved,
}) => {
    const form = usePersonalChallengeFormController({
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
    });

    return (
        <Modal
            open={open}
            onClose={onClose}
            align="bottom"
            maxWidth={440}
            ariaLabel={form.isEditing ? 'じぶんチャレンジを編集' : 'じぶんチャレンジをつくる'}
            contentStyle={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: 20,
                maxHeight: '88vh',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
                <div>
                    <div style={titleStyle}>
                        {form.isEditing ? 'じぶんチャレンジをへんしゅう' : 'じぶんチャレンジをつくる'}
                    </div>
                    <div style={subtitleStyle}>
                        {member ? `${member.name} の ちいさな目標をつくれるよ。` : 'チャレンジをつくるよ。'}
                    </div>
                </div>

                <Section title="だれのチャレンジ？">
                    <PreviewRow icon="🙂" title={member?.name ?? 'ユーザー'} description="保存すると すぐにはじまるよ" />
                </Section>

                <TargetSelectionSection
                    challengeType={form.challengeType}
                    exerciseSource={form.exerciseSource}
                    menuSource={form.menuSource}
                    exerciseId={form.exerciseId}
                    targetMenuId={form.targetMenuId}
                    isEditing={form.isEditing}
                    canEditSetup={form.canEditSetup}
                    teacherExercises={form.teacherExercises}
                    customExercises={form.customExercises}
                    teacherMenus={form.teacherMenus}
                    customMenus={form.customMenus}
                    selectedExerciseOptions={form.selectedExerciseOptions}
                    selectedMenuOptions={form.selectedMenuOptions}
                    selectedExerciseValid={form.selectedExerciseValid}
                    selectedMenuValid={form.selectedMenuValid}
                    selectedTargetMissing={form.selectedTargetMissing}
                    missingTargetMessage={form.missingTargetMessage}
                    onChallengeTypeSelect={form.handleChallengeTypeSelect}
                    onExerciseSourceSelect={form.handleExerciseSourceSelect}
                    onMenuSourceSelect={form.handleMenuSourceSelect}
                    onExerciseIdChange={form.setExerciseId}
                    onTargetMenuIdChange={form.setTargetMenuId}
                />

                <Section title="どれくらいやる？">
                    <DurationPresetGrid
                        presetId={form.presetId}
                        disabled={form.isEditing && !form.canEditSetup}
                        onSelectPreset={form.setPresetId}
                    />
                </Section>

                <Section title="見た目">
                    <AppearanceFields
                        title={form.title}
                        description={form.description}
                        iconEmoji={form.iconEmoji}
                        onTitleChange={form.setTitle}
                        onDescriptionChange={form.setDescription}
                        onIconEmojiChange={form.setIconEmoji}
                    />
                </Section>

                <ChallengeLimitSummary
                    hasChallengeAccount={form.hasChallengeAccount}
                    isEditing={form.isEditing}
                    activeCountLoading={form.activeCountLoading}
                    limitReached={form.limitReached}
                    remainingSlots={form.remainingSlots}
                    activeLimit={PERSONAL_CHALLENGE_ACTIVE_LIMIT}
                />

                {form.saveError ? (
                    <div style={errorCardStyle}>
                        {form.saveError}
                    </div>
                ) : null}

                <div style={{ display: 'grid', gap: SPACE.sm }}>
                    <button
                        type="button"
                        onClick={form.handleSubmit}
                        disabled={form.submitDisabled}
                        style={{
                            ...primaryButtonStyle,
                            ...(form.submitDisabled ? disabledButtonStyle : {}),
                        }}
                    >
                        {form.submitting
                            ? 'ほぞん中...'
                            : form.isEditing
                                ? 'この内容でなおす'
                                : 'このチャレンジではじめる'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        style={secondaryButtonStyle}
                    >
                        とじる
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xl,
    fontWeight: 800,
    color: COLOR.dark,
};

const subtitleStyle: React.CSSProperties = {
    marginTop: 6,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    lineHeight: 1.7,
};

const errorCardStyle: React.CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    background: 'rgba(255, 237, 235, 0.86)',
    border: '1px solid rgba(225, 112, 85, 0.24)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: '#C0392B',
    lineHeight: 1.7,
    fontWeight: 700,
};

const primaryButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: RADIUS.lg,
    border: 'none',
    background: 'linear-gradient(135deg, #2BBAA0, #0984E3)',
    color: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.7)',
    color: COLOR.text,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
};

const disabledButtonStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
};
