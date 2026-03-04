import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAnimation } from 'framer-motion';
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

interface Props {
    user: UserProfileStore;
    sessions: SessionRecord[];
}

const EMOTION_EMOJIS = ['🎵', '✨', '💖', '🌟', '🫧'];

export const FuwafuwaCharacter: React.FC<Props> = ({ user, sessions }) => {
    const { updateUser, resetUserFuwafuwa } = useAppStore();
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
            controls.start({
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

        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            setRipple({ x, y, id: rippleIdCounter.current++ });
        }

        const newParticles = Array.from({ length: 3 }).map(() => ({
            id: particleIdCounter.current++,
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60,
            emoji: EMOTION_EMOJIS[Math.floor(Math.random() * EMOTION_EMOJIS.length)],
        }));
        const newIds = new Set(newParticles.map((particle) => particle.id));
        setParticles((previous) => [...previous, ...newParticles]);

        const timerId = window.setTimeout(() => {
            setParticles((previous) => previous.filter((particle) => !newIds.has(particle.id)));
        }, 1500);
        particleTimers.current.push(timerId);

        const random = Math.random();
        const baseScale = displayScale;

        if (random < 0.25) {
            controls.start({
                y: [0, -30, 0, -15, 0],
                scale: [baseScale, baseScale * 1.1, baseScale, baseScale * 1.05, baseScale],
                transition: { duration: 0.6, type: 'spring', bounce: 0.5 },
            });
            return;
        }

        if (random < 0.5) {
            controls.start({
                x: [0, -10, 10, -10, 10, 0],
                transition: { duration: 0.4 },
            });
            return;
        }

        if (random < 0.75) {
            controls.start({
                rotate: [0, 360],
                scale: [baseScale, baseScale * 1.2, baseScale],
                transition: { duration: 0.6, ease: 'easeInOut' },
            });
            return;
        }

        controls.start({
            scaleX: [baseScale, baseScale * 0.8, baseScale * 1.1, baseScale],
            scaleY: [baseScale, baseScale * 1.2, baseScale * 0.9, baseScale],
            transition: { duration: 0.5 },
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
                stage={status.stage}
                isSayonara={status.isSayonara}
                particles={particles}
                ripple={ripple}
                auraColor={auraColor}
                pulseDuration={pulseDuration}
                showFireflies={showFireflies}
            />

            <FuwafuwaStatusPill
                stage={status.stage}
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
