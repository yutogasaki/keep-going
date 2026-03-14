import React, { useEffect, useMemo, useState } from 'react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { getExercisePlacementLabel } from '../../../data/exercisePlacement';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import { sortTeacherContentByRecommendation } from '../../../lib/teacherExerciseMetadata';
import { CANONICAL_TERMS } from '../../../lib/terminology';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { ChallengeFormValues } from './types';
import {
    applyDurationPreset,
    CHALLENGE_DURATION_PRESET_OPTIONS,
    getDurationPresetSummary,
} from './durationPresets';

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

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    outline: 'none',
    boxSizing: 'border-box',
};

const fieldLabelStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.dark,
    marginBottom: 6,
};

const fieldHintStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.5,
    marginTop: 6,
};

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.md,
    padding: '16px',
    borderRadius: RADIUS.xl,
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(255,255,255,0.55)',
};

const sectionTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 800,
    color: COLOR.dark,
};

const sectionDescriptionStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.6,
    marginTop: 2,
};

const optionGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACE.sm,
};

const optionButtonBaseStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
};

const segmentedRowStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: SPACE.sm,
};

const segmentedButtonBaseStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.text,
};

const metricGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: SPACE.md,
};

const selectionPreviewStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    background: '#F8FBFA',
    border: '1px solid rgba(43, 186, 160, 0.12)',
};

const previewIconStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    background: 'rgba(43, 186, 160, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    flexShrink: 0,
};

const classLevelWrapStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
};

const rewardPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    padding: '14px 16px',
    borderRadius: RADIUS.xl,
    background: 'linear-gradient(135deg, rgba(255, 248, 225, 0.9), rgba(255, 255, 255, 0.92))',
    border: '1px solid rgba(255, 215, 0, 0.18)',
};

function Field({
    label,
    hint,
    children,
}: {
    label: string;
    hint?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div style={fieldLabelStyle}>{label}</div>
            {children}
            {hint ? <div style={fieldHintStyle}>{hint}</div> : null}
        </div>
    );
}

