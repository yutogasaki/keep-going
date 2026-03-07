import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { ExerciseIcon } from '../../components/ExerciseIcon';
import { EXERCISES } from '../../data/exercises';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { CustomExercise } from '../../lib/db';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../../lib/styles';
import type { TeacherExercise } from '../../lib/teacherContent';

interface CustomMenuModalProps {
    show: boolean;
    isTogetherMode: boolean;
    dailyTargetMinutes: number;
    requiredExercises: string[];
    excludedExercises: string[];
    customExercises: CustomExercise[];
    teacherExercises?: TeacherExercise[];
    teacherExcludedExerciseIds?: Set<string>;
    teacherRequiredExerciseIds?: Set<string>;
    teacherHiddenExerciseIds?: Set<string>;
    onClose: () => void;
    onSetDailyTargetMinutes: (mins: number) => void;
    onSetExcludedExercises: (ids: string[]) => void;
    onSetRequiredExercises: (ids: string[]) => void;
}

type FilterId = 'all' | 'changed' | 'teacher' | 'custom';
type MenuExercise = (typeof EXERCISES)[number] | TeacherExercise | CustomExercise;

const FILTER_OPTIONS: Array<{ id: FilterId; label: string }> = [
    { id: 'all', label: 'ぜんぶ' },
    { id: 'changed', label: '変更あり' },
    { id: 'teacher', label: '先生' },
    { id: 'custom', label: 'じぶん種目' },
];

const getDescription = (exercise: MenuExercise) =>
    'description' in exercise && typeof exercise.description === 'string'
        ? exercise.description
        : '';

const isTeacherExercise = (exercise: MenuExercise): exercise is TeacherExercise =>
    'classLevels' in exercise;

const isCustomExercise = (exercise: MenuExercise): exercise is CustomExercise =>
    'creatorId' in exercise;

