import React from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { TwoWeekRecordSummary } from '../recordOverviewSummary';

interface TwoWeekTrendSectionProps {
    summary: TwoWeekRecordSummary;
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
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACE.lg,
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.92))',
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
                            fontSize: 22,
                            fontWeight: 800,
                            color: COLOR.dark,
                            lineHeight: 1.25,
                        }}
                    >
                        {streakLine}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(14, minmax(0, 1fr))',
                            gap: 6,
                            alignItems: 'end',
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            color: COLOR.text,
                        }}
                    >
                        この2週間で {summary.activeDays}日会えた
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            color: COLOR.text,
                        }}
                    >
                        {summary.dominantTimeLine}
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            color: COLOR.text,
                        }}
                    >
                        {summary.dominantPlacementLine}
                    </div>
                </div>
            </div>
        </motion.section>
    );
};
