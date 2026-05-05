import type { CSSProperties } from 'react';
import { FONT, FONT_SIZE, RADIUS, SPACE } from '@/lib/styles';
import { HintText, inputStyle, Section, SegmentButton, SegmentedRow } from './FormParts';
import type {
    ExerciseSource,
    MenuSource,
    PersonalChallengeTargetOption,
    PersonalChallengeType,
} from './formTypes';

interface TargetSelectionSectionProps {
    challengeType: PersonalChallengeType;
    exerciseSource: ExerciseSource;
    menuSource: MenuSource;
    exerciseId: string;
    targetMenuId: string;
    isEditing: boolean;
    canEditSetup: boolean;
    teacherExercises: readonly PersonalChallengeTargetOption[];
    customExercises: readonly PersonalChallengeTargetOption[];
    teacherMenus: readonly PersonalChallengeTargetOption[];
    customMenus: readonly PersonalChallengeTargetOption[];
    selectedExerciseOptions: readonly PersonalChallengeTargetOption[];
    selectedMenuOptions: readonly PersonalChallengeTargetOption[];
    selectedExerciseValid: boolean;
    selectedMenuValid: boolean;
    selectedTargetMissing: boolean;
    missingTargetMessage: string;
    onChallengeTypeSelect: (challengeType: PersonalChallengeType) => void;
    onExerciseSourceSelect: (source: ExerciseSource) => void;
    onMenuSourceSelect: (source: MenuSource) => void;
    onExerciseIdChange: (exerciseId: string) => void;
    onTargetMenuIdChange: (targetMenuId: string) => void;
}

export function TargetSelectionSection({
    challengeType,
    exerciseSource,
    menuSource,
    exerciseId,
    targetMenuId,
    isEditing,
    canEditSetup,
    teacherExercises,
    customExercises,
    teacherMenus,
    customMenus,
    selectedExerciseOptions,
    selectedMenuOptions,
    selectedExerciseValid,
    selectedMenuValid,
    selectedTargetMissing,
    missingTargetMessage,
    onChallengeTypeSelect,
    onExerciseSourceSelect,
    onMenuSourceSelect,
    onExerciseIdChange,
    onTargetMenuIdChange,
}: TargetSelectionSectionProps) {
    const setupLocked = isEditing && !canEditSetup;

    return (
        <Section title="何をやる？">
            <SegmentedRow>
                {([
                    { id: 'exercise', label: '種目' },
                    { id: 'menu', label: 'メニュー' },
                ] as const).map((option) => (
                    <SegmentButton
                        key={option.id}
                        active={challengeType === option.id}
                        disabled={setupLocked}
                        onClick={() => onChallengeTypeSelect(option.id)}
                    >
                        {option.label}
                    </SegmentButton>
                ))}
            </SegmentedRow>

            {challengeType === 'exercise' ? (
                <ExerciseTargetFields
                    exerciseSource={exerciseSource}
                    exerciseId={exerciseId}
                    setupLocked={setupLocked}
                    teacherExercises={teacherExercises}
                    customExercises={customExercises}
                    selectedExerciseOptions={selectedExerciseOptions}
                    selectedExerciseValid={selectedExerciseValid}
                    onExerciseSourceSelect={onExerciseSourceSelect}
                    onExerciseIdChange={onExerciseIdChange}
                />
            ) : (
                <MenuTargetFields
                    menuSource={menuSource}
                    targetMenuId={targetMenuId}
                    setupLocked={setupLocked}
                    teacherMenus={teacherMenus}
                    customMenus={customMenus}
                    selectedMenuOptions={selectedMenuOptions}
                    selectedMenuValid={selectedMenuValid}
                    onMenuSourceSelect={onMenuSourceSelect}
                    onTargetMenuIdChange={onTargetMenuIdChange}
                />
            )}

            {setupLocked ? (
                <HintText>もう進みはじめているので、対象や日数は変えずにタイトルだけ直せます。</HintText>
            ) : null}
            {selectedTargetMissing ? (
                <div style={errorCardStyle}>
                    {missingTargetMessage}
                </div>
            ) : null}
        </Section>
    );
}

