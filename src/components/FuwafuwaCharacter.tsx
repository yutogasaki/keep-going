import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimation } from 'framer-motion';
import type { AnimationDefinition } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { useShallow } from 'zustand/react/shallow';
import { calculateFuwafuwaStatus, pickNextFuwafuwaType } from '../lib/fuwafuwa';
import { getTodayKey, type SessionRecord } from '../lib/db';
import type { UserProfileStore } from '../store/useAppStore';
import { FuwafuwaOrb } from './fuwafuwa/FuwafuwaOrb';
import { FuwafuwaStatusPill } from './fuwafuwa/FuwafuwaStatusPill';
import { FuwafuwaTransitionModal } from './fuwafuwa/FuwafuwaTransitionModal';
import { getAuraVisualState } from './fuwafuwa/getAuraVisualState';
import { FuwafuwaNameModal } from './fuwafuwa/FuwafuwaNameModal';
import type { DepartingInfo, EmotionParticle, RippleState, SayonaraModalState } from './fuwafuwa/types';
import type { FuwafuwaReactionStyle } from '../pages/home/fuwafuwaSpeechReaction';
import { getReactionEmojis } from '../pages/home/fuwafuwaSpeechReaction';

interface Props {
    user: UserProfileStore;
    sessions: SessionRecord[];
    onInteract?: () => void;
    reactionStyle?: FuwafuwaReactionStyle;
}

