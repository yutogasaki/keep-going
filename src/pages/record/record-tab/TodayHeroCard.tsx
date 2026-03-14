import React from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { TodayRecordSummary } from '../recordOverviewSummary';

interface TodayHeroCardProps {
    summary: TodayRecordSummary;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians),
    };
}

function describeArc(centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) {
    const normalizedEndAngle = endAngle < startAngle ? endAngle + 360 : endAngle;
    const start = polarToCartesian(centerX, centerY, radius, normalizedEndAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = normalizedEndAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
}

const ARC_ANGLES: Array<[number, number]> = [
    [220, 300],
    [310, 30],
    [40, 120],
    [130, 210],
];

const ARC_COLORS = [
    'rgba(43, 186, 160, 0.95)',
    'rgba(61, 139, 255, 0.92)',
    'rgba(232, 67, 147, 0.92)',
    'rgba(142, 124, 255, 0.92)',
];

const ARC_PATHS = ARC_ANGLES.map(([start, end]) => describeArc(60, 60, 30, start, end));

function TodayProgressFigure({ progressPercent }: { progressPercent: number }) {
    const activeArcCount = Math.ceil(progressPercent / 25);

    return (
        <div
            style={{
                position: 'relative',
                width: 132,
                height: 132,
                margin: '0 auto',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 14,
                    borderRadius: RADIUS.circle,
                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(232,248,240,0.9) 62%, rgba(212,240,231,0.7))',
                    boxShadow: 'inset 0 2px 10px rgba(255,255,255,0.65)',
                }}
            />
            <svg
                width="132"
                height="132"
                viewBox="0 0 120 120"
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0 }}
            >
                {ARC_PATHS.map((path, index) => (
                    <path
                        key={`bg-${index}`}
                        d={path}
                        fill="none"
                        stroke="rgba(255,255,255,0.7)"
                        strokeWidth="8"
                        strokeLinecap="round"
                    />
                ))}
                {ARC_PATHS.slice(0, activeArcCount).map((path, index) => (
                    <motion.path
                        key={`active-${index}`}
                        d={path}
                        fill="none"
                        stroke={ARC_COLORS[index]}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0.6 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.45, delay: 0.08 * index, ease: 'easeOut' }}
                    />
                ))}
            </svg>
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                }}
            >
                <div
                    style={{
                        fontFamily: FONT.heading,
                        fontSize: 30,
                        fontWeight: 800,
                        lineHeight: 1,
                        color: COLOR.primary,
                    }}
                >
                    {progressPercent}%
                </div>
                <div
                    style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        fontWeight: 700,
                        color: COLOR.muted,
                        letterSpacing: 1.4,
                    }}
                >
                    TODAY
                </div>
            </div>
        </div>
    );
}

function TodaySessionTimeline({ sessionTimes }: { sessionTimes: string[] }) {
    if (sessionTimes.length === 0) {
        return (
            <div
                style={{
                    padding: '12px 14px',
                    borderRadius: RADIUS.lg,
                    background: 'rgba(255,255,255,0.55)',
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                    color: COLOR.muted,
                    textAlign: 'center',
                }}
            >
                きょうの足あとが ここに並びます
            </div>
        );
    }

    if (sessionTimes.length === 1) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <div
                    style={{
                        width: 14,
                        height: 14,
                        borderRadius: RADIUS.circle,
                        background: COLOR.primary,
                        boxShadow: '0 0 0 5px rgba(43, 186, 160, 0.12)',
                    }}
                />
                <div
                    style={{
                        fontFamily: FONT.heading,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 700,
                        color: COLOR.dark,
                    }}
                >
                    {sessionTimes[0]}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                alignItems: 'center',
                gap: 10,
            }}
        >
            <span
                style={{
                    fontFamily: FONT.heading,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    color: COLOR.dark,
                    minWidth: 44,
                }}
            >
                {sessionTimes[0]}
            </span>
            <div
                style={{
                    position: 'relative',
                    height: 18,
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        height: 4,
                        borderRadius: RADIUS.full,
                        background: 'linear-gradient(90deg, rgba(43,186,160,0.18), rgba(43,186,160,0.45), rgba(43,186,160,0.18))',
                    }}
                />
                {sessionTimes.map((time, index) => (
                    <div
                        key={`${time}-${index}`}
                        title={time}
                        style={{
                            position: 'absolute',
                            left: `${(index / (sessionTimes.length - 1)) * 100}%`,
                            transform: 'translateX(-50%)',
                            width: 14,
                            height: 14,
                            borderRadius: RADIUS.circle,
                            background: index === sessionTimes.length - 1 ? COLOR.info : COLOR.primary,
                            boxShadow: '0 0 0 4px rgba(255,255,255,0.9)',
                        }}
                    />
                ))}
            </div>
            <span
                style={{
                    fontFamily: FONT.heading,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    color: COLOR.dark,
                    minWidth: 44,
                    textAlign: 'right',
                }}
            >
                {sessionTimes[sessionTimes.length - 1]}
            </span>
        </div>
    );
}

