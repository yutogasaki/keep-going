import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Download } from 'lucide-react';
import { DISPLAY_TERMS } from '../../../lib/terminology';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

interface PublicMenuSectionProps {
    onOpen: () => void;
}

export const PublicMenuSection: React.FC<PublicMenuSectionProps> = ({ onOpen }) => {
    return (
        <section>
            <h2 style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#8395A7',
                marginBottom: 10,
                letterSpacing: 1,
            }}>
                {DISPLAY_TERMS.publicMenu}
            </h2>
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onOpen}
                style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACE.sm,
                    padding: `${SPACE.lg}px`,
                    border: 'none',
                    background: COLOR.white,
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                    borderRadius: RADIUS.lg,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md, width: '100%' }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: RADIUS.lg,
                        background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <span style={{ fontSize: 24, lineHeight: 1 }}>🌍</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            fontWeight: 700,
                            color: COLOR.dark,
                            lineHeight: 1.4,
                        }}>
                            {DISPLAY_TERMS.publicMenu}を見る
                        </div>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.muted,
                            marginTop: 2,
                            lineHeight: 1.5,
                        }}>
                            他の人が作ったメニューをさがして、もらって、ためせる
                        </div>
                    </div>
                </div>

                <div style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                    color: COLOR.text,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                }}>
                    人気のメニューや新しく公開されたメニューをまとめて見られます。
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
                    <span style={chipStyle}>
                        <Clock size={11} />
                        すぐ探せる
                    </span>
                    <span style={chipStyle}>
                        <Download size={11} />
                        もらって使える
                    </span>
                </div>

                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    paddingTop: 2,
                }}>
                    <span style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        fontWeight: 700,
                        color: COLOR.muted,
                    }}>
                        くわしく見る
                    </span>
                    <span style={{
                        fontFamily: FONT.heading,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                        color: COLOR.primary,
                    }}>
                        OPEN
                    </span>
                </div>
            </motion.button>
        </section>
    );
};

const chipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(0,0,0,0.04)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.light,
};
