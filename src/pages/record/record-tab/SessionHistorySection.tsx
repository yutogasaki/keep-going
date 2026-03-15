import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { RecordHistoryAccordionSection } from '../recordOverviewSummary';
import { formatDate, toDisplayMinutes } from '../recordUtils';

interface SessionHistorySectionProps {
    loading: boolean;
    sections: RecordHistoryAccordionSection[];
}

function formatDuration(totalSeconds: number): string {
    const minutes = toDisplayMinutes(totalSeconds);
    return `${minutes}分`;
}

function getSessionBadgeLabel(
    item: RecordHistoryAccordionSection['days'][number]['items'][number],
): string | null {
    if (item.sessionLabel === 'みんなで') {
        return 'みんなで！';
    }

    if (item.userNames.length > 1) {
        return item.userNames.join('・');
    }

    return null;
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({
    loading,
    sections,
}) => {
    const defaultExpandedId = useMemo(
        () => sections.find((section) => section.defaultExpanded)?.id ?? null,
        [sections],
    );
    const [expandedSectionId, setExpandedSectionId] = useState<RecordHistoryAccordionSection['id'] | null>(defaultExpandedId);

    useEffect(() => {
        setExpandedSectionId((current) => current ?? defaultExpandedId);
    }, [defaultExpandedId]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 40,
                    color: COLOR.light,
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                }}
            >
                よみこみ中...
            </div>
        );
    }

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 800,
                    color: COLOR.dark,
                }}
            >
                きろく
            </div>

            {sections.map((section, sectionIndex) => {
                const expanded = expandedSectionId === section.id;

                return (
                    <motion.div
                        key={section.id}
                        className="card"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + sectionIndex * 0.05, duration: 0.35 }}
                        style={{
                            padding: 0,
                            overflow: 'hidden',
                            background: expanded
                                ? 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(244,249,255,0.92))'
                                : 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.92))',
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setExpandedSectionId(expanded ? null : section.id)}
                            style={{
                                width: '100%',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '16px 18px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: SPACE.md,
                                textAlign: 'left',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.lg,
                                    fontWeight: 800,
                                    color: COLOR.dark,
                                }}
                            >
                                {section.label}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                                <span
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '6px 10px',
                                        borderRadius: RADIUS.full,
                                        background: expanded
                                            ? 'rgba(43, 186, 160, 0.12)'
                                            : 'rgba(255,255,255,0.75)',
                                        color: expanded ? COLOR.primaryDark : COLOR.muted,
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        fontWeight: 800,
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {section.summaryLine}
                                </span>
                                <ChevronRight
                                    size={18}
                                    color={COLOR.light}
                                    style={{
                                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s ease',
                                        flexShrink: 0,
                                    }}
                                />
                            </div>
                        </button>

                        <AnimatePresence initial={false}>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: 'easeOut' }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <div
                                        style={{
                                            padding: '0 18px 16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 12,
                                        }}
                                    >
                                        {section.days.length === 0 ? (
                                            <div
                                                style={{
                                                    padding: '12px 14px',
                                                    borderRadius: RADIUS.lg,
                                                    background: 'rgba(255,255,255,0.62)',
                                                    fontFamily: FONT.body,
                                                    fontSize: FONT_SIZE.sm,
                                                    color: COLOR.muted,
                                                }}
                                            >
                                                {section.emptyLine}
                                            </div>
                                        ) : section.days.map((day) => (
                                            <div
                                                key={day.date}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 10,
                                                    padding: '12px',
                                                    borderRadius: RADIUS['2xl'],
                                                    background: 'rgba(255,255,255,0.62)',
                                                    border: '1px solid rgba(255,255,255,0.72)',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: 10,
                                                        flexWrap: 'wrap',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontFamily: FONT.heading,
                                                                fontSize: FONT_SIZE.md,
                                                                fontWeight: 700,
                                                                color: COLOR.dark,
                                                            }}
                                                        >
                                                            {section.id === 'today' ? '今日' : formatDate(day.date)}
                                                        </span>
                                                    </div>
                                                    <span
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: '5px 9px',
                                                            borderRadius: RADIUS.full,
                                                            background: 'rgba(255,255,255,0.74)',
                                                            fontFamily: FONT.body,
                                                            fontSize: FONT_SIZE.xs + 1,
                                                            fontWeight: 800,
                                                            color: COLOR.muted,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {day.sessionCount}回 / {formatDuration(day.totalSeconds)}
                                                    </span>
                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 8,
                                                    }}
                                                >
                                                    {day.items.map((item) => (
                                                        <motion.div
                                                            key={item.id}
                                                            layout
                                                            style={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 10,
                                                                padding: '12px 14px',
                                                                borderRadius: RADIUS.xl,
                                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(250,252,255,0.92))',
                                                                border: '1px solid rgba(233, 239, 244, 0.9)',
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    gap: 10,
                                                                    flexWrap: 'wrap',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 8,
                                                                        flexWrap: 'wrap',
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            fontFamily: FONT.heading,
                                                                            fontSize: FONT_SIZE.sm + 1,
                                                                            fontWeight: 700,
                                                                            color: COLOR.dark,
                                                                        }}
                                                                    >
                                                                        {new Date(item.startedAt).toLocaleTimeString('ja-JP', {
                                                                            hour: '2-digit',
                                                                            minute: '2-digit',
                                                                        })}
                                                                    </span>
                                                                    {getSessionBadgeLabel(item) && (
                                                                        <span
                                                                            style={{
                                                                                display: 'inline-flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                padding: '4px 8px',
                                                                                borderRadius: RADIUS.full,
                                                                                background: item.sessionLabel === 'みんなで'
                                                                                    ? 'rgba(9,132,227,0.12)'
                                                                                    : 'rgba(43,186,160,0.1)',
                                                                                color: item.sessionLabel === 'みんなで' ? COLOR.info : COLOR.primaryDark,
                                                                                fontFamily: FONT.body,
                                                                                fontSize: FONT_SIZE.xs + 1,
                                                                                fontWeight: 800,
                                                                            }}
                                                                        >
                                                                            {getSessionBadgeLabel(item)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 6,
                                                                        flexWrap: 'wrap',
                                                                    }}
                                                                >
                                                                    <span
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            padding: '4px 8px',
                                                                            borderRadius: RADIUS.full,
                                                                            background: 'rgba(255,245,240,0.95)',
                                                                            color: COLOR.dark,
                                                                            fontFamily: FONT.body,
                                                                            fontSize: FONT_SIZE.xs + 1,
                                                                            fontWeight: 800,
                                                                        }}
                                                                    >
                                                                        {formatDuration(item.totalSeconds)}
                                                                    </span>
                                                                    <span
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            padding: '4px 8px',
                                                                            borderRadius: RADIUS.full,
                                                                            background: 'rgba(232,248,240,0.95)',
                                                                            color: COLOR.primaryDark,
                                                                            fontFamily: FONT.body,
                                                                            fontSize: FONT_SIZE.xs + 1,
                                                                            fontWeight: 800,
                                                                        }}
                                                                    >
                                                                        {item.completedTotal}種目
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    flexWrap: 'wrap',
                                                                }}
                                                            >
                                                                {(item.completedExercises.length > 0
                                                                    ? item.completedExercises.slice(0, 2)
                                                                    : [{ id: 'fallback', name: 'ストレッチ', emoji: '🪄', count: 0 }]
                                                                ).map((exercise) => (
                                                                    <span
                                                                        key={exercise.id}
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: 6,
                                                                            padding: '5px 9px',
                                                                            borderRadius: RADIUS.full,
                                                                            background: 'rgba(245,248,251,0.95)',
                                                                            fontSize: FONT_SIZE.xs + 1,
                                                                            fontWeight: 700,
                                                                            color: COLOR.text,
                                                                        }}
                                                                    >
                                                                        <span style={{ fontSize: 14 }}>{exercise.emoji}</span>
                                                                        {exercise.name}
                                                                        {exercise.sourceLabel ? (
                                                                            <span
                                                                                style={{
                                                                                    display: 'inline-flex',
                                                                                    alignItems: 'center',
                                                                                    justifyContent: 'center',
                                                                                    padding: '2px 6px',
                                                                                    borderRadius: RADIUS.full,
                                                                                    background: 'rgba(255, 183, 77, 0.18)',
                                                                                    color: '#A96600',
                                                                                    fontFamily: FONT.body,
                                                                                    fontSize: 10,
                                                                                    fontWeight: 800,
                                                                                }}
                                                                            >
                                                                                {exercise.sourceLabel}
                                                                            </span>
                                                                        ) : null}
                                                                    </span>
                                                                ))}
                                                                {item.completedExercises.length > 2 && (
                                                                    <span
                                                                        style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            padding: '5px 9px',
                                                                            borderRadius: RADIUS.full,
                                                                            background: 'rgba(255,255,255,0.94)',
                                                                            border: '1px solid rgba(233, 239, 244, 0.95)',
                                                                            fontFamily: FONT.body,
                                                                            fontSize: FONT_SIZE.xs + 1,
                                                                            fontWeight: 700,
                                                                            color: COLOR.muted,
                                                                        }}
                                                                    >
                                                                        +{item.completedExercises.length - 2}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </section>
    );
};
