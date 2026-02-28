import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { calculateFuwafuwaStatus, pickNextFuwafuwaType } from '../lib/fuwafuwa';
import { getTodayKey, type SessionRecord } from '../lib/db';
import { Heart, Edit2 } from 'lucide-react';

import type { UserProfileStore } from '../store/useAppStore';

interface Props {
    user: UserProfileStore;
    sessions: SessionRecord[];
}

export const FuwafuwaCharacter: React.FC<Props> = ({ user, sessions }) => {
    const { updateUser, resetUserFuwafuwa } = useAppStore();
    const { fuwafuwaBirthDate, fuwafuwaType, fuwafuwaName } = user;

    const [status, setStatus] = useState(() => calculateFuwafuwaStatus(fuwafuwaBirthDate || getTodayKey(), sessions));
    const controls = useAnimation();
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
    const [ripple, setRipple] = useState<{ x: number, y: number, id: number } | null>(null);
    const [sayonaraModal, setSayonaraModal] = useState<'farewell' | 'welcome' | null>(null);
    const [departingInfo, setDepartingInfo] = useState<{ name: string | null; type: number; stage: number; activeDays: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const particleIdCounter = useRef(0);
    const rippleIdCounter = useRef(0);
    const particleTimers = useRef<number[]>([]);

    // Debug Overrides (subscribed early so they can be used in effects)
    const debugStage = useAppStore(s => s.debugFuwafuwaStage);
    const debugType = useAppStore(s => s.debugFuwafuwaType);
    const debugActiveDays = useAppStore(s => s.debugActiveDays);
    const debugScale = useAppStore(s => s.debugFuwafuwaScale);

    const displayStage = debugStage !== null ? debugStage : status.stage;
    const displayType = debugType !== null ? debugType : fuwafuwaType;
    const displayActiveDays = debugActiveDays !== null ? debugActiveDays : status.activeDays;
    const displayScale = debugScale !== null ? debugScale : status.scale;

    // Cleanup particle timers on unmount
    useEffect(() => {
        const timers = particleTimers;
        return () => {
            timers.current.forEach(t => clearTimeout(t));
        };
    }, []);

    useEffect(() => {
        if (!fuwafuwaBirthDate) {
            updateUser(user.id, {
                fuwafuwaBirthDate: getTodayKey(),
                fuwafuwaType: Math.floor(Math.random() * 10)
            });
        }
    }, [fuwafuwaBirthDate, user.id, updateUser]);

    useEffect(() => {
        if (fuwafuwaBirthDate) {
            setStatus(calculateFuwafuwaStatus(fuwafuwaBirthDate, sessions));
        }
    }, [fuwafuwaBirthDate, sessions]);

    const handleSayonaraConfirm = async () => {
        // Save departing info for the farewell screen
        setDepartingInfo({
            name: fuwafuwaName,
            type: fuwafuwaType,
            stage: status.stage,
            activeDays: status.activeDays,
        });
        setSayonaraModal('farewell');
    };

    const handleNewEggTransition = () => {
        // Reset and create new egg with unique type selection
        const nextType = pickNextFuwafuwaType(user.pastFuwafuwas || [], user.fuwafuwaType);
        resetUserFuwafuwa(user.id, nextType, departingInfo?.activeDays || status.activeDays, departingInfo?.stage || status.stage);
        controls.set({ opacity: 1, scale: 0.5, y: 0 });
        setSayonaraModal('welcome');
    };

    const handleWelcomeClose = () => {
        setSayonaraModal(null);
        setDepartingInfo(null);
    };

    const handleTap = async (e: React.MouseEvent) => {
        if (status.isSayonara) {
            handleSayonaraConfirm();
            return;
        }

        // Ripple Effect
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setRipple({ x, y, id: rippleIdCounter.current++ });
        }

        // Spawn emotion particles
        const emojis = ['🎵', '✨', '💖', '🌟', '🫧'];
        const newParticles = Array.from({ length: 3 }).map(() => ({
            id: particleIdCounter.current++,
            x: (Math.random() - 0.5) * 60, // random offset around center
            y: (Math.random() - 0.5) * 60,
            emoji: emojis[Math.floor(Math.random() * emojis.length)]
        }));
        const newIds = new Set(newParticles.map(p => p.id));
        setParticles(prev => [...prev, ...newParticles]);
        const timer = window.setTimeout(() => {
            setParticles(prev => prev.filter(p => !newIds.has(p.id)));
        }, 1500);
        particleTimers.current.push(timer);

        // Random Tsun-Tsun Animations
        const rand = Math.random();
        const baseScale = displayScale;
        if (rand < 0.25) {
            // Bounce
            controls.start({
                y: [0, -30, 0, -15, 0],
                scale: [baseScale, baseScale * 1.1, baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.6, type: 'spring', bounce: 0.5 }
            });
        } else if (rand < 0.5) {
            // Shake
            controls.start({
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 }
            });
        } else if (rand < 0.75) {
            // Spin
            controls.start({
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.2, baseScale],
                transition: { duration: 0.6, ease: "easeInOut" }
            });
        } else {
            // Stretch
            controls.start({
                scaleX: [baseScale, baseScale * 0.8, baseScale * 1.1, baseScale],
                scaleY: [baseScale, baseScale * 1.2, baseScale * 0.9, baseScale],
                transition: { duration: 0.5 }
            });
        }
    };

    const handleEditName = () => {
        const newName = prompt('パートナーに名前をつけてあげよう！', fuwafuwaName || '');
        if (newName !== null) {
            updateUser(user.id, { fuwafuwaName: newName.trim() || null });
        }
    };

    // Idle floating and breathing animation
    useEffect(() => {
        if (!status.isSayonara) {
            controls.start({
                y: [0, -8, 0],
                scale: [displayScale * 0.98, displayScale * 1.02, displayScale * 0.98], // Breathing
                transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            });
        }
    }, [controls, status.isSayonara, displayScale]);

    // Aura Logic based on activeDays
    let auraColor = 'rgba(43,186,160,0.15)';
    let pulseDuration = 4;
    let showFireflies = false;

    if (displayActiveDays >= 5) {
        auraColor = 'rgba(255, 215, 0, 0.35)'; // Bright Warm Gold
        pulseDuration = 2; // Fast heartbeat
        showFireflies = true;
    } else if (displayActiveDays >= 2) {
        auraColor = 'rgba(255, 154, 158, 0.25)'; // Soft Warm Pink/Orange
        pulseDuration = 3;
    }

    const imagePath = `/ikimono/${displayType}-${displayStage}.png`;

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
            <div
                ref={containerRef}
                onClick={handleTap}
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
                {/* Outer Glowing Aura */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.5, 0.9, 0.5],
                    }}
                    transition={{ duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: 'absolute',
                        inset: -15,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${auraColor} 0%, rgba(255,255,255,0) 70%)`,
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
                        background: '#ffffff',
                        boxShadow: `0 12px 32px ${auraColor}, inset 0 4px 16px rgba(43, 186, 160, 0.08)`,
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        zIndex: 0,
                    }}
                />

                {/* Fireflies for high active days */}
                {showFireflies && (
                    <motion.div
                        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
                    >
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={`firefly-${i}`}
                                animate={{
                                    y: [40, -60],
                                    x: [Math.random() * 40 - 20, Math.random() * 40 - 20],
                                    opacity: [0, 0.8, 0]
                                }}
                                transition={{
                                    duration: 2 + Math.random() * 2,
                                    repeat: Infinity,
                                    delay: Math.random() * 2,
                                    ease: 'easeInOut'
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: '30%',
                                    left: '50%',
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    background: '#FFF3B0',
                                    boxShadow: '0 0 8px #FFD700'
                                }}
                            />
                        ))}
                    </motion.div>
                )}

                {/* Ground Shadow underneath the character */}
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
                        pointerEvents: 'none'
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
                                transform: 'scale(1.05)'
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

                        {/* Ripple Effect Canvas inside portal */}
                        <AnimatePresence>
                            {ripple && (
                                <motion.div
                                    key={ripple.id}
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 4, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.6, ease: "easeOut" }}
                                    style={{
                                        position: 'absolute',
                                        left: ripple.x - 20, // offset half width of ripple
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

                    {/* Emotion Particles */}
                    <AnimatePresence>
                        {particles.map(p => (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                                animate={{ opacity: [0, 1, 0], scale: 1, x: p.x, y: p.y - 40 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                style={{
                                    position: 'absolute',
                                    fontSize: 24,
                                    pointerEvents: 'none',
                                    zIndex: 10
                                }}
                            >
                                {p.emoji}
                            </motion.div>
                        ))}
                    </AnimatePresence>

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

            {/* Status indicator and Naming */}
            <div style={{
                marginTop: status.isSayonara ? 16 : 8,
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid rgba(255,255,255,1)',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                zIndex: 1
            }}>
                <div style={{
                    fontSize: 13,
                    color: '#636E72',
                    fontWeight: 600,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    textAlign: 'center',
                }}>
                    {status.stage === 1 ? (
                        status.daysAlive < 3
                            ? `たまごになって ${status.daysAlive} 日目`
                            : 'もうすぐ生まれそう...！'
                    ) : (
                        <>
                            <span style={{ color: '#2D3436', fontWeight: 800 }}>{fuwafuwaName || 'なまえなし'}</span>
                            <span style={{ margin: '0 6px', color: '#B2BEC3' }}>|</span>
                            {status.daysAlive} 日目
                        </>
                    )}
                </div>
                {status.stage !== 1 && (
                    <button
                        onClick={handleEditName}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: 4,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#8395A7',
                            borderRadius: '50%',
                            transition: 'background 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                        onMouseOut={e => e.currentTarget.style.background = 'none'}
                        title="名前を変更する"
                    >
                        <Edit2 size={14} />
                    </button>
                )}
            </div>

            {/* Sayonara → New Egg Transition Modal */}
            {sayonaraModal && createPortal(
                <AnimatePresence mode="wait">
                    {sayonaraModal === 'farewell' && departingInfo && (() => {
                        const isAdult = departingInfo.stage === 3;
                        return (
                            <motion.div
                                key="farewell"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: isAdult
                                        ? 'linear-gradient(180deg, #FFFBEB 0%, #FFF8E1 50%, #FFF3E0 100%)'
                                        : 'linear-gradient(180deg, #FFF5F5 0%, #FFF0F5 50%, #F8F0FF 100%)',
                                    zIndex: 200,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 32,
                                }}
                            >
                                {/* Floating particles background */}
                                {[...Array(8)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            y: [0, -30, 0],
                                            x: [0, (i % 2 ? 10 : -10), 0],
                                            opacity: [0.3, 0.7, 0.3],
                                        }}
                                        transition={{
                                            duration: 3 + i * 0.5,
                                            repeat: Infinity,
                                            delay: i * 0.3,
                                        }}
                                        style={{
                                            position: 'absolute',
                                            fontSize: 20,
                                            left: `${10 + (i * 12) % 80}%`,
                                            top: `${15 + (i * 17) % 60}%`,
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {isAdult
                                            ? ['🏠', '✨', '🌟', '🎀', '💫', '🌈', '⭐', '🎉'][i]
                                            : ['🌸', '✨', '💫', '🍃', '🌙', '💖', '⭐', '🦋'][i]
                                        }
                                    </motion.div>
                                ))}

                                {/* Departing character */}
                                {/* アニメーションとoverflow:hiddenを分離（iOS Safariのクリッピングバグ対策） */}
                                <motion.div
                                    initial={{ scale: 1, y: 0 }}
                                    animate={{ scale: [1, 1.05, 1], y: [0, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{ marginBottom: 24 }}
                                >
                                    <div style={{
                                        width: 120,
                                        height: 120,
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        border: isAdult
                                            ? '4px solid rgba(255, 215, 0, 0.6)'
                                            : '4px solid rgba(255,255,255,0.9)',
                                        boxShadow: isAdult
                                            ? '0 12px 40px rgba(255, 215, 0, 0.25)'
                                            : '0 12px 40px rgba(232, 67, 147, 0.2)',
                                        background: '#fff',
                                    }}>
                                        <img
                                            src={`/ikimono/${departingInfo.type}-${departingInfo.stage}.png`}
                                            alt="departing fuwafuwa"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', display: 'block' }}
                                        />
                                    </div>
                                </motion.div>

                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 22,
                                        fontWeight: 800,
                                        color: '#2D3436',
                                        margin: '0 0 8px',
                                        textAlign: 'center',
                                    }}
                                >
                                    {isAdult
                                        ? <>{departingInfo.name || 'ふわふわ'}は<br />お部屋にいくよ！</>
                                        : <>{departingInfo.name || 'ふわふわ'}、<br />バイバイまたね！</>
                                    }
                                </motion.h2>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        color: '#8395A7',
                                        textAlign: 'center',
                                        lineHeight: 1.8,
                                        margin: '0 0 8px',
                                    }}
                                >
                                    {departingInfo.activeDays}日間、いっしょにがんばったね。
                                </motion.p>

                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 13,
                                        color: '#B2BEC3',
                                        textAlign: 'center',
                                        lineHeight: 1.6,
                                        margin: '0 0 32px',
                                    }}
                                >
                                    {isAdult
                                        ? 'いつでも お部屋で会えるよ。'
                                        : 'またいつか会えるかも。'
                                    }
                                </motion.p>

                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1.2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleNewEggTransition}
                                    style={{
                                        padding: '16px 40px',
                                        borderRadius: 99,
                                        border: 'none',
                                        background: isAdult
                                            ? 'linear-gradient(135deg, #F59E0B, #FBBF24)'
                                            : 'linear-gradient(135deg, #E84393, #FD79A8)',
                                        color: 'white',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: isAdult
                                            ? '0 8px 24px rgba(245, 158, 11, 0.3)'
                                            : '0 8px 24px rgba(232, 67, 147, 0.3)',
                                        letterSpacing: 2,
                                    }}
                                >
                                    {isAdult ? 'いってらっしゃい！' : 'バイバイ！'}
                                </motion.button>
                            </motion.div>
                        );
                    })()}

                    {sayonaraModal === 'welcome' && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'linear-gradient(180deg, #F0FDFA 0%, #E0F7FA 50%, #F0F4FF 100%)',
                                zIndex: 200,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 32,
                            }}
                        >
                            {/* Sparkle particles */}
                            {[...Array(10)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0, 1, 0],
                                        y: [0, -20, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                    style={{
                                        position: 'absolute',
                                        fontSize: 16,
                                        left: `${5 + (i * 11) % 90}%`,
                                        top: `${10 + (i * 13) % 70}%`,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    ✨
                                </motion.div>
                            ))}

                            {/* New egg with grand entrance */}
                            {/* アニメーションとoverflow:hiddenを分離（iOS Safariのクリッピングバグ対策） */}
                            <motion.div
                                initial={{ scale: 0, rotate: -10 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
                                style={{ marginBottom: 24 }}
                            >
                                <div style={{
                                    width: 130,
                                    height: 130,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '4px solid rgba(255,255,255,0.95)',
                                    boxShadow: '0 16px 48px rgba(43, 186, 160, 0.25)',
                                    background: '#fff',
                                }}>
                                    <motion.img
                                        animate={{
                                            scale: [1.05, 1.1, 1.05],
                                            rotate: [0, 2, -2, 0],
                                        }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        src={`/ikimono/${user.fuwafuwaType}-1.png`}
                                        alt="new egg"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    />
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                style={{ fontSize: 48, marginBottom: 8 }}
                            >
                                🎉
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 22,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    margin: '0 0 12px',
                                    textAlign: 'center',
                                }}
                            >
                                あたらしい たまごが<br />やってきたよ！
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.0 }}
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    color: '#8395A7',
                                    textAlign: 'center',
                                    lineHeight: 1.8,
                                    margin: '0 0 32px',
                                }}
                            >
                                まいにち がんばって<br />たいせつに そだてよう！
                            </motion.p>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.3 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleWelcomeClose}
                                style={{
                                    padding: '16px 40px',
                                    borderRadius: 99,
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #2BBAA0, #3AEDC6)',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 24px rgba(43, 186, 160, 0.3)',
                                    letterSpacing: 2,
                                }}
                            >
                                よろしくね！
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
