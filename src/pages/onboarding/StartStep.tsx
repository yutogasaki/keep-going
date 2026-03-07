import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';

interface StartStepProps {
    onNext: () => void;
    onBack: () => void;
}

export const StartStep: React.FC<StartStepProps> = ({ onNext, onBack }) => {
    return (
        <motion.div
            key="start"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: SPACE['2xl'],
                padding: `0 ${SPACE['3xl']}px`,
                maxWidth: 360,
                textAlign: 'center',
                width: '100%',
            }}
        >
            <button
                onClick={onBack}
                style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACE.xs,
                    padding: 0,
                    background: 'none',
                    border: 'none',
                    color: COLOR.muted,
                    fontSize: FONT_SIZE.md,
                    fontFamily: FONT.body,
                    cursor: 'pointer',
                }}
            >
                <ChevronLeft size={18} />
                もどる
            </button>

            <div
                style={{
                    width: '100%',
                    padding: `${SPACE['3xl']}px ${SPACE.xl}px`,
                    borderRadius: RADIUS['3xl'],
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.82) 0%, rgba(232,248,240,0.92) 100%)',
                    border: '1px solid rgba(43, 186, 160, 0.16)',
                    boxShadow: '0 20px 40px rgba(43, 186, 160, 0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: SPACE.lg,
                }}
            >
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: SPACE.xs,
                        padding: '6px 12px',
                        borderRadius: RADIUS.full,
                        background: 'rgba(43, 186, 160, 0.12)',
                        color: COLOR.primaryDark,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                    }}
                >
                    <Sparkles size={14} />
                    ここが いちばん よくつかうボタン
                </div>

                <h2
                    style={{
                        margin: 0,
                        fontFamily: FONT.body,
                        fontSize: 22,
                        fontWeight: 700,
                        color: COLOR.dark,
                    }}
                >
                    このボタンで はじめるよ
                </h2>

                <p
                    style={{
                        margin: 0,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.lg,
                        color: COLOR.muted,
                        lineHeight: 1.8,
                    }}
                >
                    ホームがめんの まんなかにある
                    <br />
                    START をおすと すぐにはじまるよ
                </p>

                <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={onNext}
                    style={{
                        width: 156,
                        height: 156,
                        borderRadius: RADIUS.circle,
                        border: 'none',
                        background: `radial-gradient(circle at 30% 30%, ${COLOR.primary} 0%, ${COLOR.primaryDark} 72%)`,
                        color: COLOR.white,
                        boxShadow: '0 24px 48px rgba(43, 186, 160, 0.32), inset 0 4px 10px rgba(255,255,255,0.28)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: SPACE.xs,
                        cursor: 'pointer',
                    }}
                >
                    <span
                        style={{
                            fontFamily: FONT.heading,
                            fontSize: 34,
                            fontWeight: 800,
                            letterSpacing: 1.5,
                        }}
                    >
                        START
                    </span>
                    <span
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            opacity: 0.92,
                        }}
                    >
                        おして つぎへ
                    </span>
                </motion.button>
            </div>
        </motion.div>
    );
};
