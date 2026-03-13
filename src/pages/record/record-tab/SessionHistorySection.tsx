import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { RecordHistoryAccordionSection } from '../recordOverviewSummary';
import { formatDate } from '../recordUtils';

interface SessionHistorySectionProps {
    loading: boolean;
    sections: RecordHistoryAccordionSection[];
}

function formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    return `${minutes}分`;
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
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.92))',
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                                <span
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        color: COLOR.muted,
                                    }}
                                >
                                    {section.summaryLine}
                                </span>
                            </div>
                            <ChevronRight
                                size={18}
                                color={COLOR.light}
                                style={{
                                    transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s ease',
                                    flexShrink: 0,
                                }}
                            />
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
                                                    gap: 8,
                                                }}
                                            >
                                                {section.id !== 'today' && (
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            gap: 10,
                                                            paddingTop: 4,
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
                                                            {formatDate(day.date)}
                                                        </span>
                                                        <span
                                                            style={{
                                                                fontFamily: FONT.body,
                                                                fontSize: FONT_SIZE.xs + 1,
                                                                color: COLOR.light,
                                                            }}
                                                        >
                                                            {day.sessionCount}回 / {formatDuration(day.totalSeconds)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: 8,
                                                    }}
                                                >
                                                    {day.items.map((item) => (
                                                        <div
                                                            key={item.id}
                                                            style={{
                                                                display: 'grid',
                                                                gridTemplateColumns: '56px 1fr auto',
                                                                gap: 12,
                                                                alignItems: 'center',
                                                                padding: '12px 14px',
                                                                borderRadius: RADIUS.xl,
                                                                background: 'rgba(255,255,255,0.6)',
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
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: 2,
                                                                }}
                                                            >
                                                                <span
                                                                    style={{
                                                                        fontFamily: FONT.body,
                                                                        fontSize: FONT_SIZE.md,
                                                                        fontWeight: 700,
                                                                        color: COLOR.dark,
                                                                    }}
                                                                >
                                                                    {formatDuration(item.totalSeconds)} / {item.completedTotal}種目
                                                                </span>
                                                                {item.sessionLabel === 'みんなで' && (
                                                                    <span
                                                                        style={{
                                                                            fontFamily: FONT.body,
                                                                            fontSize: FONT_SIZE.xs + 1,
                                                                            fontWeight: 700,
                                                                            color: COLOR.info,
                                                                        }}
                                                                    >
                                                                        みんなで！
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    padding: '4px 8px',
                                                                    borderRadius: RADIUS.full,
                                                                    background: 'rgba(43, 186, 160, 0.1)',
                                                                    color: COLOR.primaryDark,
                                                                    fontFamily: FONT.body,
                                                                    fontSize: FONT_SIZE.xs + 1,
                                                                    fontWeight: 800,
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {item.completedExercises[0]?.name ?? 'ストレッチ'}
                                                            </div>
                                                        </div>
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
