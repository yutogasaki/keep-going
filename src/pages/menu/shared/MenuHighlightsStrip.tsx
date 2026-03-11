import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

export interface MenuHighlightItem {
    id: string;
    emoji: string;
    title: string;
    meta: string;
    caption: string;
    badges: string[];
    onSelect: () => void;
}

interface MenuHighlightsStripProps {
    title: string;
    description: string;
    items: MenuHighlightItem[];
}

export const MenuHighlightsStrip: React.FC<MenuHighlightsStripProps> = ({
    title,
    description,
    items,
}) => {
    if (items.length === 0) {
        return null;
    }

    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        alignSelf: 'flex-start',
                        padding: '6px 10px',
                        borderRadius: RADIUS.full,
                        background: 'rgba(255, 214, 102, 0.18)',
                        color: '#A86F00',
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        fontWeight: 700,
                    }}
                >
                    <Sparkles size={12} />
                    まずはここから
                </div>
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.muted,
                            letterSpacing: 1,
                        }}
                    >
                        {title}
                    </h2>
                    <p
                        style={{
                            margin: '6px 0 0',
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.light,
                            lineHeight: 1.5,
                        }}
                    >
                        {description}
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                    gap: SPACE.md,
                }}
            >
                {items.map((item) => (
                    <motion.button
                        key={item.id}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={item.onSelect}
                        className="card"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: SPACE.sm,
                            padding: `${SPACE.lg}px`,
                            border: 'none',
                            borderRadius: RADIUS.xl,
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(249,251,252,0.96) 100%)',
                            boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            minWidth: 0,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md }}>
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: RADIUS.lg,
                                    background: 'linear-gradient(135deg, rgba(43, 186, 160, 0.16), rgba(78, 205, 196, 0.22))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 22,
                                    flexShrink: 0,
                                }}
                            >
                                {item.emoji}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.md,
                                        fontWeight: 700,
                                        color: COLOR.dark,
                                        lineHeight: 1.4,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical' as const,
                                        overflow: 'hidden',
                                    }}
                                >
                                    {item.title}
                                </div>
                                <div
                                    style={{
                                        marginTop: 4,
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        color: COLOR.muted,
                                    }}
                                >
                                    {item.meta}
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: COLOR.text,
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                                minHeight: 36,
                            }}
                        >
                            {item.caption}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.xs }}>
                            {item.badges.map((badge) => (
                                <span
                                    key={badge}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        borderRadius: RADIUS.full,
                                        background: badge === 'New'
                                            ? 'rgba(255, 107, 107, 0.12)'
                                            : 'rgba(43, 186, 160, 0.12)',
                                        color: badge === 'New' ? '#FF6B6B' : COLOR.primaryDark,
                                        fontFamily: badge === 'New' ? FONT.heading : FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        fontWeight: 700,
                                    }}
                                >
                                    {badge}
                                </span>
                            ))}
                        </div>
                    </motion.button>
                ))}
            </div>
        </section>
    );
};
