import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX } from 'lucide-react';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { BreakModal } from '../components/BreakModal';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';
import { useAppStore } from '../store/useAppStore';
import { getExerciseColor, generateSession, getReplacementExercise, EXERCISES, type Exercise } from '../data/exercises';
import { saveSession, getTodayKey, getSessionsByDate, getCustomExercises, type SessionRecord } from '../lib/db';

export const StretchSession: React.FC = () => {
    const endSession = useAppStore((state) => state.endSession);
    const classLevel = useAppStore((state) => state.classLevel);
    const sessionExerciseIds = useAppStore((state) => state.sessionExerciseIds);

    const [isLoading, setIsLoading] = useState(true);
    const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);

    useEffect(() => {
        const loadSession = async () => {
            if (!sessionExerciseIds) {
                const todaySessions = await getSessionsByDate(getTodayKey());
                const todaySkippedIds = todaySessions.flatMap(s => s.skippedIds);
                setSessionExercises(generateSession(classLevel, todaySkippedIds));
                setIsLoading(false);
                return;
            }

            const customExList = await getCustomExercises();
            // Combine presets and custom
            const allExercises = [...EXERCISES, ...customExList];

            const resolved = sessionExerciseIds
                .map(id => allExercises.find(e => e.id === id))
                .filter((e): e is Exercise => e !== undefined);

            setSessionExercises(resolved);
            setIsLoading(false);
        };
        loadSession();
    }, [sessionExerciseIds, classLevel]);
    const [isCounting, setIsCounting] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [timeLeft, setTimeLeft] = useState(30);
    const [startedAt] = useState(() => new Date().toISOString());
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [skippedIds, setSkippedIds] = useState<string[]>([]);

    // Transition state
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionTime, setTransitionTime] = useState(3);

    // Break state
    const [isBigBreak, setIsBigBreak] = useState(false);
    const [totalRunningTime, setTotalRunningTime] = useState(0);

    // Left/Right side tracking for R→L exercises
    const [currentSide, setCurrentSide] = useState<'right' | 'left' | null>(null);
    const [showSideSwitch, setShowSideSwitch] = useState(false);

    // Bounce state for swipe limit
    const [showBounce, setShowBounce] = useState(false);

    const [isCompleted, setIsCompleted] = useState(false);

    // Audio Mute Toggle
    const [isMuted, setIsMuted] = useState(audio.getMuted());
    const toggleMute = () => {
        audio.toggleMute();
        setIsMuted(audio.getMuted());
    };

    // Track first stretch index of "today" for down-swipe limit
    const firstTodayIndex = 0;

    // Set initial time when exercises are loaded
    useEffect(() => {
        if (!isLoading && sessionExercises.length > 0) {
            setTimeLeft(sessionExercises[0].sec);
        }
    }, [isLoading, sessionExercises]);

    const currentExercise = sessionExercises[currentIndex];
    const progress = currentExercise ? timeLeft / currentExercise.sec : 0;

    // Check if exercise has L/R split
    const hasLRSplit = currentExercise?.internal?.includes('→') || currentExercise?.hasSplit || false;
    const isPointFlex = currentExercise?.internal === 'P10・F10×3';
    const halfTime = currentExercise ? Math.floor(currentExercise.sec / 2) : 0;

    let phaseTimeLeft = 0;
    if (isPointFlex) {
        phaseTimeLeft = (timeLeft - 1) % 10 + 1;
    } else if (hasLRSplit && halfTime > 0) {
        phaseTimeLeft = (timeLeft - 1) % halfTime + 1;
    }

    // L/R side tracking & P10/F10 tracking
    useEffect(() => {
        if (!currentExercise) return;

        const elapsed = currentExercise.sec - timeLeft;

        // Periodic 10s beeps for any exercise (except last 3s countdown)
        if (elapsed > 0 && elapsed % 10 === 0 && timeLeft > 3 && !isTransitioning && !isCounting) {
            audio.playTick(); // soft beep every 10s
        }

        if (isPointFlex) {
            // 10s intervals: 0-9 P, 10-19 F, 20-29 P, 30-39 F...
            const intervalIndex = Math.floor(elapsed / 10);
            const isPoint = intervalIndex % 2 === 0;

            // Show switch notification exactly at the 10s boundaries
            if (elapsed > 0 && elapsed % 10 === 0) {
                audio.speak('チェンジ');
                haptics.pulse();
                setShowSideSwitch(true);
                const timer = setTimeout(() => setShowSideSwitch(false), 2000);
                setCurrentSide(isPoint ? 'right' : 'left'); // abuse right/left for Point/Flex internally
                return () => clearTimeout(timer);
            } else {
                setCurrentSide(isPoint ? 'right' : 'left');
            }
            return;
        }

        if (!hasLRSplit) return;

        if (elapsed < halfTime) {
            setCurrentSide('right');
            setShowSideSwitch(false);
        } else if (elapsed === halfTime) {
            audio.speak('はんたいがわへ');
            haptics.pulse();
            setCurrentSide('left');
            setShowSideSwitch(true);
            // Auto-hide after 2 seconds
            const timer = setTimeout(() => setShowSideSwitch(false), 2000);
            return () => clearTimeout(timer);
        } else {
            if (currentSide !== 'left') setCurrentSide('left');
        }
    }, [timeLeft, hasLRSplit, currentExercise, halfTime]);

    // Reset side when moving to new exercise
    useEffect(() => {
        setCurrentSide(hasLRSplit ? 'right' : null);
        setShowSideSwitch(false);
    }, [currentIndex, hasLRSplit]);

    // Save session on end
    const handleEndSession = useCallback(async () => {
        if (completedIds.length > 0 || totalRunningTime > 0) {
            const record: SessionRecord = {
                id: `session-${Date.now()}`,
                date: getTodayKey(),
                startedAt,
                totalSeconds: totalRunningTime,
                exerciseIds: completedIds,
                skippedIds,
            };
            await saveSession(record);
        }
        endSession();
    }, [completedIds, skippedIds, totalRunningTime, startedAt, endSession]);

    // Main playback timer
    useEffect(() => {
        if (isCounting || !isPlaying || isTransitioning || isBigBreak || isCompleted || !currentExercise) return;

        if (timeLeft <= 0) {
            const nextTotalTime = totalRunningTime + currentExercise.sec;
            setTotalRunningTime(nextTotalTime);
            setCompletedIds(prev => [...prev, currentExercise.id]);

            // Big break every ~15 min (900 sec)
            const BIG_BREAK_THRESHOLD = 900;
            const previousMultiple = Math.floor(totalRunningTime / BIG_BREAK_THRESHOLD);
            const currentMultiple = Math.floor(nextTotalTime / BIG_BREAK_THRESHOLD);

            if (currentMultiple > previousMultiple) {
                audio.playSuccess();
                setIsBigBreak(true);
                return;
            }

            // Small break every ~5 min (300 sec) — just a short visual pause
            const SMALL_BREAK_THRESHOLD = 300;
            const prevSmall = Math.floor(totalRunningTime / SMALL_BREAK_THRESHOLD);
            const currSmall = Math.floor(nextTotalTime / SMALL_BREAK_THRESHOLD);
            const isSmallBreak = currSmall > prevSmall && currentMultiple === previousMultiple;

            // Auto-transition (with slightly longer delay for small break)
            audio.playTransition();
            haptics.pulse();
            const nextEx = sessionExercises[currentIndex + 1];
            if (nextEx) {
                audio.speak(`次は、${nextEx.name}です`);
            }
            setIsTransitioning(true);
            setTransitionTime(isSmallBreak ? 5 : 3);
            return;
        }

        if (timeLeft === 10) {
            audio.speak('残り10秒です');
        }

        if (timeLeft > 0 && timeLeft <= 3) {
            audio.playTick();
            haptics.tick();
        }

        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, isCounting, isPlaying, isTransitioning, isBigBreak, totalRunningTime, currentExercise, currentIndex, sessionExercises]);

    // Transition timer
    useEffect(() => {
        if (!isTransitioning) return;
        if (transitionTime <= 0) {
            audio.playGo();
            goToNext();
            return;
        }
        if (transitionTime > 0 && transitionTime <= 3) {
            audio.playTick();
        }
        const timer = setTimeout(() => setTransitionTime(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [transitionTime, isTransitioning]);

    // Background / visibility change detection (spec §3.8)
    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                setIsPlaying(false);
            } else if (document.visibilityState === 'visible') {
                // Restart from beginning with countdown (spec §3.8)
                if (currentExercise) {
                    setTimeLeft(currentExercise.sec);
                    setIsCounting(true);
                    setIsTransitioning(false);
                    audio.speak(`再開します。${currentExercise.name}`);
                }
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [currentExercise]);

    const goToNext = () => {
        setIsTransitioning(false);
        const nextIdx = currentIndex + 1;
        if (nextIdx >= sessionExercises.length) {
            // All exercises done → show completion
            audio.playSuccess();
            haptics.success();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FFD5C8', '#2BBAA0', '#FFF5F0', '#B8E6D4'],
                disableForReducedMotion: true
            });
            setIsCompleted(true);
            setIsPlaying(false);
            // Auto-end after 3 seconds
            setTimeout(() => handleEndSession(), 3000);
            return;
        }
        setCurrentIndex(nextIdx);
        setTimeLeft(sessionExercises[nextIdx].sec);
        setIsPlaying(true);
    };

    // Up swipe = skip/next (spec §1.4: skip is just "changing the flow")
    const handleSwipeUp = () => {
        if (isCounting) {
            // During countdown: skip countdown and start immediately (spec §3.2)
            setIsCounting(false);
            if (currentExercise) audio.speak(`最初は、${currentExercise.name}です`);
            return;
        }
        if (isTransitioning) {
            // During transition: start next immediately (spec §3.3)
            goToNext();
            return;
        }
        if (currentExercise) {
            setSkippedIds(prev => [...prev, currentExercise.id]);

            // If it's an auto-generated session, append a replacement
            if (!sessionExerciseIds) {
                const currentIds = sessionExercises.map(e => e.id);
                const replacement = getReplacementExercise(classLevel, [...currentIds, ...skippedIds, currentExercise.id], currentExercise.sec);
                if (replacement) {
                    setSessionExercises(prev => {
                        const cores = prev.filter(e => e.type === 'core');
                        const stretches = prev.filter(e => e.type === 'stretch');
                        return [...stretches, replacement, ...cores];
                    });
                }
            }
        }

        setIsTransitioning(false);
        // Wait, since we might have just appended an exercise, sessionExercises.length is staled in this closure if we look at it directly.
        // But React state updates aren't synchronous. To safely go to next:
        // We can just call goToNext() instead of duplicating the logic, because goToNext also checks length.
        goToNext();
    };

    // Down swipe = go back (spec §3.5: today only, bounce at start)
    const handleSwipeDown = () => {
        if (currentIndex <= firstTodayIndex) {
            // At the start — show bounce (spec §3.5)
            setShowBounce(true);
            setTimeout(() => setShowBounce(false), 400);
            return;
        }
        setIsTransitioning(false);
        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx);
        setTimeLeft(sessionExercises[prevIdx].sec);
        setIsPlaying(true);
    };

    // Tap = play/pause toggle (spec §3.1)
    const handleTap = () => {
        if (isCounting) {
            // During countdown: stop (spec §3.2)
            setIsCounting(false);
            setIsPlaying(false);
            return;
        }
        if (isTransitioning) {
            // During transition: stop at preview (spec §3.3)
            setIsTransitioning(false);
            setIsPlaying(false);
            return;
        }
        if (!isBigBreak) {
            setIsPlaying(!isPlaying);
        }
    };

    const handleDragEnd = (_e: any, { offset }: any) => {
        const swipeThreshold = 50;
        if (offset.y < -swipeThreshold) handleSwipeUp();
        else if (offset.y > swipeThreshold) handleSwipeDown();
    };

    const handleContinueBlock = () => {
        setIsBigBreak(false);
        setIsTransitioning(true);
        setTransitionTime(3);
    };

    if (isLoading) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'linear-gradient(165deg, #FFD5C8 0%, #B8E6D4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, color: '#2D3436' }}>
                    準備中...
                </span>
            </div>
        );
    }

    if (sessionExercises.length === 0) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 100,
                background: 'linear-gradient(165deg, #FFD5C8 0%, #B8E6D4 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
            }}>
                <span style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 16, color: '#2D3436' }}>
                    種目が見つかりませんでした
                </span>
                <button
                    onClick={() => endSession()}
                    style={{
                        padding: '12px 24px',
                        borderRadius: 99,
                        border: 'none',
                        background: 'white',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    もどる
                </button>
            </div>
        );
    }

    if (!currentExercise && !isCompleted) return null;

    // Completion screen
    if (isCompleted) {
        const minutes = Math.floor(totalRunningTime / 60);
        return (
            <div className="stretch-session">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        background: 'linear-gradient(165deg, #E8F8F0 0%, #FFE5D9 100%)',
                    }}
                >
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                        style={{ fontSize: 64 }}
                    >
                        🌸
                    </motion.span>
                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        おつかれさま
                    </h2>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#8395A7',
                    }}>
                        {minutes > 0 ? `${minutes}分がんばったね` : 'がんばったね'}
                    </p>
                </motion.div>
            </div>
        );
    }

    // Timer ring calculations
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);
    const bgColor = getExerciseColor(currentExercise.id);

    return (
        <div className="stretch-session">
            <AnimatePresence>
                {isCounting && (
                    <CountdownOverlay key="countdown" onComplete={() => {
                        setIsCounting(false);
                        haptics.pulse();
                        if (currentExercise) audio.speak(`最初は、${currentExercise.name}です`);
                    }} />
                )}
                {isBigBreak && (
                    <BreakModal key="break-modal" onContinue={handleContinueBlock} />
                )}
            </AnimatePresence>

            {/* Close button */}
            <button
                onClick={handleEndSession}
                style={{
                    position: 'absolute',
                    top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
                    right: 16,
                    zIndex: 60,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2D3436',
                }}
            >
                <X size={20} />
            </button>

            {/* Volume toggle button */}
            <button
                onClick={toggleMute}
                style={{
                    position: 'absolute',
                    top: 'calc(env(safe-area-inset-top, 16px) + 12px)',
                    right: 64,
                    zIndex: 60,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.4)',
                    backdropFilter: 'blur(8px)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2D3436',
                }}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Bounce indicator for down-swipe at start */}
            <AnimatePresence>
                {showBounce && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: 80,
                            left: 0,
                            right: 0,
                            textAlign: 'center',
                            zIndex: 60,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#8395A7',
                            padding: '8px 16px',
                        }}
                    >
                        ここが今日のはじめです
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Scroller */}
            <motion.div
                style={{ width: '100%', height: '100%', position: 'relative' }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onClick={handleTap}
            >
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentExercise.id + '-' + currentIndex}
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -60 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 20,
                            background: `linear-gradient(165deg, ${bgColor} 0%, white 100%)`,
                        }}
                    >
                        {/* PAUSE overlay — spec §5.2: darkened + play icon */}
                        {!isPlaying && !isTransitioning && !isBigBreak && !isCounting && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: 'rgba(0, 0, 0, 0.35)',
                                    zIndex: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <div style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.25)',
                                    backdropFilter: 'blur(8px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 32,
                                    color: 'white',
                                }}>
                                    ▶
                                </div>
                            </motion.div>
                        )}

                        {/* Emoji + name */}
                        <div style={{ zIndex: 20, textAlign: 'center' }}>
                            <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>
                                {currentExercise.emoji}
                            </span>
                            <h2 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 28,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>
                                {currentExercise.name}
                            </h2>

                            {/* Interval Indicator (L/R or Point/Flex) */}
                            {(hasLRSplit || isPointFlex) && currentSide && (
                                <p style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: '#2BBAA0',
                                    marginTop: 8,
                                    background: 'rgba(43, 186, 160, 0.1)',
                                    padding: '4px 16px',
                                    borderRadius: 20,
                                    display: 'inline-block',
                                }}>
                                    {isPointFlex
                                        ? (currentSide === 'right' ? '🩰 ポイント (つま先伸ばす)' : '🦶 フレックス (かかと押し出す)')
                                        : (currentSide === 'right' ? '▶ みぎ' : '◀ ひだり')
                                    }
                                </p>
                            )}
                        </div>

                        {/* Side switch notification */}
                        <AnimatePresence>
                            {showSideSwitch && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={{
                                        position: 'absolute',
                                        top: '30%',
                                        zIndex: 30,
                                        background: 'rgba(43, 186, 160, 0.9)',
                                        color: 'white',
                                        padding: '12px 24px',
                                        borderRadius: 16,
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 18,
                                        fontWeight: 700,
                                        boxShadow: '0 4px 16px rgba(43, 186, 160, 0.4)',
                                    }}
                                >
                                    {isPointFlex ? 'チェンジ！ 🔄' : 'はんたいがわへ ◀'}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Timer ring */}
                        <div style={{ position: 'relative', zIndex: 20 }}>
                            <svg width="200" height="200" viewBox="0 0 200 200" className="progress-ring">
                                <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
                                <circle
                                    cx="100" cy="100" r={radius}
                                    fill="none"
                                    stroke="#2BBAA0"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    className="progress-ring__circle"
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <span style={{
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: 48,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    lineHeight: 1,
                                }}>
                                    {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                                </span>
                                {(hasLRSplit || isPointFlex) && (
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#8395A7',
                                        marginTop: 8,
                                    }}>
                                        切替まで {phaseTimeLeft}秒
                                    </span>
                                )}
                            </div>
                        </div>


                    </motion.div>
                </AnimatePresence>

                {/* Transition Overlay */}
                <AnimatePresence>
                    {isTransitioning && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 30,
                                background: 'rgba(255,255,255,0.95)',
                                backdropFilter: 'blur(20px)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                            }}
                        >
                            <p style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 14,
                                color: '#B2BEC3',
                                letterSpacing: 3,
                            }}>NEXT</p>
                            <span style={{ fontSize: 36 }}>
                                {sessionExercises[(currentIndex + 1) % sessionExercises.length].emoji}
                            </span>
                            <h2 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 28,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>
                                {sessionExercises[(currentIndex + 1) % sessionExercises.length].name}
                            </h2>
                            <div style={{
                                width: 52,
                                height: 52,
                                borderRadius: '50%',
                                border: '3px solid #2BBAA0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 22,
                                fontWeight: 700,
                                color: '#2BBAA0',
                                marginTop: 8,
                            }}>
                                {transitionTime}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Swipe hint — spec §3.6: always visible */}
                <div style={{
                    position: 'absolute',
                    bottom: 40,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 40,
                    pointerEvents: 'none',
                    opacity: 0.4,
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}>
                        <span>↑</span>
                        <span>次へ</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
