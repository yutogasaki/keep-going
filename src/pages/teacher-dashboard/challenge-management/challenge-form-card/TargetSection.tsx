import { CLASS_LEVELS, EXERCISES } from '../../../../data/exercises';
import { getExercisePlacementLabel } from '../../../../data/exercisePlacement';
import { PRESET_GROUPS } from '../../../../data/menuGroups';
import { CANONICAL_TERMS } from '../../../../lib/terminology';
import type { TeacherExercise, TeacherMenu } from '../../../../lib/teacherContent';
import type { ChallengeFormValues } from '../types';
import { Field, Section } from './FormPrimitives';
import {
    classLevelWrapStyle,
    fieldHintStyle,
    getClassLevelButtonStyle,
    getSelectedOptionButtonStyle,
    getSelectedSegmentedButtonStyle,
    inputStyle,
    metricGridStyle,
    optionButtonBaseStyle,
    optionButtonDescriptionStyle,
    optionButtonTitleStyle,
    optionGridStyle,
    previewIconStyle,
    previewMetaStyle,
    previewTitleStyle,
    segmentedButtonBaseStyle,
    segmentedRowStyle,
    selectionPreviewStyle,
} from './styles';
import type { ExerciseSource } from './useChallengeFormCardState';

interface TargetSectionProps {
    values: ChallengeFormValues;
    exerciseSource: ExerciseSource;
    teacherExerciseQuery: string;
    teacherMenuQuery: string;
    filteredTeacherExercises: TeacherExercise[];
    filteredTeacherMenus: TeacherMenu[];
    selectedExercisePreview: TeacherExercise | (typeof EXERCISES)[number] | null;
    selectedMenuPreview: TeacherMenu | (typeof PRESET_GROUPS)[number] | null;
    selectedPresetMenu: (typeof PRESET_GROUPS)[number] | null;
    selectedTeacherExercise: TeacherExercise | null;
    selectedTeacherMenu: TeacherMenu | null;
    sortedTeacherExercises: TeacherExercise[];
    sortedTeacherMenus: TeacherMenu[];
    setExerciseSource: (source: ExerciseSource) => void;
    setTeacherExerciseQuery: (value: string) => void;
    setTeacherMenuQuery: (value: string) => void;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
    onToggleClassLevel: (level: string) => void;
}