export const CustomMenuModal: React.FC<CustomMenuModalProps> = ({
    show,
    isTogetherMode,
    dailyTargetMinutes,
    requiredExercises,
    excludedExercises,
    customExercises,
    teacherExercises,
    teacherExcludedExerciseIds,
    teacherRequiredExerciseIds,
    teacherHiddenExerciseIds,
    onClose,
    onSetDailyTargetMinutes,
    onSetExcludedExercises,
    onSetRequiredExercises,
}) => {
    const trapRef = useFocusTrap<HTMLDivElement>(show);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<FilterId>('all');

    if (!show) return null;

    const normalizedQuery = query.trim().toLowerCase();

    const exerciseItems = [...EXERCISES, ...(teacherExercises ?? []), ...customExercises]
        .filter((exercise) => !teacherHiddenExerciseIds?.has(exercise.id))
        .sort((a, b) => {
            const aRest = 'type' in a && a.type === 'rest' ? 1 : 0;
            const bRest = 'type' in b && b.type === 'rest' ? 1 : 0;
            return aRest - bRest;
        })
        .map((exercise) => {
            const isRest = 'type' in exercise && exercise.type === 'rest';
            const isTeacherRequired = teacherRequiredExerciseIds?.has(exercise.id) ?? false;
            const isTeacherExcluded = teacherExcludedExerciseIds?.has(exercise.id) ?? false;
            const isUserRequired = requiredExercises.includes(exercise.id);
            const isUserExcluded = excludedExercises.includes(exercise.id);
            const isRequired = isUserRequired || (isTeacherRequired && !isUserExcluded);
            const isExcluded = !isRequired && (isUserExcluded || (isTeacherExcluded && !isUserRequired));
            const teacherBadge = isTeacherRequired ? '先生: 必須' : isTeacherExcluded ? '先生: 除外' : null;
            const userBadge = isUserRequired ? 'じぶん: 必須' : isUserExcluded ? 'じぶん: 除外' : null;
            const description = getDescription(exercise);
            const source = isTeacherExercise(exercise)
                ? 'teacher'
                : isCustomExercise(exercise)
                    ? 'custom'
                    : 'builtIn';
            const sourceLabel = source === 'teacher' ? '先生' : source === 'custom' ? 'じぶん種目' : null;
            const hasAdjustment = isTeacherRequired || isTeacherExcluded || isUserRequired || isUserExcluded;
            const helperText = userBadge
                ?? teacherBadge
                ?? (isRest ? 'きゅうけい種目' : 'いまは おまかせ');

            const querySource = [
                exercise.name,
                description,
                helperText,
                sourceLabel,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            const matchesQuery = normalizedQuery.length === 0 || querySource.includes(normalizedQuery);
            const matchesFilter = filter === 'all'
                || (filter === 'changed' && hasAdjustment)
                || (filter === 'teacher' && (source === 'teacher' || isTeacherRequired || isTeacherExcluded))
                || (filter === 'custom' && source === 'custom');

            return {
                exercise,
                isRest,
                isTeacherRequired,
                isTeacherExcluded,
                isUserRequired,
                isUserExcluded,
                isRequired,
                isExcluded,
                teacherBadge,
                userBadge,
                helperText,
                sourceLabel,
                source,
                matchesQuery,
                matchesFilter,
            };
        });

    const visibleItems = exerciseItems.filter((item) => item.matchesQuery && item.matchesFilter);
    const configurableItems = exerciseItems.filter((item) => !item.isRest);
    const requiredCount = configurableItems.filter((item) => item.isRequired).length;
    const excludedCount = configurableItems.filter((item) => item.isExcluded).length;
    const changedCount = configurableItems.filter(
        (item) => item.isTeacherRequired || item.isTeacherExcluded || item.isUserRequired || item.isUserExcluded,
    ).length;

    return createPortal(
        <div
            ref={trapRef}
            role="dialog"
            aria-modal="true"
            aria-label="おまかせの設定"
            style={{
                position: 'fixed',
                inset: 0,
                background: COLOR.bgLight,
                zIndex: Z.sheet,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div
                style={{
                    padding: '24px 24px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: COLOR.white,
                    borderBottom: `1px solid ${COLOR.border}`,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                }}
            >
                <div>
                    <h2
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xl,
                            fontWeight: 700,
                            color: COLOR.dark,
                            margin: 0,
                            marginBottom: 4,
                        }}
                    >
                        おまかせの設定
                    </h2>
                    <p
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.muted,
                            margin: 0,
                        }}
                    >
                        毎日のルーティン内容を調整します
                    </p>
                </div>
                <button
                    onClick={onClose}
                    aria-label="閉じる"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: RADIUS.circle,
                        border: 'none',
                        background: COLOR.bgMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                    }}
                >
                    <X size={20} color={COLOR.dark} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', position: 'relative' }}>
                {isTogetherMode && (
                    <div
                        style={{
                            background: '#FFF3E0',
                            border: '1px solid #FFE0B2',
                            borderRadius: RADIUS.md,
                            padding: '12px 16px',
                            marginBottom: 20,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: SPACE.md,
                        }}
                    >
                        <span style={{ fontSize: 20 }}>👩‍👧‍👦</span>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.md - 1,
                                color: '#E65100',
                                lineHeight: 1.6,
                            }}
                        >
                            「みんなで！」モード中は全員のおまかせ設定が合算されます。<br />
                            <strong>個人の設定を変えるときは、ヘッダーのバッジから見たい人を選んでね。</strong>
                        </div>
                    </div>
                )}

                <div
                    className="card"
                    style={{
                        marginBottom: 24,
                        padding: '24px 20px',
                        opacity: isTogetherMode ? 0.6 : 1,
                        pointerEvents: isTogetherMode ? 'none' : 'auto',
                    }}
                >
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.lg - 1,
                            fontWeight: 700,
                            color: COLOR.dark,
                            marginBottom: 16,
                        }}
                    >
                        1日の目標じかん
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[5, 10, 15, 20, 30].map((mins) => (
                            <button
                                key={mins}
                                onClick={() => onSetDailyTargetMinutes(mins)}
                                style={{
                                    flex: 1,
                                    minWidth: '28%',
                                    padding: '14px 0',
                                    borderRadius: RADIUS.lg,
                                    border: dailyTargetMinutes === mins ? `2px solid ${COLOR.primary}` : '2px solid transparent',
                                    background: dailyTargetMinutes === mins ? 'rgba(43, 186, 160, 0.08)' : COLOR.bgLight,
                                    color: dailyTargetMinutes === mins ? COLOR.primary : COLOR.muted,
                                    fontFamily: FONT.heading,
                                    fontSize: FONT_SIZE.lg,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: dailyTargetMinutes !== mins ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                                }}
                            >
                                {mins}分
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    className="card"
                    style={{
                        overflow: 'hidden',
                        opacity: isTogetherMode ? 0.6 : 1,
                        pointerEvents: isTogetherMode ? 'none' : 'auto',
                    }}
                >
                    <div
                        style={{
                            padding: '20px 20px 16px',
                            borderBottom: `1px solid ${COLOR.border}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: SPACE.md,
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.lg - 1,
                                    fontWeight: 700,
                                    color: COLOR.dark,
                                    marginBottom: 4,
                                }}
                            >
                                種目のカスタマイズ
                            </div>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    color: COLOR.muted,
                                    lineHeight: 1.6,
                                }}
                            >
                                ★ 必須 / ⚪ おまかせ / 🔴 除外。青いヒントは先生の指定です。
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: RADIUS.full,
                                    background: 'rgba(43, 186, 160, 0.08)',
                                    color: COLOR.primary,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 700,
                                }}
                            >
                                ★ 必須 {requiredCount}
                            </div>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: RADIUS.full,
                                    background: 'rgba(225, 112, 85, 0.1)',
                                    color: COLOR.danger,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 700,
                                }}
                            >
                                🔴 除外 {excludedCount}
                            </div>
                            <div
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: RADIUS.full,
                                    background: 'rgba(9, 132, 227, 0.08)',
                                    color: COLOR.info,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 700,
                                }}
                            >
                                変更あり {changedCount}
                            </div>
                        </div>

                        <div
                            style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <Search
                                size={16}
                                color={COLOR.muted}
                                style={{
                                    position: 'absolute',
                                    left: 12,
                                    pointerEvents: 'none',
                                }}
                            />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="種目をさがす"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px 12px 38px',
                                    borderRadius: RADIUS.lg,
                                    border: '1px solid rgba(0,0,0,0.08)',
                                    background: COLOR.bgLight,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.md,
                                    color: COLOR.dark,
                                    outline: 'none',
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: SPACE.sm, overflowX: 'auto', paddingBottom: 2 }}>
                            {FILTER_OPTIONS.map((option) => {
                                const isActive = filter === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setFilter(option.id)}
                                        style={{
                                            padding: '8px 14px',
                                            borderRadius: RADIUS.full,
                                            border: 'none',
                                            background: isActive ? COLOR.dark : COLOR.bgMuted,
                                            color: isActive ? COLOR.white : COLOR.text,
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.sm,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {visibleItems.length === 0 ? (
                        <div
                            style={{
                                padding: '32px 20px',
                                textAlign: 'center',
                                fontFamily: FONT.body,
                                color: COLOR.muted,
                                lineHeight: 1.7,
                            }}
                        >
                            <div
                                style={{
                                    fontSize: FONT_SIZE.lg,
                                    fontWeight: 700,
                                    color: COLOR.dark,
                                    marginBottom: 8,
                                }}
                            >
                                条件にあう種目がありません
                            </div>
                            <div style={{ fontSize: FONT_SIZE.sm }}>
                                しぼりこみや検索ワードを変えてみてね
                            </div>
                        </div>
                    ) : (
                        <div>
                            {visibleItems.map((item) => {
                                const { exercise } = item;

                                const handleCycle = () => {
                                    if (item.isRest) {
                                        return;
                                    }

                                    if (item.isUserRequired) {
                                        onSetRequiredExercises(requiredExercises.filter((id) => id !== exercise.id));
                                    } else if (item.isUserExcluded) {
                                        onSetExcludedExercises(excludedExercises.filter((id) => id !== exercise.id));
                                        onSetRequiredExercises([...requiredExercises, exercise.id]);
                                    } else if (item.isTeacherRequired) {
                                        onSetExcludedExercises([...excludedExercises, exercise.id]);
                                    } else if (item.isTeacherExcluded) {
                                        onSetRequiredExercises([...requiredExercises, exercise.id]);
                                    } else {
                                        onSetExcludedExercises([...excludedExercises, exercise.id]);
                                    }
                                };

                                return (
                                    <div
                                        key={exercise.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: SPACE.md,
                                            padding: '16px 20px',
                                            borderBottom: `1px solid ${COLOR.border}`,
                                            background: item.isUserRequired
                                                ? 'rgba(43, 186, 160, 0.04)'
                                                : item.isUserExcluded
                                                    ? 'rgba(225, 112, 85, 0.04)'
                                                    : item.isTeacherRequired || item.isTeacherExcluded
                                                        ? 'rgba(9, 132, 227, 0.035)'
                                                        : 'transparent',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
                                            <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color={COLOR.dark} />
                                            <div style={{ minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        flexWrap: 'wrap',
                                                        marginBottom: 4,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontFamily: FONT.body,
                                                            fontSize: FONT_SIZE.md,
                                                            fontWeight: 600,
                                                            color: item.isRest || item.isExcluded ? COLOR.light : COLOR.dark,
                                                            wordBreak: 'break-word',
                                                        }}
                                                    >
                                                        {exercise.name}
                                                    </div>
                                                    {item.sourceLabel && (
                                                        <span
                                                            style={{
                                                                fontFamily: FONT.body,
                                                                fontSize: 9,
                                                                fontWeight: 700,
                                                                color: item.source === 'teacher' ? COLOR.info : COLOR.primary,
                                                                background: item.source === 'teacher'
                                                                    ? 'rgba(9, 132, 227, 0.1)'
                                                                    : 'rgba(43, 186, 160, 0.1)',
                                                                padding: '2px 5px',
                                                                borderRadius: 6,
                                                            }}
                                                        >
                                                            {item.sourceLabel}
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        fontFamily: FONT.heading,
                                                        fontSize: FONT_SIZE.sm - 1,
                                                        color: COLOR.muted,
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    {exercise.sec}s • {'phase' in exercise ? exercise.phase : 'main'}
                                                </div>

                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {(item.teacherBadge || item.userBadge) ? (
                                                        <>
                                                            {item.teacherBadge && (
                                                                <span
                                                                    style={{
                                                                        padding: '3px 8px',
                                                                        borderRadius: RADIUS.full,
                                                                        background: 'rgba(9, 132, 227, 0.08)',
                                                                        color: COLOR.info,
                                                                        fontFamily: FONT.body,
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {item.teacherBadge}
                                                                </span>
                                                            )}
                                                            {item.userBadge && (
                                                                <span
                                                                    style={{
                                                                        padding: '3px 8px',
                                                                        borderRadius: RADIUS.full,
                                                                        background: item.isUserExcluded
                                                                            ? 'rgba(225, 112, 85, 0.1)'
                                                                            : 'rgba(43, 186, 160, 0.08)',
                                                                        color: item.isUserExcluded ? COLOR.danger : COLOR.primary,
                                                                        fontFamily: FONT.body,
                                                                        fontSize: 11,
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    {item.userBadge}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                fontFamily: FONT.body,
                                                                fontSize: 11,
                                                                color: COLOR.muted,
                                                            }}
                                                        >
                                                            {item.helperText}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCycle}
                                            disabled={item.isRest}
                                            style={{
                                                minWidth: 82,
                                                padding: '10px 12px',
                                                borderRadius: RADIUS.full,
                                                border: 'none',
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.sm,
                                                fontWeight: 700,
                                                cursor: item.isRest ? 'default' : 'pointer',
                                                background: item.isRest
                                                    ? '#FFE4E1'
                                                    : item.isRequired
                                                        ? 'rgba(43, 186, 160, 0.1)'
                                                        : item.isExcluded
                                                            ? 'rgba(225, 112, 85, 0.1)'
                                                            : COLOR.bgLight,
                                                color: item.isRest
                                                    ? COLOR.danger
                                                    : item.isRequired
                                                        ? COLOR.primary
                                                        : item.isExcluded
                                                            ? COLOR.danger
                                                            : COLOR.muted,
                                                opacity: item.isRest ? 0.55 : 1,
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {item.isRest
                                                ? '🔒 除外'
                                                : item.isRequired
                                                    ? '★ 必須'
                                                    : item.isExcluded
                                                        ? '🔴 除外'
                                                        : '⚪ おまかせ'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
};
