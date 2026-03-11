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

type ReactionVariantMap = Record<FuwafuwaReactionStyle, AnimationDefinition[]>;

function pickWeightedIndex(weights: readonly number[], lastIndex: number | null): number {
    const adjusted = weights.map((weight, index) => {
        if (lastIndex === null || index !== lastIndex || weights.length === 1) {
            return weight;
        }

        return Math.max(1, Math.floor(weight / 2));
    });

    const total = adjusted.reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * total;

    for (let index = 0; index < adjusted.length; index += 1) {
        roll -= adjusted[index];
        if (roll < 0) {
            return index;
        }
    }

    return adjusted.length - 1;
}

function pickParticleBatch(
    palette: readonly string[],
    count: number,
    lastEmoji: string | null,
): { emojis: string[]; lastEmoji: string | null } {
    const emojis: string[] = [];
    let previousEmoji = lastEmoji;

    for (let index = 0; index < count; index += 1) {
        const pool = palette.filter((emoji) => emoji !== previousEmoji);
        const nextEmoji = (pool.length > 0 ? pool : palette)[Math.floor(Math.random() * (pool.length > 0 ? pool.length : palette.length))];
        emojis.push(nextEmoji);
        previousEmoji = nextEmoji;
    }

    return {
        emojis,
        lastEmoji: previousEmoji,
    };
}

function getReactionVariants(baseScale: number): ReactionVariantMap {
    return {
        cozy: [
            {
                y: [0, -12, 0],
                scale: [baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.48, ease: 'easeInOut' },
            },
            {
                rotate: [0, -10, 10, -6, 0],
                y: [0, -8, 0],
                transition: { duration: 0.52, ease: 'easeInOut' },
            },
            {
                x: [0, -8, 8, -6, 0],
                y: [0, -10, 0],
                scale: [baseScale, baseScale * 1.03, baseScale],
                transition: { duration: 0.56, ease: 'easeInOut' },
            },
            {
                y: [0, -16, 0],
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.04, baseScale],
                transition: { duration: 0.72, ease: 'easeInOut' },
            },
        ],
        growing: [
            {
                y: [0, -18, 0, -8, 0],
                scale: [baseScale, baseScale * 1.08, baseScale, baseScale * 1.03, baseScale],
                transition: { duration: 0.56, ease: 'easeInOut' },
            },
            {
                rotate: [0, -12, 12, -6, 0],
                y: [0, -12, 0],
                scale: [baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.56, ease: 'easeInOut' },
            },
            {
                x: [0, -10, 10, -6, 0],
                y: [0, -14, 0],
                transition: { duration: 0.58, ease: 'easeInOut' },
            },
            {
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.07, baseScale],
                transition: { duration: 0.74, ease: 'easeInOut' },
            },
        ],
        sharing: [
            {
                x: [0, -10, 10, -10, 10, 0],
                y: [0, -6, 0],
                transition: { duration: 0.42, ease: 'easeInOut' },
            },
            {
                rotate: [0, -18, 18, -10, 10, 0],
                y: [0, -12, 0],
                scale: [baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.58, ease: 'easeInOut' },
            },
            {
                y: [0, -14, 0],
                x: [0, 8, -8, 0],
                scale: [baseScale, baseScale * 1.04, baseScale],
                transition: { duration: 0.6, ease: 'easeInOut' },
            },
            {
                y: [0, -14, 0],
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.72, ease: 'easeInOut' },
            },
        ],
        celebrating: [
            {
                y: [0, -30, 0, -15, 0],
                scale: [baseScale, baseScale * 1.1, baseScale, baseScale * 1.05, baseScale],
                rotate: [0, -8, 8, 0],
                transition: { duration: 0.6, type: 'spring', bounce: 0.5 },
            },
            {
                y: [0, -18, 0],
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.06, baseScale],
                transition: { duration: 0.72, ease: 'easeInOut' },
            },
            {
                rotate: [0, -12, 12, -10, 10, 0],
                scale: [baseScale, baseScale * 1.1, baseScale * 0.96, baseScale],
                transition: { duration: 0.68, ease: 'easeInOut' },
            },
            {
                y: [0, -22, 0, -10, 0],
                rotate: [0, 220, 360],
                scale: [baseScale, baseScale * 1.12, baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.74, ease: 'easeInOut' },
            },
        ],
        guiding: [
            {
                rotate: [0, -5, 5, -2, 0],
                scale: [baseScale, baseScale * 1.03, baseScale],
                transition: { duration: 0.5, ease: 'easeInOut' },
            },
            {
                x: [0, -8, 8, -6, 0],
                y: [0, -10, 0],
                rotate: [0, 12, -12, 0],
                transition: { duration: 0.54, ease: 'easeInOut' },
            },
            {
                y: [0, -12, 0],
                x: [0, 10, -10, 0],
                scale: [baseScale, baseScale * 1.04, baseScale],
                transition: { duration: 0.58, ease: 'easeInOut' },
            },
            {
                y: [0, -12, 0],
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.04, baseScale],
                transition: { duration: 0.68, ease: 'easeInOut' },
            },
        ],
    };
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
    const lastReactionVariantRef = useRef<Record<FuwafuwaReactionStyle, number | null>>({
        cozy: null,
        growing: null,
        sharing: null,
        celebrating: null,
        guiding: null,
    });
    const lastParticleEmojiRef = useRef<string | null>(null);

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
            ? 7
            : 5;
        const particleBatch = pickParticleBatch(reactionEmojis, particleCount, lastParticleEmojiRef.current);
        lastParticleEmojiRef.current = particleBatch.lastEmoji;
        const newParticles = Array.from({ length: particleCount }).map((_, index) => ({
            id: particleIdCounter.current++,
            x: (Math.random() - 0.5) * 84,
            y: (Math.random() - 0.5) * 84,
            emoji: particleBatch.emojis[index],
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

        const reactionVariants = getReactionVariants(baseScale);
        const reactionWeights: Record<FuwafuwaReactionStyle, readonly number[]> = {
            cozy: [35, 30, 20, 15],
            growing: [35, 30, 20, 15],
            sharing: [35, 30, 20, 15],
            celebrating: [30, 25, 25, 20],
            guiding: [35, 30, 20, 15],
        };
        const nextVariantIndex = pickWeightedIndex(
            reactionWeights[reactionStyle],
            lastReactionVariantRef.current[reactionStyle],
        );
        lastReactionVariantRef.current[reactionStyle] = nextVariantIndex;
        playReaction(reactionVariants[reactionStyle][nextVariantIndex]);
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
