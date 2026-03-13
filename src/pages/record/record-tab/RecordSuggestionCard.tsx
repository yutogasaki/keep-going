import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import type { RecordSuggestionSummary } from '../recordOverviewSummary';

interface RecordSuggestionCardProps {
    suggestion: RecordSuggestionSummary;
    onClick: () => void;
}

export const RecordSuggestionCard: React.FC<RecordSuggestionCardProps> = ({ suggestion, onClick }) => {
    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: 'easeOut' }}
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
                今日はこれどう？
            </div>
            <div
                className="card"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: SPACE.md,
                    background: 'linear-gradient(135deg, rgba(255,245,240,0.98), rgba(255,255,255,0.92) 52%, rgba(232,248,240,0.9))',
                }}
            >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1 }}>
                    <div
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: RADIUS['2xl'],
                            background: 'rgba(232, 67, 147, 0.12)',
                            color: COLOR.pink,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <Sparkles size={18} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.lg,
                                fontWeight: 800,
                                color: COLOR.dark,
                                lineHeight: 1.35,
                            }}
                        >
                            {suggestion.title}
                        </div>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.md,
                                color: COLOR.text,
                                lineHeight: 1.6,
                            }}
                        >
                            {suggestion.body}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClick}
                    style={{
                        border: 'none',
                        borderRadius: RADIUS.full,
                        padding: '10px 14px',
                        background: 'linear-gradient(135deg, rgba(43,186,160,0.96), rgba(36,160,138,0.96))',
                        color: COLOR.white,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-accent-sm)',
                        flexShrink: 0,
                    }}
                >
                    {suggestion.ctaLabel}
                </button>
            </div>
        </motion.section>
    );
};