export const TodayHeroCard: React.FC<TodayHeroCardProps> = ({ summary }) => {
    const minutesLine = summary.sessionCount === 0
        ? 'まだ はじまっていないよ'
        : `${summary.minutes}分できたよ`;
    const remainingLine = summary.sessionCount === 0
        ? 'きょうのまるを ゆっくりためよう'
        : summary.remainingMinutes > 0
            ? `あと${summary.remainingMinutes}分で きょうのまる`
            : 'きょうのまるまで できたね';
    const summaryChips = [
        { label: 'じかん', value: `${summary.minutes}分` },
        { label: 'かいすう', value: `${summary.sessionCount}回` },
        { label: 'しゅもく', value: `${summary.exerciseCount}種目` },
    ];

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
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
                きょう
            </div>
            <div
                className="card"
                style={{
                    position: 'relative',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.9), rgba(232,248,240,0.82) 58%, rgba(255,245,240,0.86))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACE.md,
                    overflow: 'hidden',
                    padding: '20px 18px 18px',
                }}
            >
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        top: -24,
                        right: -32,
                        width: 130,
                        height: 130,
                        borderRadius: RADIUS.circle,
                        background: 'radial-gradient(circle, rgba(43,186,160,0.22), rgba(43,186,160,0))',
                        pointerEvents: 'none',
                    }}
                />
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        bottom: -44,
                        left: -30,
                        width: 150,
                        height: 150,
                        borderRadius: RADIUS.circle,
                        background: 'radial-gradient(circle, rgba(232,67,147,0.1), rgba(232,67,147,0))',
                        pointerEvents: 'none',
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 12px',
                            borderRadius: RADIUS.full,
                            background: 'rgba(255,255,255,0.72)',
                            color: COLOR.primaryDark,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.xs + 1,
                            fontWeight: 800,
                            letterSpacing: 0.8,
                        }}
                    >
                        きょうのきろく
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: 28,
                            fontWeight: 800,
                            color: COLOR.dark,
                            lineHeight: 1.2,
                        }}
                    >
                        きょうはここまで
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 6,
                        textAlign: 'center',
                    }}
                >
                    <TodayProgressFigure progressPercent={summary.progressPercent} />
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: 22,
                            fontWeight: 800,
                            color: COLOR.dark,
                            lineHeight: 1.25,
                        }}
                    >
                        {minutesLine}
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            color: COLOR.text,
                        }}
                    >
                        {summary.rhythmLine}
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            fontWeight: 700,
                            color: COLOR.primaryDark,
                        }}
                    >
                        {remainingLine}
                    </div>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: 10,
                    }}
                >
                    {summaryChips.map((chip) => (
                        <div
                            key={chip.label}
                            style={{
                                padding: '10px 8px',
                                borderRadius: RADIUS.xl,
                                background: 'rgba(255,255,255,0.6)',
                                border: '1px solid rgba(255,255,255,0.7)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2,
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: 800,
                                    color: COLOR.primaryDark,
                                }}
                            >
                                {chip.value}
                            </span>
                            <span
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    fontWeight: 700,
                                    color: COLOR.muted,
                                }}
                            >
                                {chip.label}
                            </span>
                        </div>
                    ))}
                </div>

                <TodaySessionTimeline sessionTimes={summary.sessionTimes} />
            </div>
        </motion.section>
    );
};
