import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import type { EmotionParticle, RippleState } from './types';

interface FuwafuwaOrbProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    onTap: (event: React.MouseEvent<HTMLDivElement>) => void;
    controls: ReturnType<typeof import('framer-motion').useAnimation>;
    displayScale: number;
    imagePath: string;
    stage: number;
    isSayonara: boolean;
    particles: EmotionParticle[];
    ripple: RippleState | null;
    auraColor: string;
    pulseDuration: number;
    showFireflies: boolean;
}

export const FuwafuwaOrb: React.FC<FuwafuwaOrbProps> = ({
    containerRef,
    onTap,
    controls,
    displayScale,
    imagePath,
    stage,
    isSayonara,
    particles,
    ripple,
    auraColor,
    pulseDuration,
    showFireflies,
}) => {
    return (
        <div
            ref={containerRef}
            onClick={onTap}
            style={{
                position: 'relative',
                width: 180,
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.9, 0.5],
                }}
                transition={{ duration: pulseDuration, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    inset: -15,
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${auraColor} 0%, rgba(255,255,255,0) 70%)`,
                    zIndex: 0,
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 4,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: `0 12px 32px ${auraColor}, inset 0 4px 16px rgba(43, 186, 160, 0.08)`,
                    border: '1px solid rgba(255, 255, 255, 0.8)',
                    zIndex: 0,
                }}
            />

            {showFireflies && (
                <motion.div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
                    {[...Array(5)].map((_, index) => (
                        <motion.div
                            key={`firefly-${index}`}
                            animate={{
                                y: [40, -60],
                                x: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                                opacity: [0, 0.8, 0],
                            }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: 'easeInOut',
                            }}
                            style={{
                                position: 'absolute',
                                bottom: '30%',
                                left: '50%',
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: '#FFF3B0',
                                boxShadow: '0 0 8px #FFD700',
                            }}
                        />
                    ))}
                </motion.div>
            )}

            <motion.div
                animate={{ scale: [1, 0.9, 1], opacity: [0.3, 0.15, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                    position: 'absolute',
                    bottom: 24,
                    width: 70,
                    height: 12,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.1)',
                    filter: 'blur(3px)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            <motion.div
                animate={controls}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: displayScale }}
                style={{
                    zIndex: 2,
                    position: 'relative',
                    userSelect: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                }}
            >
                <div
                    style={{
                        width: 148,
                        height: 148,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 8px 24px rgba(43, 186, 160, 0.2)',
                        border: '3px solid #ffffff',
                        background: '#ffffff',
                    }}
                >
                    <img
                        src={imagePath}
                        alt={`Fuwafuwa Stage ${stage}`}
                        draggable={false}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scale(1.05)',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.1)',
                            pointerEvents: 'none',
                        }}
                    />

                    <AnimatePresence>
                        {ripple && (
                            <motion.div
                                key={ripple.id}
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 4, opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                style={{
                                    position: 'absolute',
                                    left: ripple.x - 20,
                                    top: ripple.y - 20,
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                                    pointerEvents: 'none',
                                }}
                            />
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence>
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: 1, x: particle.x, y: particle.y - 40 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{
                                position: 'absolute',
                                fontSize: 24,
                                pointerEvents: 'none',
                                zIndex: 10,
                            }}
                        >
                            {particle.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {isSayonara && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            position: 'absolute',
                            bottom: -20,
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: 20,
                            boxShadow: '0 8px 16px rgba(232, 67, 147, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#E84393',
                            whiteSpace: 'nowrap',
                            border: '1px solid rgba(232, 67, 147, 0.1)',
                        }}
                    >
                        <Heart size={16} fill="#E84393" />
                        タップしてお別れ
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
