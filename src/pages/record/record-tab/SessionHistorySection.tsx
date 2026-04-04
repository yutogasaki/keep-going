import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';
import type { RecordHistoryMonthSection } from '../recordOverviewSummary';
import { formatDate, toDisplayMinutes } from '../recordUtils';

interface SessionHistorySectionProps {
    loading: boolean;
    months: RecordHistoryMonthSection[];
}

function formatDuration(totalSeconds: number): string {
    return `${toDisplayMinutes(totalSeconds)}分`;
}

function getSessionBadgeLabel(item: RecordHistoryMonthSection['days'][number]['items'][number]): string | null {
    if (item.sessionLabel === 'みんなで') return 'みんなで！';
    if (item.userNames.length > 1) return item.userNames.join('・');
    return null;
}

const sectionTitleStyle: React.CSSProperties = { fontFamily: FONT.body, fontSize: FONT_SIZE.md, fontWeight: 800, color: COLOR.dark };
const helperStyle: React.CSSProperties = { fontFamily: FONT.body, fontSize: FONT_SIZE.sm, color: COLOR.muted };

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({ loading, months }) => {
    const defaultSelectedMonthId = useMemo(
        () => months.find((month) => month.defaultExpanded)?.id ?? months[0]?.id ?? null,
        [months],
    );
    const [selectedMonthId, setSelectedMonthId] = useState<string | null>(defaultSelectedMonthId);

    useEffect(() => {
        setSelectedMonthId((current) => (
            current && months.some((month) => month.id === current) ? current : defaultSelectedMonthId
        ));
    }, [defaultSelectedMonthId, months]);

    const selectedMonth = useMemo(
        () => months.find((month) => month.id === selectedMonthId) ?? months[0] ?? null,
        [months, selectedMonthId],
    );

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: COLOR.light, fontFamily: FONT.body, fontSize: FONT_SIZE.md }}>よみこみ中...</div>;
    }

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={sectionTitleStyle}>月のきろく</div>
                <div style={helperStyle}>今月も先月も、月ごとにふりかえれるよ</div>
            </div>

            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                {months.map((month) => {
                    const active = month.id === selectedMonth?.id;
                    return (
                        <button
                            key={month.id}
                            type="button"
                            onClick={() => setSelectedMonthId(month.id)}
                            style={{
                                border: `1px solid ${active ? 'rgba(43,186,160,0.24)' : 'rgba(223,230,233,0.85)'}`,
                                cursor: 'pointer',
                                flexShrink: 0,
                                minWidth: 104,
                                padding: '12px 14px',
                                borderRadius: RADIUS.xl,
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                background: active ? 'linear-gradient(135deg, rgba(43,186,160,0.18), rgba(9,132,227,0.12))' : 'rgba(255,255,255,0.74)',
                                boxShadow: active ? '0 10px 24px rgba(43,186,160,0.14)' : '0 4px 12px rgba(45,52,54,0.05)',
                            }}
                        >
                            <span style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.sm, fontWeight: 800, color: active ? COLOR.primaryDark : COLOR.dark }}>{month.label}</span>
                            <span style={{ fontFamily: FONT.heading, fontSize: FONT_SIZE.lg, fontWeight: 700, color: COLOR.dark }}>{month.monthLabel}</span>
                            <span style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 700, color: active ? COLOR.primaryDark : COLOR.muted, whiteSpace: 'nowrap' }}>{month.summaryLine}</span>
                        </button>
                    );
                })}
            </div>

            {selectedMonth ? (
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={selectedMonth.id}
                        className="card"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        style={{ padding: 0, overflow: 'hidden', background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(244,249,255,0.94))' }}
                    >
                        <div style={{ padding: '18px 18px 16px', display: 'flex', flexDirection: 'column', gap: 14, background: 'linear-gradient(135deg, rgba(232,248,240,0.9), rgba(240,247,255,0.96))', borderBottom: '1px solid rgba(223,230,233,0.7)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', width: 'fit-content', padding: '4px 8px', borderRadius: RADIUS.full, background: 'rgba(255,255,255,0.7)', color: COLOR.primaryDark, fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 800 }}>{selectedMonth.label}</span>
                                    <span style={{ fontFamily: FONT.heading, fontSize: FONT_SIZE['3xl'], fontWeight: 700, color: COLOR.dark, lineHeight: 1.1 }}>{selectedMonth.monthLabel}</span>
                                </div>
                                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '8px 12px', borderRadius: RADIUS.full, background: 'rgba(255,255,255,0.72)', color: COLOR.muted, fontFamily: FONT.body, fontSize: FONT_SIZE.sm, fontWeight: 800, whiteSpace: 'nowrap' }}>{selectedMonth.summaryLine}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                                {[
                                    { label: '記録した日', value: `${selectedMonth.dayCount}日` },
                                    { label: 'セッション', value: `${selectedMonth.sessionCount}回` },
                                    { label: '合計じかん', value: `${selectedMonth.totalMinutes}分` },
                                ].map((stat) => (
                                    <div key={stat.label} style={{ padding: '12px 10px', borderRadius: RADIUS.xl, background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(223,230,233,0.72)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <span style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 700, color: COLOR.muted }}>{stat.label}</span>
                                        <span style={{ fontFamily: FONT.heading, fontSize: FONT_SIZE.xl, fontWeight: 700, color: COLOR.dark }}>{stat.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '16px 18px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {selectedMonth.days.length === 0 ? (
                                <div style={{ padding: '14px 16px', borderRadius: RADIUS.xl, background: 'rgba(255,255,255,0.78)', border: '1px dashed rgba(178,190,195,0.8)', fontFamily: FONT.body, fontSize: FONT_SIZE.sm, color: COLOR.muted }}>{selectedMonth.emptyLine}</div>
                            ) : selectedMonth.days.map((day) => (
                                <div key={day.date} style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px', borderRadius: RADIUS['2xl'], background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(233,239,244,0.9)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                        <span style={{ fontFamily: FONT.heading, fontSize: FONT_SIZE.lg, fontWeight: 700, color: COLOR.dark }}>{formatDate(day.date)}</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 9px', borderRadius: RADIUS.full, background: 'rgba(255,255,255,0.82)', fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 800, color: COLOR.muted, whiteSpace: 'nowrap' }}>{day.sessionCount}回 / {formatDuration(day.totalSeconds)}</span>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {day.items.map((item) => (
                                            <motion.div key={item.id} layout style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px', borderRadius: RADIUS.xl, background: 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,252,255,0.94))', border: '1px solid rgba(233,239,244,0.95)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                        <span style={{ fontFamily: FONT.heading, fontSize: FONT_SIZE.sm + 1, fontWeight: 700, color: COLOR.dark }}>{new Date(item.startedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        {getSessionBadgeLabel(item) ? (
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: RADIUS.full, background: item.sessionLabel === 'みんなで' ? 'rgba(9,132,227,0.12)' : 'rgba(43,186,160,0.1)', color: item.sessionLabel === 'みんなで' ? COLOR.info : COLOR.primaryDark, fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 800 }}>{getSessionBadgeLabel(item)}</span>
                                                        ) : null}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: RADIUS.full, background: 'rgba(255,245,240,0.95)', color: COLOR.dark, fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 800 }}>{formatDuration(item.totalSeconds)}</span>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', borderRadius: RADIUS.full, background: 'rgba(232,248,240,0.95)', color: COLOR.primaryDark, fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 800 }}>{item.completedTotal}種目</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                    {(item.completedExercises.length > 0 ? item.completedExercises.slice(0, 2) : [{ id: 'fallback', name: 'ストレッチ', emoji: '🪄', count: 0 }]).map((exercise) => (
                                                        <span key={exercise.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: RADIUS.full, background: 'rgba(245,248,251,0.95)', fontSize: FONT_SIZE.xs + 1, fontWeight: 700, color: COLOR.text }}>
                                                            <span style={{ fontSize: 14 }}>{exercise.emoji}</span>
                                                            {exercise.name}
                                                            {exercise.sourceLabel ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '2px 6px', borderRadius: RADIUS.full, background: 'rgba(255,183,77,0.18)', color: '#A96600', fontFamily: FONT.body, fontSize: 10, fontWeight: 800 }}>{exercise.sourceLabel}</span> : null}
                                                        </span>
                                                    ))}
                                                    {item.completedExercises.length > 2 ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '5px 9px', borderRadius: RADIUS.full, background: 'rgba(255,255,255,0.94)', border: '1px solid rgba(233,239,244,0.95)', fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, fontWeight: 700, color: COLOR.muted }}>+{item.completedExercises.length - 2}</span> : null}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>
            ) : null}
        </section>
    );
};