export const FuwafuwaCharacter: React.FC<Props> = ({
    user,
    sessions,
    onInteract,
    reactionStyle = 'cozy',
}) => {
    const updateUser = useAppStore((state) => state.updateUser);
    const resetUserFuwafuwa = useAppStore((state) => state.resetUserFuwafuwa);
    const { fuwafuwaBirthDate, fuwafuwaType, fuwafuwaName } = user;

    const [status, setStatus] = useState(() => calculateFuwafuwaStatus(fuwafuwaBirthDate || getTodayKey(), sessions));
    const [particles, setParticles] = useState<EmotionParticle[]>([]);
    const [ripple, setRipple] = useState<RippleState | null>(null);
    const [sayonaraModal, setSayonaraModal] = useState<SayonaraModalState>(null);
    const [departingInfo, setDepartingInfo] = useState<DepartingInfo | null>(null);
    const [showNameModal, setShowNameModal] = useState(false);

    const controls = useAnimation();
    const containerRef = useRef<HTMLDivElement>(null);
    const particleIdCounter = useRef(0);
    const rippleIdCounter = useRef(0);
    const particleTimers = useRef<number[]>([]);

    const debugOverrides = useAppStore(useShallow((state) => ({
        stage: state.debugFuwafuwaStage,
        type: state.debugFuwafuwaType,
        activeDays: state.debugActiveDays,
        scale: state.debugFuwafuwaScale,
    })));

    const displayStage = debugOverrides.stage ?? status.stage;
    const displayType = debugOverrides.type ?? fuwafuwaType;
    const displayActiveDays = debugOverrides.activeDays ?? status.activeDays;
    const displayScale = debugOverrides.scale ?? status.scale;

    useEffect(() => {
        const timers = particleTimers;
        return () => {
            timers.current.forEach((timerId) => clearTimeout(timerId));
        };
    }, []);

    useEffect(() => {
        if (!fuwafuwaBirthDate) {
            updateUser(user.id, {
                fuwafuwaBirthDate: getTodayKey(),
                fuwafuwaType: Math.floor(Math.random() * 10),
            });
        }
    }, [fuwafuwaBirthDate, user.id, updateUser]);

    useEffect(() => {
        if (fuwafuwaBirthDate) {
            setStatus(calculateFuwafuwaStatus(fuwafuwaBirthDate, sessions));
        }
    }, [fuwafuwaBirthDate, sessions]);

    useEffect(() => {
        if (!status.isSayonara) {
            void controls.start({
                y: [0, -8, 0],
                scale: [displayScale * 0.98, displayScale * 1.02, displayScale * 0.98],
                transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            });
        }
    }, [controls, status.isSayonara, displayScale]);

    const handleSayonaraConfirm = () => {
        setDepartingInfo({
            name: fuwafuwaName,
            type: fuwafuwaType,
            stage: status.stage,
            activeDays: status.activeDays,
        });
        setSayonaraModal('farewell');
    };

    const handleNewEggTransition = () => {
        const nextType = pickNextFuwafuwaType(user.pastFuwafuwas || [], user.fuwafuwaType);
        resetUserFuwafuwa(user.id, nextType, departingInfo?.activeDays || status.activeDays, departingInfo?.stage || status.stage);
        controls.set({ opacity: 1, scale: 0.5, y: 0 });
        setSayonaraModal('welcome');
    };

    const handleWelcomeClose = () => {
        setSayonaraModal(null);
        setDepartingInfo(null);
    };

    const handleTap = (event: React.MouseEvent<HTMLDivElement>) => {
        if (status.isSayonara) {
            handleSayonaraConfirm();
            return;
        }

        onInteract?.();

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setRipple({ x, y, id: rippleIdCounter.current++ });
        }

        const reactionEmojis = getReactionEmojis(reactionStyle);
        const particleCount = reactionStyle === 'celebrating'
            ? 6
            : reactionStyle === 'growing'
                ? 5
                : 4;
        const newParticles = Array.from({ length: particleCount }).map(() => ({
            id: particleIdCounter.current++,
            x: (Math.random() - 0.5) * 84,
            y: (Math.random() - 0.5) * 84,
            emoji: reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)],
        }));
        const newIds = new Set(newParticles.map((particle) => particle.id));
        setParticles((previous) => [...previous, ...newParticles]);

        const timerId = window.setTimeout(() => {
            setParticles((previous) => previous.filter((particle) => !newIds.has(particle.id)));
        }, 1500);
        particleTimers.current.push(timerId);

        const baseScale = displayScale;
        const restartIdle = () => {
            if (status.isSayonara) {
                return;
            }

            void controls.start({
                y: [0, -8, 0],
                scale: [baseScale * 0.98, baseScale * 1.02, baseScale * 0.98],
                transition: {
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            });
        };

        const playReaction = (animation: AnimationDefinition) => {
            void controls.start(animation).then(restartIdle);
        };

        const reactionRoll = Math.random();

        if (reactionStyle === 'celebrating') {
            if (reactionRoll < 0.34) {
                playReaction({
                    y: [0, -30, 0, -15, 0],
                    scale: [baseScale, baseScale * 1.1, baseScale, baseScale * 1.05, baseScale],
                    rotate: [0, -8, 8, 0],
                    transition: { duration: 0.6, type: 'spring', bounce: 0.5 },
                });
                return;
            }

            if (reactionRoll < 0.67) {
                playReaction({
                    y: [0, -18, 0],
                    rotate: [0, 360],
                    scale: [baseScale, baseScale * 1.06, baseScale],
                    transition: { duration: 0.72, ease: 'easeInOut' },
                });
                return;
            }

            playReaction({
                rotate: [0, -12, 12, -10, 10, 0],
                scale: [baseScale, baseScale * 1.1, baseScale * 0.96, baseScale],
                transition: { duration: 0.68, ease: 'easeInOut' },
            });
            return;
        }

        if (reactionStyle === 'sharing') {
            if (reactionRoll < 0.34) {
                playReaction({
                    x: [0, -10, 10, -10, 10, 0],
                    y: [0, -6, 0],
                    transition: { duration: 0.4 },
                });
                return;
            }

            if (reactionRoll < 0.67) {
                playReaction({
                    rotate: [0, -18, 18, -10, 10, 0],
                    y: [0, -12, 0],
                    scale: [baseScale, baseScale * 1.05, baseScale],
                    transition: { duration: 0.58, ease: 'easeInOut' },
                });
                return;
            }

            playReaction({
                rotate: [0, -10, 10, -8, 8, 0],
                y: [0, -10, 0],
                scale: [baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.62, ease: 'easeInOut' },
            });
            return;
        }

        if (reactionStyle === 'growing') {
            if (reactionRoll < 0.34) {
                playReaction({
                    y: [0, -18, 0, -8, 0],
                    scale: [baseScale, baseScale * 1.08, baseScale, baseScale * 1.03, baseScale],
                    transition: { duration: 0.55, ease: 'easeInOut' },
                });
                return;
            }

            if (reactionRoll < 0.67) {
                playReaction({
                    rotate: [0, -10, 10, -6, 0],
                    y: [0, -12, 0],
                    scale: [baseScale, baseScale * 1.06, baseScale],
                    transition: { duration: 0.56, ease: 'easeInOut' },
                });
                return;
            }

            playReaction({
                y: [0, -20, 0],
                rotate: [0, -12, 12, -8, 8, 0],
                scale: [baseScale, baseScale * 1.07, baseScale],
                transition: { duration: 0.66, ease: 'easeInOut' },
            });
            return;
        }

        if (reactionStyle === 'guiding') {
            if (reactionRoll < 0.34) {
                playReaction({
                    rotate: [0, -5, 5, -2, 0],
                    scale: [baseScale, baseScale * 1.03, baseScale],
                    transition: { duration: 0.5, ease: 'easeInOut' },
                });
                return;
            }

            if (reactionRoll < 0.67) {
                playReaction({
                    x: [0, -8, 8, -6, 0],
                    y: [0, -10, 0],
                    rotate: [0, 12, -12, 0],
                    transition: { duration: 0.52, ease: 'easeInOut' },
                });
                return;
            }

            playReaction({
                x: [0, -8, 8, -6, 0],
                y: [0, -10, 0],
                rotate: [0, 14, -14, 8, 0],
                scale: [baseScale, baseScale * 1.04, baseScale],
                transition: { duration: 0.58, ease: 'easeInOut' },
            });
            return;
        }

        if (reactionRoll < 0.34) {
            playReaction({
                y: [0, -12, 0],
                scale: [baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.5 },
            });
            return;
        }

        if (reactionRoll < 0.67) {
            playReaction({
                rotate: [0, -10, 10, -6, 0],
                y: [0, -8, 0],
                transition: { duration: 0.55, ease: 'easeInOut' },
            });
            return;
        }

        playReaction({
            y: [0, -14, 0],
            rotate: [0, -14, 14, -8, 0],
            scale: [baseScale, baseScale * 1.03, baseScale],
            transition: { duration: 0.62, ease: 'easeInOut' },
        });
    };

    const handleEditName = () => {
        setShowNameModal(true);
    };

    const handleNameConfirm = (name: string | null) => {
        updateUser(user.id, { fuwafuwaName: name });
        setShowNameModal(false);
    };

    const imagePath = `/ikimono/${displayType}-${displayStage}.webp`;
    const auraVisual = useMemo(() => getAuraVisualState(displayActiveDays), [displayActiveDays]);
    const { auraColor, pulseDuration, showFireflies } = auraVisual;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 0',
                position: 'relative',
            }}
        >
            <FuwafuwaOrb
                containerRef={containerRef}
                onTap={handleTap}
                controls={controls}
                displayScale={displayScale}
                imagePath={imagePath}
                stage={displayStage}
                isSayonara={status.isSayonara}
                particles={particles}
                ripple={ripple}
                auraColor={auraColor}
                pulseDuration={pulseDuration}
                showFireflies={showFireflies}
            />

            <FuwafuwaStatusPill
                stage={displayStage}
                daysAlive={status.daysAlive}
                isSayonara={status.isSayonara}
                name={fuwafuwaName}
                onEditName={handleEditName}
            />

            <FuwafuwaNameModal
                open={showNameModal}
                currentName={fuwafuwaName}
                onCancel={() => setShowNameModal(false)}
                onConfirm={handleNameConfirm}
            />

            <FuwafuwaTransitionModal
                modalState={sayonaraModal}
                departingInfo={departingInfo}
                userFuwafuwaType={user.fuwafuwaType}
                onNewEggTransition={handleNewEggTransition}
                onWelcomeClose={handleWelcomeClose}
            />
        </div>
    );
};
