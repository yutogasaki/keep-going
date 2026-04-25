import { EXERCISES } from '@/data/exercises';
import { getExercisePlacementLabel } from '@/data/exercisePlacement';
import { PRESET_GROUPS } from '@/data/menuGroups';
import { COLOR, FONT, FONT_SIZE } from '@/lib/styles';
import { CANONICAL_TERMS } from '@/lib/terminology';
import {
    fieldHintStyle,
    inputStyle,
    metricGridStyle,
    previewIconStyle,
    segmentedButtonBaseStyle,
    segmentedRowStyle,
    selectionPreviewStyle,
} from './ChallengeFormCard.styles';
import { Field } from './ChallengeFormCard.parts';
import type { ChallengeFormValues } from './types';
import type { ChallengeFormState } from './useChallengeForm';

interface ChallengeFormCardTargetPickerProps {
    values: ChallengeFormValues;
    form: ChallengeFormState;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
}

const selectedSegmentStyle = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
    color: COLOR.primaryDark,
} as const;

export function ChallengeFormCardTargetPicker({ values, form, onChange }: ChallengeFormCardTargetPickerProps) {
    const {
        exerciseSource,
        setExerciseSource,
        filteredTeacherExercises,
        filteredTeacherMenus,
        isDurationChallenge,
        selectedExercisePreview,
        selectedMenuPreview,
        selectedPresetMenu,
        selectedTeacherExercise,
        selectedTeacherMenu,
        sortedTeacherExercises,
        sortedTeacherMenus,
        teacherExerciseQuery,
        setTeacherExerciseQuery,
        teacherMenuQuery,
        setTeacherMenuQuery,
    } = form;

    if (values.challengeType === 'duration') {
        return (
            <>
                <Field
                    label="1日の目標時間"
                    hint="休憩をのぞいたストレッチ時間が、この分数以上の日を1日達成として数えます。"
                >
                    <div style={selectionPreviewStyle}>
                        <div style={previewIconStyle}>⏱️</div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 800,
                                    color: COLOR.dark,
                                }}
                            >
                                1日 {Math.max(1, values.dailyMinimumMinutes)}分以上
                            </div>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    color: COLOR.muted,
                                    lineHeight: 1.6,
                                }}
                            >
                                休憩時間は含みません。1日に何回やっても、条件を超えたら1日分だけカウントされます。
                            </div>
                        </div>
                    </div>
                </Field>
                <TargetMetrics values={values} isDurationChallenge={isDurationChallenge} onChange={onChange} />
            </>
        );
    }

    return (
        <>
            {values.challengeType === 'exercise' ? (
                <Field label={CANONICAL_TERMS.exercise} hint="標準種目か先生の種目を選べます。">
                    <div style={segmentedRowStyle}>
                        {(
                            [
                                { id: 'standard', label: CANONICAL_TERMS.standardExercise },
                                { id: 'teacher', label: CANONICAL_TERMS.teacherExercise },
                            ] as const
                        ).map((option) => {
                            const selected = exerciseSource === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        setExerciseSource(option.id);
                                        if (
                                            option.id === 'standard' &&
                                            !EXERCISES.some((exercise) => exercise.id === values.exerciseId)
                                        ) {
                                            onChange({ exerciseId: EXERCISES[0]?.id ?? 'S01' });
                                        }
                                        if (option.id === 'teacher' && sortedTeacherExercises.length > 0) {
                                            onChange({
                                                exerciseId: selectedTeacherExercise?.id ?? sortedTeacherExercises[0].id,
                                            });
                                        }
                                    }}
                                    style={{
                                        ...segmentedButtonBaseStyle,
                                        ...(selected ? selectedSegmentStyle : null),
                                    }}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    {exerciseSource === 'teacher' ? (
                        <input
                            type="text"
                            value={teacherExerciseQuery}
                            onChange={(event) => setTeacherExerciseQuery(event.target.value)}
                            placeholder={`${CANONICAL_TERMS.teacherExercise}をさがす`}
                            style={{ ...inputStyle, marginTop: 10 }}
                        />
                    ) : null}

                    <select
                        value={values.exerciseId}
                        onChange={(event) => onChange({ exerciseId: event.target.value })}
                        style={{ ...inputStyle, appearance: 'auto', marginTop: 10 }}
                    >
                        {(exerciseSource === 'standard' ? EXERCISES : filteredTeacherExercises).map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>
                                {exercise.emoji} {exercise.name}
                            </option>
                        ))}
                    </select>

                    {exerciseSource === 'teacher' && sortedTeacherExercises.length === 0 ? (
                        <div style={fieldHintStyle}>
                            {CANONICAL_TERMS.teacherExercise}がまだありません。先にメニュー設定で作成してください。
                        </div>
                    ) : null}
                    {exerciseSource === 'teacher' &&
                    sortedTeacherExercises.length > 0 &&
                    filteredTeacherExercises.length === 0 ? (
                        <div style={fieldHintStyle}>
                            この絞り込みに合う{CANONICAL_TERMS.teacherExercise}がありません。
                        </div>
                    ) : null}

                    {selectedExercisePreview ? (
                        <div style={{ ...selectionPreviewStyle, marginTop: 10 }}>
                            <div style={previewIconStyle}>{selectedExercisePreview.emoji}</div>
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}
                                >
                                    {selectedExercisePreview.name}
                                </div>
                                <div
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                    }}
                                >
                                    {selectedExercisePreview.sec}秒 ・{' '}
                                    {getExercisePlacementLabel(selectedExercisePreview.placement)}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </Field>
            ) : (
                <Field label={CANONICAL_TERMS.menu} hint="標準メニューか先生メニューを選べます。">
                    <div style={segmentedRowStyle}>
                        {(
                            [
                                { id: 'preset', label: CANONICAL_TERMS.presetMenu },
                                { id: 'teacher', label: CANONICAL_TERMS.teacherMenu },
                            ] as const
                        ).map((option) => {
                            const selected = values.menuSource === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() =>
                                        onChange({
                                            menuSource: option.id,
                                            targetMenuId:
                                                option.id === 'preset'
                                                    ? (selectedPresetMenu?.id ?? PRESET_GROUPS[0]?.id ?? '')
                                                    : (selectedTeacherMenu?.id ?? sortedTeacherMenus[0]?.id ?? ''),
                                        })
                                    }
                                    style={{
                                        ...segmentedButtonBaseStyle,
                                        ...(selected ? selectedSegmentStyle : null),
                                    }}
                                >
                                    {option.label}
                                </button>
                            );
                        })}
                    </div>

                    {values.menuSource === 'teacher' ? (
                        <input
                            type="text"
                            value={teacherMenuQuery}
                            onChange={(event) => setTeacherMenuQuery(event.target.value)}
                            placeholder={`${CANONICAL_TERMS.teacherMenu}をさがす`}
                            style={{ ...inputStyle, marginTop: 10 }}
                        />
                    ) : null}

                    <select
                        value={values.targetMenuId}
                        onChange={(event) => onChange({ targetMenuId: event.target.value })}
                        style={{ ...inputStyle, appearance: 'auto', marginTop: 10 }}
                    >
                        {(values.menuSource === 'preset' ? PRESET_GROUPS : filteredTeacherMenus).map((menu) => (
                            <option key={menu.id} value={menu.id}>
                                {menu.emoji} {menu.name}
                            </option>
                        ))}
                    </select>

                    {values.menuSource === 'teacher' && sortedTeacherMenus.length === 0 ? (
                        <div style={fieldHintStyle}>
                            先生メニューがまだありません。先にメニュー設定で作成してください。
                        </div>
                    ) : null}
                    {values.menuSource === 'teacher' &&
                    sortedTeacherMenus.length > 0 &&
                    filteredTeacherMenus.length === 0 ? (
                        <div style={fieldHintStyle}>この絞り込みに合う{CANONICAL_TERMS.teacherMenu}がありません。</div>
                    ) : null}

                    {selectedMenuPreview ? (
                        <div style={{ ...selectionPreviewStyle, marginTop: 10 }}>
                            <div style={previewIconStyle}>{selectedMenuPreview.emoji}</div>
                            <div style={{ minWidth: 0 }}>
                                <div
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}
                                >
                                    {selectedMenuPreview.name}
                                </div>
                                <div
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                    }}
                                >
                                    {selectedMenuPreview.exerciseIds.length}種目 ・
                                    {values.menuSource === 'teacher' ? '先生メニュー' : '標準メニュー'}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </Field>
            )}

            <TargetMetrics values={values} isDurationChallenge={isDurationChallenge} onChange={onChange} />
        </>
    );
}