function ExerciseTargetFields({
    exerciseSource,
    exerciseId,
    setupLocked,
    teacherExercises,
    customExercises,
    selectedExerciseOptions,
    selectedExerciseValid,
    onExerciseSourceSelect,
    onExerciseIdChange,
}: {
    exerciseSource: ExerciseSource;
    exerciseId: string;
    setupLocked: boolean;
    teacherExercises: readonly PersonalChallengeTargetOption[];
    customExercises: readonly PersonalChallengeTargetOption[];
    selectedExerciseOptions: readonly PersonalChallengeTargetOption[];
    selectedExerciseValid: boolean;
    onExerciseSourceSelect: (source: ExerciseSource) => void;
    onExerciseIdChange: (exerciseId: string) => void;
}) {
    return (
        <>
            <SegmentedRow>
                {([
                    { id: 'standard', label: 'いつもの種目', disabled: false },
                    { id: 'teacher', label: '先生の種目', disabled: teacherExercises.length === 0 },
                    { id: 'custom', label: 'もらった種目', disabled: customExercises.length === 0 },
                ] as const).map((option) => (
                    <SegmentButton
                        key={option.id}
                        active={exerciseSource === option.id}
                        disabled={setupLocked || option.disabled}
                        onClick={() => onExerciseSourceSelect(option.id)}
                    >
                        {option.label}
                    </SegmentButton>
                ))}
            </SegmentedRow>
            <select
                value={exerciseId}
                disabled={setupLocked}
                onChange={(event) => onExerciseIdChange(event.target.value)}
                style={inputStyle}
            >
                {!selectedExerciseValid ? (
                    <option value="">
                        {selectedExerciseOptions.length > 0
                            ? '見つからないので、えらび直してね'
                            : 'えらべる種目がまだないよ'}
                    </option>
                ) : null}
                {selectedExerciseOptions.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                        {exercise.emoji} {exercise.name}
                    </option>
                ))}
            </select>
        </>
    );
}

function MenuTargetFields({
    menuSource,
    targetMenuId,
    setupLocked,
    teacherMenus,
    customMenus,
    selectedMenuOptions,
    selectedMenuValid,
    onMenuSourceSelect,
    onTargetMenuIdChange,
}: {
    menuSource: MenuSource;
    targetMenuId: string;
    setupLocked: boolean;
    teacherMenus: readonly PersonalChallengeTargetOption[];
    customMenus: readonly PersonalChallengeTargetOption[];
    selectedMenuOptions: readonly PersonalChallengeTargetOption[];
    selectedMenuValid: boolean;
    onMenuSourceSelect: (source: MenuSource) => void;
    onTargetMenuIdChange: (targetMenuId: string) => void;
}) {
    return (
        <>
            <SegmentedRow>
                {([
                    { id: 'preset', label: 'いつものメニュー', disabled: false },
                    { id: 'teacher', label: '先生のメニュー', disabled: teacherMenus.length === 0 },
                    { id: 'custom', label: 'もらったメニュー', disabled: customMenus.length === 0 },
                ] as const).map((option) => (
                    <SegmentButton
                        key={option.id}
                        active={menuSource === option.id}
                        disabled={setupLocked || option.disabled}
                        onClick={() => onMenuSourceSelect(option.id)}
                    >
                        {option.label}
                    </SegmentButton>
                ))}
            </SegmentedRow>
            <select
                value={targetMenuId}
                disabled={setupLocked}
                onChange={(event) => onTargetMenuIdChange(event.target.value)}
                style={inputStyle}
            >
                {!selectedMenuValid ? (
                    <option value="">
                        {selectedMenuOptions.length > 0
                            ? '見つからないので、えらび直してね'
                            : 'えらべるメニューがまだないよ'}
                    </option>
                ) : null}
                {selectedMenuOptions.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                        {menu.emoji} {menu.name}
                    </option>
                ))}
            </select>
        </>
    );
}

const errorCardStyle: CSSProperties = {
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
