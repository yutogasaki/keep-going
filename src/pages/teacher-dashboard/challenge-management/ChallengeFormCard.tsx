import React from 'react';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';
import { ChallengeFormCardBasicsSection } from './ChallengeFormCardBasicsSection';
import { ChallengeFormCardMetaSection } from './ChallengeFormCardMetaSection';
import { ChallengeFormCardTargetSection } from './ChallengeFormCardTargetSection';
import { ChallengeFormCardTimingSection } from './ChallengeFormCardTimingSection';
import type { ChallengeFormValues } from './types';
import { useChallengeForm } from './useChallengeForm';

interface ChallengeFormCardProps {
    values: ChallengeFormValues;
    teacherMenus: TeacherMenu[];
    teacherExercises: TeacherExercise[];
    submitting: boolean;
    isEditing: boolean;
    saveError?: string | null;
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
    saveError = null,
    onChange,
    onToggleClassLevel,
    onCancel,
    onSubmit,
}) => {
    const form = useChallengeForm(values, teacherMenus, teacherExercises, onChange);

    return (
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.lg,
                    fontWeight: 800,
                    color: COLOR.dark,
                }}>
                    {isEditing ? 'チャレンジを編集' : 'チャレンジを作成'}
                </div>
                <div style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                    color: COLOR.muted,
                    lineHeight: 1.6,
                }}>
                    項目をしぼって、スマホでも作りやすい形にしています。説明は1つだけ入力します。
                </div>
            </div>

            <ChallengeFormCardBasicsSection values={values} onChange={onChange} />
            <ChallengeFormCardTargetSection values={values} form={form} onChange={onChange} />
            <ChallengeFormCardTimingSection values={values} form={form} onChange={onChange} />
            <ChallengeFormCardMetaSection
                values={values}
                onChange={onChange}
                onToggleClassLevel={onToggleClassLevel}
            />

            {saveError ? (
                <div style={{
                    padding: '12px 14px',
                    borderRadius: RADIUS.lg,
                    background: 'rgba(225, 112, 85, 0.1)',
                    border: '1px solid rgba(225, 112, 85, 0.24)',
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                    color: COLOR.danger,
                    lineHeight: 1.7,
                }}
                >
                    {saveError}
                </div>
            ) : null}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                    type="button"
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: RADIUS.lg,
                        border: 'none',
                        background: COLOR.bgMuted,
                        color: COLOR.text,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    キャンセル
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={form.hasError || submitting}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: RADIUS.lg,
                        border: 'none',
                        background: !form.hasError ? COLOR.primary : COLOR.disabled,
                        color: !form.hasError ? COLOR.white : COLOR.light,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 700,
                        cursor: !form.hasError ? 'pointer' : 'not-allowed',
                    }}
                >
                    {submitting ? (isEditing ? '保存中...' : '作成中...') : (isEditing ? '保存' : '作成')}
                </button>
            </div>
        </div>
    );
};
