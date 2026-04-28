import type { FC } from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { FuwafuwaSpeechAccent } from './fuwafuwaHomeCardCopy';
import type { FuwafuwaReactionStyle } from './fuwafuwaSpeechReaction';

interface FuwafuwaSpeechBubbleProps {
    lines: readonly string[];
    accent: FuwafuwaSpeechAccent;
    reactionStyle: FuwafuwaReactionStyle;
    actionLabel?: string;
    onAction?: () => void;
    onTap?: () => void;
}

export const FuwafuwaSpeechBubble: FC<FuwafuwaSpeechBubbleProps> = ({
    lines,
    accent,
    reactionStyle,
    actionLabel,
    onAction,
    onTap,
}) => {
    const accentPalette = accent === 'magic'
        ? {
            color: '#B9852A',
            background: 'rgba(253, 203, 110, 0.12)',
            border: 'rgba(253, 203, 110, 0.24)',
        }
        : accent === 'event'
            ? {
                color: COLOR.info,
                background: 'rgba(9, 132, 227, 0.08)',
                border: 'rgba(9, 132, 227, 0.15)',
            }
            : accent === 'ambient'
                ? {
                    color: COLOR.purple,
                    background: 'rgba(139, 92, 246, 0.08)',
                    border: 'rgba(139, 92, 246, 0.16)',
                }
                : {
                    color: COLOR.primary,
                    background: 'rgba(43, 186, 160, 0.08)',
                    border: 'rgba(43, 186, 160, 0.16)',
                };
    const visibleLines = lines.filter((line) => line.trim().length > 0);
    const motionProps = reactionStyle === 'celebrating'
        ? {
            animate: { y: [0, -4, 0], scale: [1, 1.015, 1] },
            transition: { duration: 2.1, repeat: Infinity, ease: 'easeInOut' as const },
        }
        : reactionStyle === 'sharing'
            ? {
                animate: { x: [0, -2, 2, 0], y: [0, -1, 0] },
                transition: { duration: 2.8, repeat: Infinity, ease: 'easeInOut' as const },
            }
            : reactionStyle === 'growing'
                ? {
                    animate: { scale: [1, 1.01, 1], boxShadow: [
                        '0 8px 20px rgba(0,0,0,0.04)',
                        '0 12px 24px rgba(43,186,160,0.12)',
                        '0 8px 20px rgba(0,0,0,0.04)',
                    ] },
                    transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const },
                }
                : reactionStyle === 'guiding'
                    ? {
                        animate: { rotate: [0, -0.6, 0.6, 0], y: [0, -1, 0] },
                        transition: { duration: 3.1, repeat: Infinity, ease: 'easeInOut' as const },
                    }
                    : {
                        animate: { y: [0, -2, 0], scale: [1, 1.006, 1] },
                        transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' as const },
                    };

    return (
        <motion.div
            onClick={onTap}
            initial={{ opacity: 0.96, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.6 }}
            {...motionProps}
            style={{
                position: 'relative',
                maxWidth: 320,
                padding: '12px 16px',
                borderRadius: 20,
                background: accentPalette.background,
                border: `1px solid ${accentPalette.border}`,
                boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
                textAlign: 'center',
                cursor: onTap ? 'pointer' : 'default',
            }}
        >
            <div
                style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    lineHeight: 1.6,
                    color: accentPalette.color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                {visibleLines.map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                ))}
            </div>
            {actionLabel && onAction ? (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onAction();
                    }}
                    style={{
                        marginTop: SPACE.sm,
                        border: 'none',
                        background: 'rgba(255,255,255,0.68)',
                        color: accentPalette.color,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: RADIUS.full,
                        cursor: 'pointer',
                    }}
                >
                    {actionLabel}
                </button>
            ) : null}
            <div
                style={{
                    position: 'absolute',
                    left: '50%',
                    bottom: -7,
                    width: 14,
                    height: 14,
                    background: accentPalette.background,
                    borderRight: `1px solid ${accentPalette.border}`,
                    borderBottom: `1px solid ${accentPalette.border}`,
                    transform: 'translateX(-50%) rotate(45deg)',
                }}
            />
        </motion.div>
    );
};