function TargetMetrics({
    values,
    isDurationChallenge,
    onChange,
}: {
    values: ChallengeFormValues;
    isDurationChallenge: boolean;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
}) {
    return (
        <>
            <div style={metricGridStyle}>
                {values.goalType === 'active_day' ? (
                    <>
                        <Field
                            label="必要な日数"
                            hint={
                                isDurationChallenge
                                    ? '1日の目標時間を満たした日を、何日集めたらクリアかを決めます。'
                                    : '対象をやった日を何日集めたらクリアかを決めます。'
                            }
                        >
                            <input
                                type="number"
                                min={1}
                                max={values.windowType === 'rolling' ? Math.max(1, values.windowDays) : undefined}
                                value={values.requiredDays}
                                onChange={(event) =>
                                    onChange({
                                        requiredDays: Number(event.target.value),
                                        targetCount: Number(event.target.value),
                                    })
                                }
                                style={inputStyle}
                            />
                        </Field>

                        {isDurationChallenge ? (
                            <Field label="1日の目標時間" hint="休憩をのぞいた合計時間です。">
                                <input
                                    type="number"
                                    min={1}
                                    value={values.dailyMinimumMinutes}
                                    onChange={(event) => onChange({ dailyMinimumMinutes: Number(event.target.value) })}
                                    style={inputStyle}
                                />
                            </Field>
                        ) : null}
                    </>
                ) : (
                    <>
                        <Field label="目標回数" hint="クリアまでに必要な合計回数です。">
                            <input
                                type="number"
                                min={1}
                                value={values.targetCount}
                                onChange={(event) => onChange({ targetCount: Number(event.target.value) })}
                                style={inputStyle}
                            />
                        </Field>

                        <Field label="1日上限" hint="1日に増える回数の上限です。">
                            <input
                                type="number"
                                min={1}
                                value={values.dailyCap}
                                onChange={(event) => onChange({ dailyCap: Number(event.target.value) })}
                                style={inputStyle}
                            />
                        </Field>
                    </>
                )}
            </div>

            {values.goalType === 'active_day' ? (
                <>
                    <div style={fieldHintStyle}>
                        {isDurationChallenge
                            ? `1日達成は、その日の合計ストレッチ時間が ${Math.max(1, values.dailyMinimumMinutes)}分以上のときにカウントされます。休憩は含みません。`
                            : '1日達成は、その日に対象の種目かメニューを1回以上やるとカウントされます。'}
                    </div>
                    {values.windowType === 'rolling' && values.requiredDays > values.windowDays ? (
                        <div style={{ ...fieldHintStyle, color: COLOR.danger, fontWeight: 700 }}>
                            必要な日数はチャレンジ日数以下にしてください。
                        </div>
                    ) : null}
                </>
            ) : null}
        </>
    );
}
