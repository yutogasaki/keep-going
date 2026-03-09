import React, { useEffect, useMemo, useState } from 'react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { PRESET_GROUPS } from '../../../data/menuGroups';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';
import { getTeacherVisibilityLabel, sortTeacherContentByRecommendation } from '../../../lib/teacherExerciseMetadata';
import { CANONICAL_TERMS } from '../../../lib/terminology';
import type { ChallengeFormValues } from './types';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';

interface ChallengeFormCardProps {
    values: ChallengeFormValues;
    teacherMenus: TeacherMenu[];
    teacherExercises: TeacherExercise[];
    submitting: boolean;
    isEditing: boolean;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
    onToggleClassLevel: (level: string) => void;
    onRandomReward: () => void;
    onCancel: () => void;
    onSubmit: () => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 18px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.bgLight,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    outline: 'none',
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.text,
    marginBottom: 4,
};

export const ChallengeFormCard: React.FC<ChallengeFormCardProps> = ({
    values,
    teacherMenus,
    teacherExercises,
    submitting,
    isEditing,
    onChange,
    onToggleClassLevel,
    onRandomReward,
    onCancel,
    onSubmit,
}) => {
    const [teacherMenuQuery, setTeacherMenuQuery] = useState('');
    const [teacherMenuFocusFilter, setTeacherMenuFocusFilter] = useState<string | null>(null);
    const [exerciseSource, setExerciseSource] = useState<'standard' | 'teacher'>('standard');
    const [teacherExerciseQuery, setTeacherExerciseQuery] = useState('');
    const [teacherExerciseFocusFilter, setTeacherExerciseFocusFilter] = useState<string | null>(null);
    const sortedTeacherMenus = sortTeacherContentByRecommendation(teacherMenus);
    const sortedTeacherExercises = sortTeacherContentByRecommendation(teacherExercises);
    const availableTeacherExerciseTags = useMemo(
        () => [...new Set(sortedTeacherExercises.flatMap((exercise) => exercise.focusTags))],
        [sortedTeacherExercises],
    );
    const filteredTeacherExercises = useMemo(() => {
        const normalizedQuery = teacherExerciseQuery.trim().toLowerCase();
        if (!teacherExerciseFocusFilter) {
            return sortedTeacherExercises.filter((exercise) => (
                normalizedQuery.length === 0 || exercise.name.toLowerCase().includes(normalizedQuery)
            ));
        }

        return sortedTeacherExercises.filter((exercise) => (
            exercise.focusTags.includes(teacherExerciseFocusFilter)
            && (normalizedQuery.length === 0 || exercise.name.toLowerCase().includes(normalizedQuery))
        ));
    }, [sortedTeacherExercises, teacherExerciseFocusFilter, teacherExerciseQuery]);
    const selectedTeacherExercise = sortedTeacherExercises.find((exercise) => exercise.id === values.exerciseId) ?? null;
    const availableTeacherMenuTags = useMemo(
        () => [...new Set(sortedTeacherMenus.flatMap((menu) => menu.focusTags))],
        [sortedTeacherMenus],
    );
    const filteredTeacherMenus = useMemo(() => {
        const normalizedQuery = teacherMenuQuery.trim().toLowerCase();
        if (!teacherMenuFocusFilter) {
            return sortedTeacherMenus.filter((menu) => (
                normalizedQuery.length === 0 || menu.name.toLowerCase().includes(normalizedQuery)
            ));
        }

        return sortedTeacherMenus.filter((menu) => (
            menu.focusTags.includes(teacherMenuFocusFilter)
            && (normalizedQuery.length === 0 || menu.name.toLowerCase().includes(normalizedQuery))
        ));
    }, [sortedTeacherMenus, teacherMenuFocusFilter, teacherMenuQuery]);
    const dateError = values.startDate && values.endDate && values.endDate < values.startDate
        ? '終了日は開始日より後にしてください'
        : '';
    const hasMenuTarget = values.menuSource === 'preset'
        ? PRESET_GROUPS.some((group) => group.id === values.targetMenuId)
        : filteredTeacherMenus.some((menu) => menu.id === values.targetMenuId);
    const selectedTeacherMenu = values.menuSource === 'teacher'
        ? filteredTeacherMenus.find((menu) => menu.id === values.targetMenuId)
            ?? sortedTeacherMenus.find((menu) => menu.id === values.targetMenuId)
            ?? null
        : null;
    const hasError = !values.title.trim()
        || values.targetCount < 1
        || values.dailyCap < 1
        || !!dateError
        || (values.challengeType === 'menu' && !hasMenuTarget);

    useEffect(() => {
        if (teacherMenuFocusFilter && !availableTeacherMenuTags.includes(teacherMenuFocusFilter)) {
            setTeacherMenuFocusFilter(null);
        }
    }, [availableTeacherMenuTags, teacherMenuFocusFilter]);

    useEffect(() => {
        if (values.menuSource !== 'teacher') {
            setTeacherMenuQuery('');
            setTeacherMenuFocusFilter(null);
        }
    }, [values.menuSource]);

    useEffect(() => {
        if (teacherExerciseFocusFilter && !availableTeacherExerciseTags.includes(teacherExerciseFocusFilter)) {
            setTeacherExerciseFocusFilter(null);
        }
    }, [availableTeacherExerciseTags, teacherExerciseFocusFilter]);

    useEffect(() => {
        if (exerciseSource !== 'teacher') {
            setTeacherExerciseQuery('');
            setTeacherExerciseFocusFilter(null);
        }
    }, [exerciseSource]);

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
        if (values.menuSource !== 'teacher') {
            return;
        }

        if (filteredTeacherMenus.length === 0) {
            return;
        }

        const hasSelectedTarget = filteredTeacherMenus.some((menu) => menu.id === values.targetMenuId);
        if (!hasSelectedTarget) {
            onChange({ targetMenuId: filteredTeacherMenus[0].id });
        }
    }, [filteredTeacherMenus, onChange, values.menuSource, values.targetMenuId]);

    useEffect(() => {
        if (values.challengeType !== 'exercise' || exerciseSource !== 'teacher') {
            return;
        }

        if (filteredTeacherExercises.length === 0) {
            return;
        }

        const hasSelectedTarget = filteredTeacherExercises.some((exercise) => exercise.id === values.exerciseId);
        if (!hasSelectedTarget) {
            onChange({ exerciseId: filteredTeacherExercises[0].id });
        }
    }, [exerciseSource, filteredTeacherExercises, onChange, values.challengeType, values.exerciseId]);

    return (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...labelStyle }}>タイトル</div>
            <input
                value={values.title}
                onChange={(event) => onChange({ title: event.target.value })}
                placeholder="例: 前後開脚チャレンジ月間"
                style={inputStyle}
            />

            <div style={{ ...labelStyle }}>カード用ひとこと</div>
            <input
                value={values.summary}
                onChange={(event) => onChange({ summary: event.target.value })}
                placeholder="例: 1日1回、ゆっくり開脚しよう"
                style={inputStyle}
            />

            <div style={{ ...labelStyle }}>詳細説明</div>
            <textarea
                value={values.description}
                onChange={(event) => onChange({ description: event.target.value })}
                placeholder="ホームの詳細で表示する説明文"
                style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }}
            />

            <div>
                <div style={labelStyle}>チャレンジの種類</div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {([
                        { id: 'exercise', label: '種目チャレンジ', description: '1つの種目を回数で達成する' },
                        { id: 'menu', label: 'メニューチャレンジ', description: '1つのメニュー完走を回数で数える' },
                    ] as const).map((option) => {
                        const selected = values.challengeType === option.id;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => onChange(
                                    option.id === 'menu'
                                        ? {
                                            challengeType: option.id,
                                            menuSource: values.menuSource,
                                            targetMenuId: values.menuSource === 'preset'
                                                ? (values.targetMenuId || PRESET_GROUPS[0]?.id || '')
                                                : (values.targetMenuId || sortedTeacherMenus[0]?.id || ''),
                                        }
                                        : { challengeType: option.id }
                                )}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    borderRadius: RADIUS.lg,
                                    border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                    background: selected ? '#E8F8F0' : COLOR.bgLight,
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ ...labelStyle, marginBottom: 2 }}>{option.label}</div>
                                <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.xs, color: COLOR.muted }}>
                                    {option.description}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    {values.challengeType === 'exercise' ? (
                        <>
                            <div style={labelStyle}>{CANONICAL_TERMS.exercise}</div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
                                                if (option.id === 'teacher' && filteredTeacherExercises.length > 0) {
                                                    onChange({ exerciseId: filteredTeacherExercises[0].id });
                                                }
                                            }}
                                            style={{
                                                flex: 1,
                                                padding: '8px 10px',
                                                borderRadius: 12,
                                                border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                                background: selected ? '#E8F8F0' : COLOR.bgLight,
                                                cursor: 'pointer',
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.sm,
                                                fontWeight: 700,
                                                color: COLOR.text,
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {exerciseSource === 'teacher' && availableTeacherExerciseTags.length > 0 ? (
                                <div style={{ marginBottom: 8 }}>
                                    <input
                                        type="text"
                                        value={teacherExerciseQuery}
                                        onChange={(event) => setTeacherExerciseQuery(event.target.value)}
                                        placeholder={`${CANONICAL_TERMS.teacherExercise}をさがす`}
                                        style={{ ...inputStyle, marginBottom: 8 }}
                                    />
                                    <div style={{ ...labelStyle, fontSize: FONT_SIZE.xs }}>ねらいで絞る</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => setTeacherExerciseFocusFilter(null)}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                border: teacherExerciseFocusFilter === null ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                                background: teacherExerciseFocusFilter === null ? '#E8F8F0' : COLOR.bgLight,
                                                color: teacherExerciseFocusFilter === null ? '#2BBAA0' : COLOR.text,
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.xs,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            すべて
                                        </button>
                                        {availableTeacherExerciseTags.map((tag) => {
                                            const selected = teacherExerciseFocusFilter === tag;
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => setTeacherExerciseFocusFilter(tag)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 999,
                                                        border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                                        background: selected ? '#E8F8F0' : COLOR.bgLight,
                                                        color: selected ? '#2BBAA0' : COLOR.text,
                                                        fontFamily: FONT.body,
                                                        fontSize: FONT_SIZE.xs,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : exerciseSource === 'teacher' ? (
                                <input
                                    type="text"
                                    value={teacherExerciseQuery}
                                    onChange={(event) => setTeacherExerciseQuery(event.target.value)}
                                    placeholder={`${CANONICAL_TERMS.teacherExercise}をさがす`}
                                    style={{ ...inputStyle, marginBottom: 8 }}
                                />
                            ) : null}
                            <select
                                value={values.exerciseId}
                                onChange={(event) => onChange({ exerciseId: event.target.value })}
                                style={{ ...inputStyle, appearance: 'auto' }}
                            >
                                {(exerciseSource === 'standard' ? EXERCISES : filteredTeacherExercises).map((exercise) => (
                                    <option key={exercise.id} value={exercise.id}>
                                        {exercise.emoji} {exercise.name}
                                    </option>
                                ))}
                            </select>
                            {exerciseSource === 'teacher' && sortedTeacherExercises.length === 0 ? (
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    color: COLOR.muted,
                                    marginTop: 6,
                                }}>
                                    {CANONICAL_TERMS.teacherExercise}がまだありません。先にメニュー設定で作成してください。
                                </div>
                            ) : null}
                            {exerciseSource === 'teacher' && sortedTeacherExercises.length > 0 && filteredTeacherExercises.length === 0 ? (
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    color: COLOR.muted,
                                    marginTop: 6,
                                }}>
                                    この絞り込みに合う{CANONICAL_TERMS.teacherExercise}がありません。
                                </div>
                            ) : null}
                            {selectedTeacherExercise ? (
                                <div style={{
                                    marginTop: 8,
                                    display: 'flex',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}>
                                    {selectedTeacherExercise.recommended ? (
                                        <span style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs,
                                            fontWeight: 700,
                                            color: '#FFF',
                                            background: '#2BBAA0',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                        }}>
                                            {selectedTeacherExercise.recommendedOrder != null ? `おすすめ ${selectedTeacherExercise.recommendedOrder}` : 'おすすめ'}
                                        </span>
                                    ) : null}
                                    {selectedTeacherExercise.visibility !== 'public' ? (
                                        <span style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs,
                                            fontWeight: 700,
                                            color: '#0984E3',
                                            background: 'rgba(9, 132, 227, 0.1)',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                        }}>
                                            {getTeacherVisibilityLabel(selectedTeacherExercise.visibility)}
                                        </span>
                                    ) : null}
                                    {selectedTeacherExercise.focusTags.map((tag) => (
                                        <span
                                            key={tag}
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.xs,
                                                fontWeight: 700,
                                                color: '#2BBAA0',
                                                background: 'rgba(43,186,160,0.08)',
                                                padding: '2px 8px',
                                                borderRadius: 999,
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <>
                            <div style={labelStyle}>メニュー</div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
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
                                                    ? PRESET_GROUPS[0]?.id ?? ''
                                                    : sortedTeacherMenus[0]?.id ?? '',
                                            })}
                                            style={{
                                                flex: 1,
                                                padding: '8px 10px',
                                                borderRadius: 12,
                                                border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                                background: selected ? '#E8F8F0' : COLOR.bgLight,
                                                cursor: 'pointer',
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.sm,
                                                fontWeight: 700,
                                                color: COLOR.text,
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            {values.menuSource === 'teacher' && availableTeacherMenuTags.length > 0 ? (
                                <div style={{ marginBottom: 8 }}>
                                    <input
                                        type="text"
                                        value={teacherMenuQuery}
                                        onChange={(event) => setTeacherMenuQuery(event.target.value)}
                                        placeholder={`${CANONICAL_TERMS.teacherMenu}をさがす`}
                                        style={{ ...inputStyle, marginBottom: 8 }}
                                    />
                                    <div style={{ ...labelStyle, fontSize: FONT_SIZE.xs }}>ねらいで絞る</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <button
                                            type="button"
                                            onClick={() => setTeacherMenuFocusFilter(null)}
                                            style={{
                                                padding: '6px 10px',
                                                borderRadius: 999,
                                                border: teacherMenuFocusFilter === null ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                                background: teacherMenuFocusFilter === null ? '#E8F8F0' : COLOR.bgLight,
                                                color: teacherMenuFocusFilter === null ? '#2BBAA0' : COLOR.text,
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.xs,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            すべて
                                        </button>
                                        {availableTeacherMenuTags.map((tag) => {
                                            const selected = teacherMenuFocusFilter === tag;
                                            return (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => setTeacherMenuFocusFilter(tag)}
                                                    style={{
                                                        padding: '6px 10px',
                                                        borderRadius: 999,
                                                        border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                                        background: selected ? '#E8F8F0' : COLOR.bgLight,
                                                        color: selected ? '#2BBAA0' : COLOR.text,
                                                        fontFamily: FONT.body,
                                                        fontSize: FONT_SIZE.xs,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : values.menuSource === 'teacher' ? (
                                <input
                                    type="text"
                                    value={teacherMenuQuery}
                                    onChange={(event) => setTeacherMenuQuery(event.target.value)}
                                    placeholder={`${CANONICAL_TERMS.teacherMenu}をさがす`}
                                    style={{ ...inputStyle, marginBottom: 8 }}
                                />
                            ) : null}
                            <select
                                value={values.targetMenuId}
                                onChange={(event) => onChange({ targetMenuId: event.target.value })}
                                style={{ ...inputStyle, appearance: 'auto' }}
                            >
                                {(values.menuSource === 'preset' ? PRESET_GROUPS : filteredTeacherMenus).map((menu) => (
                                    <option key={menu.id} value={menu.id}>
                                        {menu.emoji} {menu.name}
                                        {'recommended' in menu && menu.recommended ? ` / おすすめ${menu.recommendedOrder ? ` ${menu.recommendedOrder}` : ''}` : ''}
                                    </option>
                                ))}
                            </select>
                            {values.menuSource === 'teacher' && sortedTeacherMenus.length === 0 && (
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    color: COLOR.muted,
                                    marginTop: 6,
                                }}>
                                    先生メニューがまだありません。先にメニュー設定で作成してください。
                                </div>
                            )}
                            {values.menuSource === 'teacher' && sortedTeacherMenus.length > 0 && filteredTeacherMenus.length === 0 ? (
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    color: COLOR.muted,
                                    marginTop: 6,
                                }}>
                                    この絞り込みに合う{CANONICAL_TERMS.teacherMenu}がありません。
                                </div>
                            ) : null}
                            {selectedTeacherMenu ? (
                                <div style={{
                                    marginTop: 8,
                                    display: 'flex',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}>
                                    {selectedTeacherMenu.recommended ? (
                                        <span style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs,
                                            fontWeight: 700,
                                            color: '#FFF',
                                            background: '#2BBAA0',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                        }}>
                                            {selectedTeacherMenu.recommendedOrder != null ? `おすすめ ${selectedTeacherMenu.recommendedOrder}` : 'おすすめ'}
                                        </span>
                                    ) : null}
                                    {selectedTeacherMenu.visibility !== 'public' ? (
                                        <span style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs,
                                            fontWeight: 700,
                                            color: '#0984E3',
                                            background: 'rgba(9, 132, 227, 0.1)',
                                            padding: '2px 8px',
                                            borderRadius: 999,
                                        }}>
                                            {getTeacherVisibilityLabel(selectedTeacherMenu.visibility)}
                                        </span>
                                    ) : null}
                                    {selectedTeacherMenu.focusTags.map((tag) => (
                                        <span
                                            key={tag}
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.xs,
                                                fontWeight: 700,
                                                color: '#2BBAA0',
                                                background: 'rgba(43,186,160,0.08)',
                                                padding: '2px 8px',
                                                borderRadius: 999,
                                            }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : null}
                        </>
                    )}
                </div>
                <div style={{ width: 80 }}>
                    <div style={labelStyle}>目標回数</div>
                    <input
                        type="number"
                        value={values.targetCount}
                        onChange={(event) => onChange({ targetCount: Number(event.target.value) })}
                        min={1}
                        style={inputStyle}
                    />
                </div>
                <div style={{ width: 92 }}>
                    <div style={labelStyle}>1日上限</div>
                    <input
                        type="number"
                        value={values.dailyCap}
                        onChange={(event) => onChange({ dailyCap: Number(event.target.value) })}
                        min={1}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>チャレンジの大きさ</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        {([
                            { id: 'small', label: 'ちょい', description: '星をためる軽いチャレンジ' },
                            { id: 'big', label: '大きい', description: 'メダル向けの本格チャレンジ' },
                        ] as const).map((option) => {
                            const selected = values.tier === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange({
                                        tier: option.id,
                                        rewardKind: option.id === 'small' ? 'star' : 'medal',
                                        rewardValue: option.id === 'small' ? Math.max(values.rewardValue, 1) : values.rewardValue,
                                    })}
                                    style={{
                                        flex: 1,
                                        padding: '10px 12px',
                                        borderRadius: RADIUS.lg,
                                        border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                        background: selected ? '#E8F8F0' : COLOR.bgLight,
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ ...labelStyle, marginBottom: 2 }}>{option.label}</div>
                                    <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.xs, color: COLOR.muted }}>
                                        {option.description}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div style={{ width: 112 }}>
                    <div style={labelStyle}>アイコン絵文字</div>
                    <input
                        value={values.iconEmoji}
                        onChange={(event) => onChange({ iconEmoji: event.target.value })}
                        placeholder="🎯"
                        maxLength={2}
                        style={{ ...inputStyle, textAlign: 'center', fontSize: FONT_SIZE.xl }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>開始日</div>
                    <input
                        type="date"
                        value={values.startDate}
                        onChange={(event) => onChange({ startDate: event.target.value })}
                        style={inputStyle}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>終了日</div>
                    <input
                        type="date"
                        value={values.endDate}
                        onChange={(event) => onChange({ endDate: event.target.value })}
                        style={{
                            ...inputStyle,
                            ...(dateError ? { border: '1px solid #E17055' } : {}),
                        }}
                    />
                </div>
            </div>
            {dateError && (
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    color: '#E17055',
                    fontWeight: 600,
                    marginTop: -4,
                }}>
                    {dateError}
                </div>
            )}

            <div>
                <div style={labelStyle}>対象クラス（未選択＝全クラス）</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CLASS_LEVELS.map((classLevel) => {
                        const selected = values.classLevels.includes(classLevel.id);
                        return (
                            <button
                                key={classLevel.id}
                                onClick={() => onToggleClassLevel(classLevel.id)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 20,
                                    border: selected ? '2px solid #2BBAA0' : '1px solid #E0E0E0',
                                    background: selected ? '#E8F8F0' : '#FFF',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: selected ? '#2BBAA0' : '#8395A7',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {classLevel.emoji} {classLevel.id}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{values.rewardKind === 'star' ? 'ほし（報酬）' : 'バッジメダル（報酬）'}</span>
                    <button
                        onClick={onRandomReward}
                        style={{
                            fontSize: 11,
                            color: '#2BBAA0',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontWeight: 700,
                            padding: '2px 6px',
                        }}
                    >
                        🔀 おまかせ
                    </button>
                </div>
                {values.rewardKind === 'star' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                            type="number"
                            min={1}
                            value={values.rewardValue}
                            onChange={(event) => onChange({ rewardValue: Number(event.target.value) })}
                            style={{ ...inputStyle, width: 120 }}
                        />
                        <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.sm, color: COLOR.text }}>
                            クリアで ほし {values.rewardValue}こ
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {Array.from({ length: 12 }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => onChange({ rewardValue: index })}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 12,
                                    border: values.rewardValue === index ? '2px solid #FFB800' : '1px solid #E0E0E0',
                                    background: values.rewardValue === index ? '#FFF9E6' : '#FFF',
                                    padding: 2,
                                    cursor: 'pointer',
                                    boxShadow: values.rewardValue === index ? '0 0 0 2px rgba(255,184,0,0.2)' : 'none',
                                }}
                            >
                                <img
                                    src={`/medal/${index}.webp`}
                                    alt={`medal ${index}`}
                                    loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
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
