import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Hand, SkipForward, X } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';

interface SessionControlsHintProps {
    open: boolean;
    onClose: () => void;
}

const hintRows = [
    { icon: Hand, text: 'タップで とめる / さいかい' },
    { icon: SkipForward, text: 'うえにスワイプで つぎへ' },
    { icon: X, text: 'みぎうえの × で おわる' },
];

export const SessionControlsHint: React.FC<SessionControlsHintProps> = ({
    open,
    onClose,
}) => {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 70,
                        padding: 'calc(env(safe-area-inset-top, 16px) + 56px) 16px 16px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            maxWidth: 320,
                            width: '100%',
                            background: 'rgba(255,255,255,0.96)',
                            border: '1px solid rgba(43, 186, 160, 0.12)',
                            borderRadius: RADIUS['2xl'],
                            boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
                            padding: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: SPACE.md,
                            pointerEvents: 'auto',
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs,
                                    fontWeight: 700,
                                    color: COLOR.primary,
                                    letterSpacing: 0.6,
                                }}
                            >
                                はじめての つかいかた
                            </div>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: 700,
                                    color: COLOR.dark,
                                }}
                            >
                                おぼえるのは これだけ
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
                            {hintRows.map(({ icon: Icon, text }) => (
                                <div
                                    key={text}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: SPACE.sm,
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        color: COLOR.text,
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: RADIUS.circle,
                                            background: 'rgba(43, 186, 160, 0.1)',
                                            color: COLOR.primary,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon size={14} />
                                    </div>
                                    <span>{text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                alignSelf: 'flex-end',
                                padding: '8px 14px',
                                borderRadius: RADIUS.full,
                                border: 'none',
                                background: 'rgba(43, 186, 160, 0.12)',
                                color: COLOR.primary,
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}
                        >
                            わかった
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
