import React from 'react';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import type { ChallengeFormValues } from './types';
import { COLOR, FONT, FONT_SIZE } from '../../../lib/styles';
import { Field, Section } from './challenge-form-card/FormPrimitives';
import { RewardSection } from './challenge-form-card/RewardSection';
import { TargetSection } from './challenge-form-card/TargetSection';
import {
    cancelButtonStyle,
    cardDescriptionStyle,
    cardHeaderStyle,
    cardStyle,
    cardTitleStyle,
    dateErrorStyle,
    footerActionRowStyle,
    getSubmitButtonStyle,
    inputStyle,
    metricGridStyle,
} from './challenge-form-card/styles';
import { useChallengeFormCardState } from './challenge-form-card/useChallengeFormCardState';

interface ChallengeFormCardProps {
    values: ChallengeFormValues;
    teacherMenus: TeacherMenu[];
    teacherExercises: TeacherExercise[];
    submitting: boolean;
    isEditing: boolean;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
    onToggleClassLevel: (level: string) => void;
    onCancel: () => void;
    onSubmit: () => void;
}

export const ChallengeFormCard: React.FC<ChallengeFormCardProps> = ({
    values,
    teacherMenus,
    teacherExercises,
    submitting,
    isEditing,
    onChange,
    onToggleClassLevel,
    onCancel,
    onSubmit,
}) => {
    const {
        dateError,
        exerciseSource,
        filteredTeacherExercises,
        filteredTeacherMenus,
        hasError,
        selectedExercisePreview,
        selectedMenuPreview,
        selectedPresetMenu,
        selectedTeacherExercise,
        selectedTeacherMenu,
        setExerciseSource,
        setTeacherExerciseQuery,
        setTeacherMenuQuery,
        sortedTeacherExercises,
        sortedTeacherMenus,
        teacherExerciseQuery,
        teacherMenuQuery,
    } = useChallengeFormCardState({
        values,
        teacherMenus,
        teacherExercises,
        onChange,
    });

    return (
        <div className="card" style={cardStyle}>
            <div style={cardHeaderStyle}>
                <div style={cardTitleStyle}>{isEditing ? 'チャレンジを編集' : 'チャレンジを作成'}</div>
                <div style={cardDescriptionStyle}>
                    項目をしぼって、スマホでも作りやすい形にしています。説明は1つだけ入力します。
                </div>
            </div>

            <Section title="基本情報" description="まず名前と説明だけ決めます。">
                <Field label="チャレンジ名" hint="ホームで最初に見える名前です。">
                    <input
                        value={values.title}
                        onChange={(event) => onChange({ title: event.target.value })}
                        placeholder="例: 前後開脚チャレンジ"
                        style={inputStyle}
                    />
                </Field>

                <Field label="説明" hint="ひとこと欄は使わず、この文章をカードや詳細の説明に回します。">
                    <textarea
                        value={values.description}
                        onChange={(event) => onChange({ description: event.target.value })}
                        placeholder="例: 1日1回ゆっくり前後開脚に取り組もう"
                        style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                    />
                </Field>
            </Section>

            <TargetSection
                values={values}
                exerciseSource={exerciseSource}
                teacherExerciseQuery={teacherExerciseQuery}
                teacherMenuQuery={teacherMenuQuery}
                filteredTeacherExercises={filteredTeacherExercises}
                filteredTeacherMenus={filteredTeacherMenus}
                selectedExercisePreview={selectedExercisePreview}
                selectedMenuPreview={selectedMenuPreview}
                selectedPresetMenu={selectedPresetMenu}
                selectedTeacherExercise={selectedTeacherExercise}
                selectedTeacherMenu={selectedTeacherMenu}
                sortedTeacherExercises={sortedTeacherExercises}
                sortedTeacherMenus={sortedTeacherMenus}
                setExerciseSource={setExerciseSource}
                setTeacherExerciseQuery={setTeacherExerciseQuery}
                setTeacherMenuQuery={setTeacherMenuQuery}
                onChange={onChange}
                onToggleClassLevel={onToggleClassLevel}
            />

            <Section title="期間" description="いつからいつまで表示するかを決めます。">
                <div style={metricGridStyle}>
                    <Field label="開始日">
                        <input
                            type="date"
                            value={values.startDate}
                            onChange={(event) => onChange({ startDate: event.target.value })}
                            style={inputStyle}
                        />
                    </Field>
                    <Field label="終了日">
                        <input
                            type="date"
                            value={values.endDate}
                            onChange={(event) => onChange({ endDate: event.target.value })}
                            style={{
                                ...inputStyle,
                                ...(dateError ? { border: '1px solid #E17055' } : {}),
                            }}
                        />
                    </Field>
                </div>

                {dateError ? (
                    <div style={dateErrorStyle}>{dateError}</div>
                ) : null}
            </Section>

            <RewardSection values={values} onChange={onChange} />

            <div style={{
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.xs + 1,
                color: COLOR.muted,
                lineHeight: 1.5,
                marginTop: -6,
            }}>
                アイコンは別で入力せず、選んだ種目やメニューの見た目をそのまま使います。
            </div>

            <div style={footerActionRowStyle}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={cancelButtonStyle}
                >
                    キャンセル
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={hasError || submitting}
                    style={getSubmitButtonStyle(hasError || submitting)}
                >
                    {submitting ? (isEditing ? '保存中...' : '作成中...') : (isEditing ? '保存' : '作成')}
                </button>
            </div>
        </div>
    );
};