export function TargetSection({
    values,
    exerciseSource,
    teacherExerciseQuery,
    teacherMenuQuery,
    filteredTeacherExercises,
    filteredTeacherMenus,
    selectedExercisePreview,
    selectedMenuPreview,
    selectedPresetMenu,
    selectedTeacherExercise,
    selectedTeacherMenu,
    sortedTeacherExercises,
    sortedTeacherMenus,
    setExerciseSource,
    setTeacherExerciseQuery,
    setTeacherMenuQuery,
    onChange,
    onToggleClassLevel,
}: TargetSectionProps) {
    return (
        <>
            <Section title="対象" description="何をカウントするチャレンジかを決めます。">
                <Field label="チャレンジの種類">
                    <div style={optionGridStyle}>
                        {([
                            { id: 'exercise', label: '種目チャレンジ', description: '1つの種目を回数で数える' },
                            { id: 'menu', label: 'メニューチャレンジ', description: '1つのメニュー完走を数える' },
                        ] as const).map((option) => {
                            const selected = values.challengeType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (option.id === 'exercise') {
                                            onChange({ challengeType: 'exercise' });
                                            return;
                                        }

                                        onChange({
                                            challengeType: 'menu',
                                            targetMenuId: values.menuSource === 'teacher'
                                                ? (values.targetMenuId || sortedTeacherMenus[0]?.id || '')
                                                : (values.targetMenuId || PRESET_GROUPS[0]?.id || ''),
                                        });
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...getSelectedOptionButtonStyle(selected),
                                    }}
                                >
                                    <span style={optionButtonTitleStyle}>{option.label}</span>
                                    <span style={optionButtonDescriptionStyle}>{option.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {values.challengeType === 'exercise' ? (
                    <Field label={CANONICAL_TERMS.exercise} hint="標準種目か先生の種目を選べます。">
                        <div style={segmentedRowStyle}>
                            {([
                                { id: 'standard', label: CANONICAL_TERMS.standardExercise },
                                { id: 'teacher', label: CANONICAL_TERMS.teacherExercise },
                            ] as const).map((option) => {
                                const selected = exerciseSource === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => {
                                            setExerciseSource(option.id);
                                            if (option.id === 'standard' && !EXERCISES.some((exercise) => exercise.id === values.exerciseId)) {
                                                onChange({ exerciseId: EXERCISES[0]?.id ?? 'S01' });
                                            }
                                            if (option.id === 'teacher' && sortedTeacherExercises.length > 0) {
                                                onChange({ exerciseId: selectedTeacherExercise?.id ?? sortedTeacherExercises[0].id });
                                            }
                                        }}
                                        style={{
                                            ...segmentedButtonBaseStyle,
                                            ...getSelectedSegmentedButtonStyle(selected),
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
                        {exerciseSource === 'teacher' && sortedTeacherExercises.length > 0 && filteredTeacherExercises.length === 0 ? (
                            <div style={fieldHintStyle}>
                                この絞り込みに合う{CANONICAL_TERMS.teacherExercise}がありません。
                            </div>
                        ) : null}

                        {selectedExercisePreview ? (
                            <div style={{ ...selectionPreviewStyle, marginTop: 10 }}>
                                <div style={previewIconStyle}>{selectedExercisePreview.emoji}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={previewTitleStyle}>{selectedExercisePreview.name}</div>
                                    <div style={previewMetaStyle}>
                                        {selectedExercisePreview.sec}秒 ・ {getExercisePlacementLabel(selectedExercisePreview.placement)}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </Field>
                ) : (
                    <Field label={CANONICAL_TERMS.menu} hint="標準メニューか先生メニューを選べます。">
                        <div style={segmentedRowStyle}>
                            {([
                                { id: 'preset', label: CANONICAL_TERMS.presetMenu },
                                { id: 'teacher', label: CANONICAL_TERMS.teacherMenu },
                            ] as const).map((option) => {
                                const selected = values.menuSource === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => onChange({
                                            menuSource: option.id,
                                            targetMenuId: option.id === 'preset'
                                                ? (selectedPresetMenu?.id ?? PRESET_GROUPS[0]?.id ?? '')
                                                : (selectedTeacherMenu?.id ?? sortedTeacherMenus[0]?.id ?? ''),
                                        })}
                                        style={{
                                            ...segmentedButtonBaseStyle,
                                            ...getSelectedSegmentedButtonStyle(selected),
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
                        {values.menuSource === 'teacher' && sortedTeacherMenus.length > 0 && filteredTeacherMenus.length === 0 ? (
                            <div style={fieldHintStyle}>
                                この絞り込みに合う{CANONICAL_TERMS.teacherMenu}がありません。
                            </div>
                        ) : null}

                        {selectedMenuPreview ? (
                            <div style={{ ...selectionPreviewStyle, marginTop: 10 }}>
                                <div style={previewIconStyle}>{selectedMenuPreview.emoji}</div>
                                <div style={{ minWidth: 0 }}>
                                    <div style={previewTitleStyle}>{selectedMenuPreview.name}</div>
                                    <div style={previewMetaStyle}>
                                        {selectedMenuPreview.exerciseIds.length}種目 ・ {values.menuSource === 'teacher' ? '先生メニュー' : '標準メニュー'}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </Field>
                )}

                <div style={metricGridStyle}>
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
                </div>
            </Section>

            <Section title="対象クラス" description="選ばなければ全クラスに表示します。">
                <div style={classLevelWrapStyle}>
                    {CLASS_LEVELS.map((classLevel) => {
                        const selected = values.classLevels.includes(classLevel.id);
                        return (
                            <button
                                key={classLevel.id}
                                type="button"
                                onClick={() => onToggleClassLevel(classLevel.id)}
                                style={getClassLevelButtonStyle(selected)}
                            >
                                <span>{classLevel.emoji}</span>
                                <span>{classLevel.id}</span>
                            </button>
                        );
                    })}
                </div>
            </Section>
        </>
    );
}
