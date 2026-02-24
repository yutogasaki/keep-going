import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateFuwafuwaStatus } from '../lib/fuwafuwa';
import { getTodayKey, type SessionRecord } from '../lib/db';
import { Heart } from 'lucide-react';

interface Props {
    sessions: SessionRecord[];
}

export const FuwafuwaCharacter: React.FC<Props> = ({ sessions }) => {
    const { fuwafuwaBirthDate, fuwafuwaType, fuwafuwaCycleCount, setFuwafuwaState } = useAppStore();
    const [status, setStatus] = useState(() => calculateFuwafuwaStatus(fuwafuwaBirthDate || getTodayKey(), sessions));
    const controls = useAnimation();

    useEffect(() => {
        if (!fuwafuwaBirthDate) {
            setFuwafuwaState({ fuwafuwaBirthDate: getTodayKey(), fuwafuwaType: Math.floor(Math.random() * 6) });
        }
    }, [fuwafuwaBirthDate, setFuwafuwaState]);

    useEffect(() => {
        if (fuwafuwaBirthDate) {
            setStatus(calculateFuwafuwaStatus(fuwafuwaBirthDate, sessions));
        }
    }, [fuwafuwaBirthDate, sessions]);

    const handleTap = async () => {
        if (status.isSayonara) {
            // Animate out
            await controls.start({ opacity: 0, scale: 0, y: -50, transition: { duration: 0.8 } });
            // Reset for next generation
            setFuwafuwaState({
                fuwafuwaBirthDate: getTodayKey(),
                fuwafuwaType: Math.floor(Math.random() * 6),
                fuwafuwaCycleCount: fuwafuwaCycleCount + 1
            });
            controls.set({ opacity: 1, scale: 0.5, y: 0 }); // reset for new egg
        } else {
            // "Tsun-Tsun" animation
            controls.start({
                y: [0, -20, 0, -10, 0],
                scale: [status.scale, status.scale * 1.1, status.scale, status.scale * 1.05, status.scale],
                transition: { duration: 0.6, type: 'spring', bounce: 0.5 }
            });
        }
    };

    // Idle floating animation
    useEffect(() => {
        if (!status.isSayonara) {
            controls.start({
                y: [0, -8, 0],
                transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            });
        }
    }, [controls, status.isSayonara]);

    // Path to image: /ikimono/{type}-{stage}.png
    const imagePath = `/ikimono/${fuwafuwaType}-${status.stage}.png`;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 0',
            position: 'relative',
        }}>
            {/* Elegant Habitat Orb Container */}
            <div style={{
                position: 'relative',
                width: 180,
                height: 180,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
            }}>
                {/* Outer Glowing Aura */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute',
                        inset: -10,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(43,186,160,0.15) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 0,
                        pointerEvents: 'none'
                    }}
                />

                {/* Main Glass/White Bubble Base */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 4,
                        borderRadius: '50%',
                        background: '#ffffff', // Solid white perfectly blends with white image backgrounds
                        boxShadow: '0 12px 32px rgba(43, 186, 160, 0.12), inset 0 4px 16px rgba(43, 186, 160, 0.08)',
                        border: '1px solid rgba(43, 186, 160, 0.15)',
                        zIndex: 0,
                    }}
                />

                {/* Ground Shadow underneath the character */}
                <motion.div
                    animate={{
                        scale: [1, 0.9, 1],
                        opacity: [0.3, 0.15, 0.3]
                    }}
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
                        pointerEvents: 'none'
                    }}
                />

                <motion.div
                    animate={controls}
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileInView={{ opacity: 1, scale: status.scale }}
                    onClick={handleTap}
                    style={{
                        cursor: 'pointer',
                        zIndex: 2,
                        position: 'relative',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    {/* The Premium Circular Portal */}
                    <div style={{
                        width: 148,
                        height: 148,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 8px 24px rgba(43, 186, 160, 0.2)',
                        border: '3px solid #ffffff',
                        background: '#ffffff'
                    }}>
                        <img
                            src={imagePath}
                            alt={`Fuwafuwa Stage ${status.stage}`}
                            draggable={false}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scale(1.05)' /* Slight zoom to avoid edge artifacts */
                            }}
                        />
                        {/* Glass Reflection Overlay */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%)',
                            pointerEvents: 'none',
                        }} />
                        {/* Inner shadow for depth */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '50%',
                            boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.1)',
                            pointerEvents: 'none',
                        }} />
                    </div>

                    {status.isSayonara && (
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
                                border: '1px solid rgba(232, 67, 147, 0.1)'
                            }}
                        >
                            <Heart size={16} fill="#E84393" />
                            タップしてお別れ
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Status indicator */}
            <div style={{
                marginTop: status.isSayonara ? 16 : 8,
                padding: '6px 14px',
                background: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(0,0,0,0.03)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                borderRadius: 20,
                fontSize: 12,
                color: '#8395A7',
                fontWeight: 600,
                fontFamily: "'Noto Sans JP', sans-serif",
                textAlign: 'center',
                zIndex: 1
            }}>
                生まれてから {status.daysAlive} 日目
                {status.stage === 2 && ` (頑張り度: ${status.activeDays}日)`}
            </div>
        </div>
    );
};
