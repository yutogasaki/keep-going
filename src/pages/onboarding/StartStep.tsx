import React from 'react';
import { motion } from 'framer-motion';
import { Home, BarChart3, List, Settings, Sparkles } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import { OnboardingStepScaffold } from './OnboardingStepScaffold';

interface StartStepProps {
    onNext: () => void;
    onBack: () => void;
}

const previewTabs = [
    { label: 'ホーム', icon: Home },
    { label: 'きろく', icon: BarChart3 },
    { label: 'メニュー', icon: List },
    { label: 'せってい', icon: Settings },
];

export const StartStep: React.FC<StartStepProps> = ({ onNext, onBack }) => {
    return (
        <motion.div
            key="start"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                width: '100%',
            }}
        >
            <OnboardingStepScaffold onBack={onBack} maxWidth={420} gap={SPACE['2xl']}>
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
                    ここを おすと はじまるよ
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
                    したの まんなかの
                    <br />
                    みどりの まるボタン
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
                    ホームがめんの したにある
                    <br />
                    みどりの ▶ ボタンで すぐにはじめるよ
                </p>

                <div
                    style={{
                        width: '100%',
                        maxWidth: 280,
                        paddingTop: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: SPACE.md,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            height: 180,
                            borderRadius: 28,
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(212,240,231,0.88) 100%)',
                            border: '1px solid rgba(255,255,255,0.72)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(circle at 50% 24%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 58%)',
                            }}
                        />

                        <div
                            style={{
                                position: 'absolute',
                                left: 18,
                                right: 18,
                                bottom: 16,
                                height: 64,
                                borderRadius: 24,
                                background: 'rgba(255,255,255,0.72)',
                                border: '1px solid rgba(255,255,255,0.7)',
                                boxShadow: '0 -2px 16px rgba(0,0,0,0.04)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 18px',
                            }}
                        >
                            <div style={{ display: 'flex', gap: 22 }}>
                                {previewTabs.slice(0, 2).map(({ label, icon: Icon }, index) => (
                                    <div
                                        key={label}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 3,
                                            color: index === 0 ? COLOR.primary : '#B2BEC3',
                                            minWidth: 40,
                                        }}
                                    >
                                        <Icon size={18} strokeWidth={index === 0 ? 2.4 : 2} />
                                        <span style={{ fontFamily: FONT.body, fontSize: 9, fontWeight: 700 }}>{label}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: 22 }}>
                                {previewTabs.slice(2).map(({ label, icon: Icon }) => (
                                    <div
                                        key={label}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 3,
                                            color: '#B2BEC3',
                                            minWidth: 40,
                                        }}
                                    >
                                        <Icon size={18} strokeWidth={2} />
                                        <span style={{ fontFamily: FONT.body, fontSize: 9, fontWeight: 700 }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <motion.button
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={onNext}
                            aria-label="はじめる"
                            style={{
                                position: 'absolute',
                                left: '50%',
                                bottom: 46,
                                transform: 'translateX(-50%)',
                                width: 72,
                                height: 72,
                                borderRadius: RADIUS.circle,
                                border: 'none',
                                background: `linear-gradient(135deg, ${COLOR.primary} 0%, ${COLOR.primaryDark} 100%)`,
                                color: COLOR.white,
                                boxShadow: '0 6px 20px rgba(43, 186, 160, 0.4), 0 2px 8px rgba(43, 186, 160, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                zIndex: 2,
                            }}
                        >
                            <div
                                aria-hidden="true"
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderTop: '12px solid transparent',
                                    borderBottom: '12px solid transparent',
                                    borderLeft: '18px solid white',
                                    marginLeft: 4,
                                }}
                            />
                        </motion.button>
                    </div>

                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.primaryDark,
                        }}
                    >
                        これと おなじ ボタンを さがしてね
                    </div>
                </div>
                </div>
            </OnboardingStepScaffold>
        </motion.div>
    );
};