function Section({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section style={sectionStyle}>
            <div>
                <div style={sectionTitleStyle}>{title}</div>
                {description ? <div style={sectionDescriptionStyle}>{description}</div> : null}
            </div>
            {children}
        </section>
    );
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
    const [teacherMenuQuery, setTeacherMenuQuery] = useState('');
    const [exerciseSource, setExerciseSource] = useState<'standard' | 'teacher'>('standard');
    const [teacherExerciseQuery, setTeacherExerciseQuery] = useState('');

    const sortedTeacherMenus = useMemo(
        () => sortTeacherContentByRecommendation(teacherMenus),
        [teacherMenus],
    );
    const sortedTeacherExercises = useMemo(
        () => sortTeacherContentByRecommendation(teacherExercises),
        [teacherExercises],
    );

    const filteredTeacherExercises = useMemo(() => {
        const normalizedQuery = teacherExerciseQuery.trim().toLowerCase();
        return sortedTeacherExercises.filter((exercise) => (
            normalizedQuery.length === 0 || exercise.name.toLowerCase().includes(normalizedQuery)
        ));
    }, [sortedTeacherExercises, teacherExerciseQuery]);

    const filteredTeacherMenus = useMemo(() => {
        const normalizedQuery = teacherMenuQuery.trim().toLowerCase();
        return sortedTeacherMenus.filter((menu) => (
            normalizedQuery.length === 0 || menu.name.toLowerCase().includes(normalizedQuery)
        ));
    }, [sortedTeacherMenus, teacherMenuQuery]);

    const selectedTeacherExercise = sortedTeacherExercises.find((exercise) => exercise.id === values.exerciseId) ?? null;
    const selectedTeacherMenu = sortedTeacherMenus.find((menu) => menu.id === values.targetMenuId) ?? null;
    const selectedStandardExercise = EXERCISES.find((exercise) => exercise.id === values.exerciseId) ?? EXERCISES[0] ?? null;
    const selectedPresetMenu = PRESET_GROUPS.find((menu) => menu.id === values.targetMenuId) ?? PRESET_GROUPS[0] ?? null;

    const hasExerciseTarget = exerciseSource === 'standard'
        ? EXERCISES.some((exercise) => exercise.id === values.exerciseId)
        : sortedTeacherExercises.some((exercise) => exercise.id === values.exerciseId);
    const hasMenuTarget = values.menuSource === 'preset'
        ? PRESET_GROUPS.some((group) => group.id === values.targetMenuId)
        : sortedTeacherMenus.some((menu) => menu.id === values.targetMenuId);

    const dateError = values.startDate && values.endDate && values.endDate < values.startDate
        ? '終了日は開始日より後にしてください'
        : '';
    const publishDateError = values.publishMode === 'seasonal'
        && values.publishStartDate
        && values.publishEndDate
        && values.publishEndDate < values.publishStartDate
        ? '表示終了日は表示開始日より後にしてください'
        : '';

    const isDurationChallenge = values.challengeType === 'duration';
    const hasError = !values.title.trim()
        || (values.goalType === 'active_day'
            ? values.requiredDays < 1 || (values.windowType === 'rolling' ? values.windowDays < 1 || values.requiredDays > values.windowDays : false)
            : values.targetCount < 1 || values.dailyCap < 1)
        || (isDurationChallenge && values.dailyMinimumMinutes < 1)
        || !!dateError
        || !!publishDateError
        || (values.challengeType === 'exercise' && !hasExerciseTarget)
        || (values.challengeType === 'menu' && !hasMenuTarget);

    useEffect(() => {
        if (exerciseSource !== 'teacher') {
            setTeacherExerciseQuery('');
        }
    }, [exerciseSource]);

    useEffect(() => {
        if (values.menuSource !== 'teacher') {
            setTeacherMenuQuery('');
        }
    }, [values.menuSource]);

    useEffect(() => {
        if (selectedTeacherExercise) {
            setExerciseSource('teacher');
            return;
        }

        if (EXERCISES.some((exercise) => exercise.id === values.exerciseId)) {
            setExerciseSource('standard');
        }
    }, [selectedTeacherExercise, values.exerciseId]);

    useEffect(() => {
        if (values.challengeType !== 'exercise' || exerciseSource !== 'teacher') {
            return;
        }

        if (filteredTeacherExercises.length === 0) {
            return;
        }

        if (!filteredTeacherExercises.some((exercise) => exercise.id === values.exerciseId)) {
            onChange({ exerciseId: filteredTeacherExercises[0].id });
        }
    }, [exerciseSource, filteredTeacherExercises, onChange, values.challengeType, values.exerciseId]);

    useEffect(() => {
        if (values.challengeType !== 'menu' || values.menuSource !== 'teacher') {
            return;
        }

        if (filteredTeacherMenus.length === 0) {
            return;
        }

        if (!filteredTeacherMenus.some((menu) => menu.id === values.targetMenuId)) {
            onChange({ targetMenuId: filteredTeacherMenus[0].id });
        }
    }, [filteredTeacherMenus, onChange, values.challengeType, values.menuSource, values.targetMenuId]);

    const selectedExercisePreview = exerciseSource === 'teacher' ? selectedTeacherExercise : selectedStandardExercise;
    const selectedMenuPreview = values.menuSource === 'teacher' ? selectedTeacherMenu : selectedPresetMenu;
    const isCustomDuration = values.durationPreset === 'custom';
    const durationSummary = getDurationPresetSummary(values);

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

            <Section
                title="達成の形"
                description="期間で回数を数えるか、参加してから何日できたかを数えるかを選びます。"
            >
                <Field label="チャレンジ方式">
                    <div style={optionGridStyle}>
                        {([
                            {
                                id: 'calendar',
                                label: '期間でチャレンジ',
                                description: '公開中の合計回数を数える、今までの先生チャレンジ',
                            },
                            {
                                id: 'rolling',
                                label: '毎日チャレンジ',
                                description: '参加した日から数えて、できた日数を集める',
                            },
                        ] as const).map((option) => {
                            const selected = values.windowType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        const nextWindowType = option.id;
                                        const nextGoalType: ChallengeFormValues['goalType'] = isDurationChallenge
                                            ? 'active_day'
                                            : (nextWindowType === 'rolling' ? 'active_day' : 'total_count');
                                        const basePatch: Partial<ChallengeFormValues> = nextWindowType === 'calendar'
                                            ? {
                                                windowType: 'calendar' as const,
                                                goalType: nextGoalType,
                                                dailyCap: Math.max(1, values.dailyCap || 1),
                                            }
                                            : {
                                                windowType: 'rolling' as const,
                                                goalType: nextGoalType,
                                                dailyCap: 1,
                                            };

                                        if (values.durationPreset === 'custom') {
                                            onChange({
                                                ...basePatch,
                                                targetCount: nextWindowType === 'rolling'
                                                    ? Math.max(1, values.requiredDays || 5)
                                                    : Math.max(1, values.targetCount || 5),
                                            });
                                            return;
                                        }

                                        onChange({
                                            ...basePatch,
                                            ...applyDurationPreset({
                                                durationPreset: values.durationPreset,
                                                windowType: nextWindowType,
                                                goalType: nextGoalType,
                                                startDate: values.startDate,
                                                windowDays: values.windowDays,
                                                publishMode: values.publishMode,
                                                publishStartDate: values.publishStartDate,
                                                publishEndDate: values.publishEndDate,
                                            }, values.durationPreset),
                                        });
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? {
                                            border: '2px solid #2BBAA0',
                                            background: '#E8F8F0',
                                        } : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {isDurationChallenge ? (
                    <div style={fieldHintStyle}>
                        時間チャレンジは、期間で数える形と、参加した人ごとに毎日数える形の両方を作れます。
                    </div>
                ) : null}
            </Section>

            <Section title="対象" description="何をカウントするチャレンジかを決めます。">
                <Field label="チャレンジの種類">
                    <div style={optionGridStyle}>
                        {([
                            { id: 'exercise', label: '種目チャレンジ', description: '1つの種目を回数で数える' },
                            { id: 'menu', label: 'メニューチャレンジ', description: '1つのメニュー完走を数える' },
                            { id: 'duration', label: '時間チャレンジ', description: 'その日の合計時間が足りた日数を数える' },
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

                                        if (option.id === 'duration') {
                                            onChange({
                                                challengeType: 'duration',
                                                goalType: 'active_day',
                                                dailyCap: 1,
                                                dailyMinimumMinutes: Math.max(1, values.dailyMinimumMinutes || 3),
                                                requiredDays: Math.max(1, values.requiredDays || 5),
                                                targetCount: Math.max(1, values.requiredDays || 5),
                                            });
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
                                        ...(selected ? {
                                            border: '2px solid #2BBAA0',
                                            background: '#E8F8F0',
                                        } : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {values.challengeType === 'duration' ? (
                    <Field label="1日の目標時間" hint="休憩をのぞいたストレッチ時間が、この分数以上の日を1日達成として数えます。">
                        <div style={selectionPreviewStyle}>
                            <div style={previewIconStyle}>⏱️</div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 800,
                                    color: COLOR.dark,
                                }}>
                                    1日 {Math.max(1, values.dailyMinimumMinutes)}分以上
                                </div>
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    color: COLOR.muted,
                                    lineHeight: 1.6,
                                }}>
                                    休憩時間は含みません。1日に何回やっても、条件を超えたら1日分だけカウントされます。
                                </div>
                            </div>
                        </div>
                    </Field>
                ) : values.challengeType === 'exercise' ? (
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
                                            ...(selected ? {
                                                border: '2px solid #2BBAA0',
                                                background: '#E8F8F0',
                                                color: COLOR.primaryDark,
                                            } : null),
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
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {selectedExercisePreview.name}
                                    </div>
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                    }}>
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
                                            ...(selected ? {
                                                border: '2px solid #2BBAA0',
                                                background: '#E8F8F0',
                                                color: COLOR.primaryDark,
                                            } : null),
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
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {selectedMenuPreview.name}
                                    </div>
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                    }}>
                                        {selectedMenuPreview.exerciseIds.length}種目 ・ {values.menuSource === 'teacher' ? '先生メニュー' : '標準メニュー'}
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </Field>
                )}

                <div style={metricGridStyle}>
                    {values.goalType === 'active_day' ? (
                        <>
                            <Field label="必要な日数" hint={isDurationChallenge ? '1日の目標時間を満たした日を、何日集めたらクリアかを決めます。' : '対象をやった日を何日集めたらクリアかを決めます。'}>
                                <input
                                    type="number"
                                    min={1}
                                    max={values.windowType === 'rolling' ? Math.max(1, values.windowDays) : undefined}
                                    value={values.requiredDays}
                                    onChange={(event) => onChange({
                                        requiredDays: Number(event.target.value),
                                        targetCount: Number(event.target.value),
                                    })}
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
            </Section>

            <Section
                title="期間"
                description={values.windowType === 'rolling'
                    ? 'まずはおすすめの期間を選ぶだけで作れます。細かく決めたいときだけカスタムを開きます。'
                    : 'まずはおすすめの期間を選ぶだけで作れます。開始日や終了日を細かく決めたいときだけカスタムを開きます。'}
            >
                <Field label="期間プリセット">
                    <div style={optionGridStyle}>
                        {CHALLENGE_DURATION_PRESET_OPTIONS.map((option) => {
                            const selected = values.durationPreset === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (option.id === 'custom') {
                                            onChange({ durationPreset: 'custom' });
                                            return;
                                        }

                                        onChange(applyDurationPreset({
                                            durationPreset: values.durationPreset,
                                            windowType: values.windowType,
                                            goalType: values.goalType,
                                            startDate: values.startDate,
                                            windowDays: values.windowDays,
                                            publishMode: values.publishMode,
                                            publishStartDate: values.publishStartDate,
                                            publishEndDate: values.publishEndDate,
                                        }, option.id));
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? {
                                            border: '2px solid #2BBAA0',
                                            background: '#E8F8F0',
                                        } : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {!isCustomDuration ? (
                    <div style={selectionPreviewStyle}>
                        <div style={previewIconStyle}>🗓️</div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 800,
                                color: COLOR.dark,
                            }}>
                                {values.durationPreset === 'week' ? '1週間' : values.durationPreset === 'two_weeks' ? '2週間' : '1ヶ月'}で作成
                            </div>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xs + 1,
                                color: COLOR.muted,
                                lineHeight: 1.6,
                            }}>
                                {durationSummary}
                            </div>
                        </div>
                    </div>
                ) : null}

                {isCustomDuration ? (
                    <div style={metricGridStyle}>
                        {values.windowType === 'rolling' ? (
                            <Field label="チャレンジ日数">
                                <input
                                    type="number"
                                    min={1}
                                    value={values.windowDays}
                                    onChange={(event) => onChange({ windowDays: Number(event.target.value) })}
                                    style={inputStyle}
                                />
                            </Field>
                        ) : (
                            <>
                                <Field label="開始日">
                                    <input
                                        type="date"
                                        value={values.startDate}
                                        onChange={(event) => onChange({
                                            startDate: event.target.value,
                                            ...(values.publishMode === 'seasonal' ? { publishStartDate: event.target.value } : {}),
                                        })}
                                        style={inputStyle}
                                    />
                                </Field>
                                <Field label="終了日">
                                    <input
                                        type="date"
                                        value={values.endDate}
                                        onChange={(event) => onChange({
                                            endDate: event.target.value,
                                            ...(values.publishMode === 'seasonal' ? { publishEndDate: event.target.value } : {}),
                                        })}
                                        style={{
                                            ...inputStyle,
                                            ...(dateError ? { border: '1px solid #E17055' } : {}),
                                        }}
                                    />
                                </Field>
                            </>
                        )}
                    </div>
                ) : null}

                {dateError ? (
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        color: COLOR.danger,
                        fontWeight: 700,
                    }}>
                        {dateError}
                    </div>
                ) : null}
            </Section>

            <Section
                title="ホームでの見せ方"
                description="今だけ出すか、いつでも出しておくかを決めます。"
            >
                <Field label="掲載方法">
                    <div style={optionGridStyle}>
                        {([
                            { id: 'seasonal', label: '今だけ出す', description: '表示する期間を決める' },
                            { id: 'always_on', label: 'いつでも出す', description: '定番やはじめて用に置いておく' },
                        ] as const).map((option) => {
                            const selected = values.publishMode === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange({
                                        publishMode: option.id,
                                        ...(option.id === 'seasonal'
                                            ? {
                                                publishStartDate: values.publishStartDate || values.startDate,
                                                publishEndDate: values.publishEndDate || values.endDate,
                                            }
                                            : {}),
                                    })}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? {
                                            border: '2px solid #2BBAA0',
                                            background: '#E8F8F0',
                                        } : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {values.publishMode === 'seasonal' ? (
                    <div style={metricGridStyle}>
                        <Field label="表示開始日">
                            <input
                                type="date"
                                value={values.publishStartDate}
                                onChange={(event) => onChange({ publishStartDate: event.target.value })}
                                style={inputStyle}
                            />
                        </Field>
                        <Field label="表示終了日">
                            <input
                                type="date"
                                value={values.publishEndDate}
                                onChange={(event) => onChange({ publishEndDate: event.target.value })}
                                style={{
                                    ...inputStyle,
                                    ...(publishDateError ? { border: '1px solid #E17055' } : {}),
                                }}
                            />
                        </Field>
                    </div>
                ) : (
                    <div style={selectionPreviewStyle}>
                        <div style={previewIconStyle}>∞</div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 800,
                                color: COLOR.dark,
                            }}>
                                いつでもチャレンジ
                            </div>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xs + 1,
                                color: COLOR.muted,
                                lineHeight: 1.6,
                            }}>
                                定番やはじめて用として、ホームに出し続けます。
                            </div>
                        </div>
                    </div>
                )}

                {publishDateError ? (
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        color: COLOR.danger,
                        fontWeight: 700,
                    }}>
                        {publishDateError}
                    </div>
                ) : null}
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
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: RADIUS.full,
                                    border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                    background: selected ? '#E8F8F0' : COLOR.white,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 700,
                                    color: selected ? COLOR.primaryDark : COLOR.text,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span>{classLevel.emoji}</span>
                                <span>{classLevel.id}</span>
                            </button>
                        );
                    })}
                </div>
            </Section>

            <Section title="ごほうび" description="小さいチャレンジはほし、大きいチャレンジはバッジです。">
                <Field label="チャレンジの大きさ">
                    <div style={optionGridStyle}>
                        {([
                            { id: 'small', label: 'スモール', description: 'ほしを配る軽めのチャレンジ' },
                            { id: 'big', label: 'ビッグ', description: 'バッジを配るしっかり目のチャレンジ' },
                        ] as const).map((option) => {
                            const selected = values.tier === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (option.id === 'small') {
                                            onChange({
                                                tier: 'small',
                                                rewardKind: 'star',
                                                rewardValue: values.rewardKind === 'star' ? Math.max(values.rewardValue, 1) : 1,
                                            });
                                            return;
                                        }

                                        onChange({
                                            tier: 'big',
                                            rewardKind: 'medal',
                                            rewardValue: values.rewardKind === 'medal' ? values.rewardValue : 0,
                                        });
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? {
                                            border: '2px solid #2BBAA0',
                                            background: '#E8F8F0',
                                        } : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {values.tier === 'small' ? (
                    <div style={rewardPanelStyle}>
                        <Field label="もらえるほし" hint="新しく作る時の初期値は1こですが、ここで増やせます。">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <input
                                    type="number"
                                    min={1}
                                    value={Math.max(values.rewardValue, 1)}
                                    onChange={(event) => onChange({ rewardValue: Math.max(Number(event.target.value), 1) })}
                                    style={{ ...inputStyle, width: 120 }}
                                />
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    color: COLOR.text,
                                    fontWeight: 700,
                                }}>
                                    クリアで ほし {Math.max(values.rewardValue, 1)}こ
                                </div>
                            </div>
                        </Field>
                    </div>
                ) : (
                    <div style={rewardPanelStyle}>
                        <Field label="もらえるバッジ" hint="1つ選ぶと、クリア時にそのバッジが配られます。">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))',
                                gap: 8,
                            }}>
                                {Array.from({ length: 12 }, (_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => onChange({ rewardValue: index })}
                                        aria-label={`バッジ ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1 / 1',
                                            borderRadius: 14,
                                            border: values.rewardValue === index ? '2px solid #FFB800' : '1px solid rgba(0,0,0,0.08)',
                                            background: values.rewardValue === index ? '#FFF9E6' : COLOR.white,
                                            padding: 6,
                                            cursor: 'pointer',
                                            boxShadow: values.rewardValue === index ? '0 0 0 2px rgba(255,184,0,0.16)' : 'none',
                                        }}
                                    >
                                        <img
                                            src={`/medal/${index}.webp`}
                                            alt={`バッジ ${index + 1}`}
                                            loading="lazy"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}

                <div style={fieldHintStyle}>
                    アイコンは別で入力せず、選んだ種目やメニューの見た目をそのまま使います。
                </div>
            </Section>

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
                    disabled={hasError || submitting}
                    style={{
                        flex: 1,
                        padding: '12px 0',
                        borderRadius: RADIUS.lg,
                        border: 'none',
                        background: !hasError ? COLOR.primary : COLOR.disabled,
                        color: !hasError ? COLOR.white : COLOR.light,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 700,
                        cursor: !hasError ? 'pointer' : 'not-allowed',
                    }}
                >
                    {submitting ? (isEditing ? '保存中...' : '作成中...') : (isEditing ? '保存' : '作成')}
                </button>
            </div>
        </div>
    );
};
