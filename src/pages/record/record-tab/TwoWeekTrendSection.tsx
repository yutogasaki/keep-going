import React from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { TwoWeekRecordSummary } from '../recordOverviewSummary';

interface TwoWeekTrendSectionProps {
    summary: TwoWeekRecordSummary;
}

function getActiveDaysBadge(summary: TwoWeekRecordSummary): string {
    if (summary.activeDays === 0) {
        return 'これから';
    }
    return `${summary.activeDays}日 / ${summary.totalMinutes}分`;
}

function getTimeInsight(summary: TwoWeekRecordSummary): string {
    if (summary.activeDays === 0) {
        return '会いやすい時間は まだこれから';
    }
    return summary.dominantTimeLine.replace('会いやすいのは ', '').replace('みたい', 'に会いやすい');
}

function getDotColor(level: 0 | 1 | 2 | 3): string {
    switch (level) {
    case 1:
        return 'rgba(43, 186, 160, 0.35)';
    case 2:
        return 'rgba(43, 186, 160, 0.7)';
    case 3:
        return COLOR.primary;
    case 0:
    default:
        return 'rgba(131, 149, 167, 0.16)';
    }
}

function getDotSize(level: 0 | 1 | 2 | 3): number {
    switch (level) {
    case 1:
        return 10;
    case 2:
        return 14;
    case 3:
        return 18;
    case 0:
    default:
        return 8;
    }
}

export const TwoWeekTrendSection: React.FC<TwoWeekTrendSectionProps> = ({ summary }) => {
    const streakLine = summary.streak > 0
        ? `${summary.streak}日つづいたよ`
        : 'これから いいながれ';
    const insightChips = [
        getTimeInsight(summary),
        summary.dominantPlacementLine,
    ];

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
        >
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 800,
                    color: COLOR.dark,
                    marginBottom: 10,
                }}
            >
                この2週間のながれ
            </div>
            <div
                className="card"
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACE.md,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(244,250,255,0.92) 52%, rgba(255,246,241,0.92))',
                    overflow: 'hidden',
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: -26,
                        left: -24,
                        width: 120,
                        height: 120,
                        borderRadius: RADIUS.circle,
                        background: 'radial-gradient(circle, rgba(9,132,227,0.16), rgba(9,132,227,0))',
                    }}
                />
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        right: -22,
                        bottom: -36,
                        width: 140,
                        height: 140,
                        borderRadius: RADIUS.circle,
                        background: 'radial-gradient(circle, rgba(43,186,160,0.18), rgba(43,186,160,0))',
                    }}
                />

                <div
                    style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm + 1,
                                fontWeight: 800,
                                color: COLOR.primaryDark,
                                letterSpacing: 0.8,
                            }}
                        >
                            いいながれ
                        </div>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 24,
                                fontWeight: 800,
                                color: COLOR.dark,
                                lineHeight: 1.2,
                            }}
                        >
                            {streakLine}
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '8px 12px',
                            borderRadius: RADIUS.full,
                            background: 'rgba(255,255,255,0.72)',
                            color: COLOR.info,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 800,
                        }}
                    >
                        {getActiveDaysBadge(summary)}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
                            gap: 6,
                            alignItems: 'end',
                            padding: '14px 12px 10px',
                            borderRadius: RADIUS['2xl'],
                            background: 'rgba(255,255,255,0.58)',
                        }}
                    >
                        {summary.dots.map((dot, index) => {
                            const size = getDotSize(dot.level);
                            return (
                                <motion.div
                                    key={dot.date}
                                    initial={{ opacity: 0, y: 8, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ delay: 0.02 * index, duration: 0.3 }}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 6,
                                    }}
                                >
                                    <div
                                        title={`${dot.date}: ${dot.minutes}分`}
                                        style={{
                                            width: size,
                                            height: size,
                                            borderRadius: RADIUS.circle,
                                            background: getDotColor(dot.level),
                                            border: dot.isToday ? `2px solid ${COLOR.info}` : 'none',
                                            boxShadow: dot.isToday ? '0 0 0 4px rgba(9, 132, 227, 0.12)' : 'none',
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: 10,
                                            color: dot.isToday ? COLOR.info : COLOR.light,
                                            fontWeight: dot.isToday ? 800 : 600,
                                        }}
                                    >
                                        {dot.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    {insightChips.map((chip) => (
                        <div
                            key={chip}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '9px 12px',
                                borderRadius: RADIUS.full,
                                background: 'rgba(255,255,255,0.62)',
                                border: '1px solid rgba(255,255,255,0.72)',
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 700,
                                color: COLOR.text,
                            }}
                        >
                            {chip}
                        </div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};
