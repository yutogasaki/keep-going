import React from 'react';
import { Search } from 'lucide-react';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import {
    FILTER_OPTIONS,
    cycleMenuExerciseSelection,
    type FilterId,
    type MenuExerciseItem,
} from './menuExerciseItems';

interface CustomMenuExerciseCardProps {
    changedCount: number;
    excludedCount: number;
    excludedExercises: string[];
    filter: FilterId;
    query: string;
    requiredCount: number;
    requiredExercises: string[];
    visibleItems: MenuExerciseItem[];
    onFilterChange: (filter: FilterId) => void;
    onQueryChange: (query: string) => void;
    onSetExcludedExercises: (ids: string[]) => void;
    onSetRequiredExercises: (ids: string[]) => void;
}

interface CustomMenuExerciseRowProps {
    excludedExercises: string[];
    item: MenuExerciseItem;
    requiredExercises: string[];
    onSetExcludedExercises: (ids: string[]) => void;
    onSetRequiredExercises: (ids: string[]) => void;
}

function CustomMenuExerciseRow({
    excludedExercises,
    item,
    requiredExercises,
    onSetExcludedExercises,
    onSetRequiredExercises,
}: CustomMenuExerciseRowProps) {
    const { exercise } = item;

    const handleCycle = () => {
        const next = cycleMenuExerciseSelection({
            excludedExercises,
            item,
            requiredExercises,
        });

        if (next.excludedExercises !== excludedExercises) {
            onSetExcludedExercises(next.excludedExercises);
        }

        if (next.requiredExercises !== requiredExercises) {
            onSetRequiredExercises(next.requiredExercises);
        }
    };

    return (
        <div
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
                        {exercise.sec}s • {item.placementLabel}
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
                        ) : item.helperText ? (
                            <span
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: 11,
                                    color: COLOR.muted,
                                }}
                            >
                                {item.helperText}
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>

            <button
                type="button"
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
}

export const CustomMenuExerciseCard: React.FC<CustomMenuExerciseCardProps> = ({
    changedCount,
    excludedCount,
    excludedExercises,
    filter,
    query,
    requiredCount,
    requiredExercises,
    visibleItems,
    onFilterChange,
    onQueryChange,
    onSetExcludedExercises,
    onSetRequiredExercises,
}) => (
    <div className="card" style={{ overflow: 'hidden' }}>
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
                    onChange={(event) => onQueryChange(event.target.value)}
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
                            onClick={() => onFilterChange(option.id)}
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
                {visibleItems.map((item) => (
                    <CustomMenuExerciseRow
                        key={item.exercise.id}
                        excludedExercises={excludedExercises}
                        item={item}
                        requiredExercises={requiredExercises}
                        onSetExcludedExercises={onSetExcludedExercises}
                        onSetRequiredExercises={onSetRequiredExercises}
                    />
                ))}
            </div>
        )}
    </div>
);
