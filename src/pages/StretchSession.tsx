import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Play, Pause, SkipForward } from 'lucide-react';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { BreakModal } from '../components/BreakModal';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';
import { useAppStore } from '../store/useAppStore';
import { getExerciseColor, generateSession, getReplacementExercise, EXERCISES, type Exercise } from '../data/exercises';
import { ExerciseIcon } from '../components/ExerciseIcon';
import { saveSession, getTodayKey, getCustomExercises, getAllSessions, type SessionRecord } from '../lib/db';

export const StretchSession: React.FC = () => {
    const endSession = useAppStore((state) => state.endSession);
    const users = useAppStore((state) => state.users);
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const sessionExerciseIds = useAppStore((state) => state.sessionExerciseIds);

    const currentUsers = users.filter(u => sessionUserIds.includes(u.id));
    const classLevel = currentUsers.length > 0
        ? currentUsers.reduce((min, u) => {
            const weights: Record<'プレ' | '初級' | '中級' | '上級', number> = { 'プレ': 0, '初級': 1, '中級': 2, '上級': 3 };
            return weights[u.classLevel] < weights[min] ? u.classLevel : min;
        }, currentUsers[0].classLevel)
        : '初級';

    const dailyTargetMinutes = currentUsers.reduce((sum, u) => sum + (u.dailyTargetMinutes ?? 10), 0);
    const globalExcludedIds = Array.from(new Set(currentUsers.flatMap(u => u.excludedExercises || ['C01', 'C02'])));
    const globalRequiredIds = Array.from(new Set(currentUsers.flatMap(u => u.requiredExercises || ['S01', 'S02', 'S07'])));

    const [isLoading, setIsLoading] = useState(true);
    const [sessionExercises, setSessionExercises] = useState<Exercise[]>([]);

    useEffect(() => {
        const loadSession = async () => {
            try {
                const customExList = await getCustomExercises();
                // Combine presets and custom
                const allExercises = [...EXERCISES, ...customExList];

                if (!sessionExerciseIds) {
                    const allSessions = await getAllSessions();

                    // Count historcal usage overall for all sessions (to prioritize unplayed ones)
                    const historcalCounts: Record<string, number> = {};
                    allSessions.forEach((s: SessionRecord) => {
                        if (!s.userIds || s.userIds.some((u: string) => sessionUserIds.includes(u))) {
                            s.exerciseIds.forEach((id: string) => {
                                historcalCounts[id] = (historcalCounts[id] || 0) + 1;
                            });
                        }
                    });

                    const todaySessions = allSessions.filter((s: SessionRecord) => s.date === getTodayKey());
                    // Exclude exercises that were completely done or skipped today, PLUS user global exclusions
                    const todayExcludedIds = Array.from(new Set([
                        ...todaySessions.flatMap((s: SessionRecord) => [...s.exerciseIds, ...s.skippedIds]),
                        ...globalExcludedIds
                    ]));

                    setSessionExercises(generateSession(classLevel, {
                        excludedIds: todayExcludedIds,
                        requiredIds: globalRequiredIds,
                        targetSeconds: dailyTargetMinutes * 60,
                        customPool: customExList as any as Exercise[],
                        historcalCounts
                    }));
                    return;
                }

                const resolved = sessionExerciseIds
                    .map(id => allExercises.find(e => e.id === id))
                    .filter((e): e is Exercise => e !== undefined);

                setSessionExercises(resolved);
            } catch (err) {
                console.error("Failed to load session:", err);
                // Fallback to empty session if error occurs
                setSessionExercises([]);
            } finally {
                setIsLoading(false);
            }
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
    const [isCompleted, setIsCompleted] = useState(false);

    // Handle BGM Playback based on playing/counting state
    useEffect(() => {
        if (!isLoading && !isCounting && isPlaying && !isCompleted) {
            audio.startBGM(2.0); // 2-second fade in
        } else {
            audio.stopBGM(1.0); // 1-second fade out when paused/stopped
        }

        return () => {
            audio.stopBGM(1.0);
        };
    }, [isLoading, isCounting, isPlaying, isCompleted]);

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

        if (isCounting) return; // Prevent any "change" audio during the initial 5s countdown

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
        let finalRunningTime = totalRunningTime;

        // If it's an auto-generated session (omakase) and fully completed, force 100% of the daily target
        if (!sessionExerciseIds && isCompleted) {
            finalRunningTime = Math.max(totalRunningTime, dailyTargetMinutes * 60);
        }

        if (completedIds.length > 0 || finalRunningTime > 0) {
            const record: SessionRecord = {
                id: `session-${Date.now()}`,
                date: getTodayKey(),
                startedAt,
                totalSeconds: finalRunningTime,
                exerciseIds: completedIds,
                skippedIds,
                userIds: sessionUserIds,
            };
            await saveSession(record);
        }
        endSession();
    }, [completedIds, skippedIds, totalRunningTime, startedAt, endSession, sessionUserIds, sessionExerciseIds, isCompleted, dailyTargetMinutes]);

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
                setIsPlaying(false); // Pause session (and BGM via useEffect)
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
                audio.speak(`次は、${nextEx.reading || nextEx.name}です`);
            }
            setIsTransitioning(true);
            setTransitionTime(isSmallBreak ? 5 : 3);
            return;
        }

        if (timeLeft === 10) {
            audio.speak('残り10秒です');
        }

        if (timeLeft > 0 && timeLeft <= 5) {
            audio.speak(timeLeft.toString());
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
                // Resume with countdown
                if (currentExercise && isPlaying) {
                    // Only speak and trigger countdown if we were actually playing before
                    setIsCounting(true);
                    setIsTransitioning(false);
                    audio.speak(`再開します。`);
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
            if (currentExercise) audio.speak(`最初は、${currentExercise.reading || currentExercise.name}です`);
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
        setIsPlaying(true); // Resume playing (and BGM via useEffect)
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
            {/* Total Progress Bar */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'rgba(0,0,0,0.05)',
                zIndex: 65,
            }}>
                <motion.div
                    style={{
                        height: '100%',
                        background: '#2BBAA0',
                        originX: 0,
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: sessionExercises.length > 0 ? currentIndex / sessionExercises.length : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </div>

            <AnimatePresence>
                {isCounting && (
                    <CountdownOverlay key="countdown" onComplete={() => {
                        setIsCounting(false);
                        haptics.pulse();
                        if (currentExercise) audio.speak(`最初は、${currentExercise.reading || currentExercise.name}です`);
                    }} firstExercise={currentExercise || undefined} />
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
                    color: '#2D4741',
                }}
            >
                <X size={20} />
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
                            overflow: 'hidden',
                        }}
                    >
                        {/* Breathing Background Glow */}
                        <motion.div
                            animate={{ opacity: [0, 0.4, 0] }}
                            transition={{ duration: 8, ease: "easeInOut", repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                background: `radial-gradient(circle at center, ${bgColor} 0%, transparent 70%)`,
                                zIndex: 1,
                            }}
                        />

                        {/* PAUSE overlay — spec §5.2: darkened + pause icon */}
                        <AnimatePresence>
                            {!isPlaying && !isTransitioning && !isBigBreak && !isCounting && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        zIndex: 30,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                    }}
                                >
                                    <div style={{
                                        fontFamily: "'Outfit', sans-serif",
                                        letterSpacing: 4,
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: '#2D4741',
                                        marginBottom: 16,
                                    }}>
                                        PAUSED
                                    </div>
                                    <div style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 700,
                                        color: '#8395A7',
                                    }}>
                                        一時停止中
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Emoji + name */}
                        <div style={{ zIndex: 20, textAlign: 'center' }}>
                            <div style={{
                                width: 100,
                                height: 100,
                                margin: '0 auto 16px',
                                background: 'white',
                                borderRadius: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                            }}>
                                <ExerciseIcon
                                    id={currentExercise.id}
                                    emoji={currentExercise.emoji}
                                    size={64}
                                    color={getExerciseColor(currentExercise.type)}
                                />
                            </div>
                            <h2 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 28,
                                fontWeight: 700,
                                color: '#2D4741',
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
                                        bottom: '22%',
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
                                    color: '#2D4741',
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

                            <div style={{
                                width: 80,
                                height: 80,
                                background: 'white',
                                borderRadius: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                                marginBottom: 16,
                            }}>
                                <ExerciseIcon
                                    id={sessionExercises[(currentIndex + 1) % sessionExercises.length].id}
                                    emoji={sessionExercises[(currentIndex + 1) % sessionExercises.length].emoji}
                                    size={48}
                                    color={getExerciseColor(sessionExercises[(currentIndex + 1) % sessionExercises.length].type)}
                                />
                            </div>
                            <h2 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 28,
                                fontWeight: 700,
                                color: '#2D4741',
                            }}>
                                {sessionExercises[(currentIndex + 1) % sessionExercises.length].name}
                            </h2>
                            {sessionExercises[(currentIndex + 1) % sessionExercises.length].hasSplit && (
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    color: '#81ECEC',
                                    fontWeight: 700,
                                    background: 'rgba(129, 236, 236, 0.15)',
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                    marginTop: -8,
                                }}>
                                    左右あり
                                </div>
                            )}
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
                    top: 80,
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 40,
                    pointerEvents: 'none',
                    opacity: 0.2, // dimmer since we have a button now
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
                        <span>スワイプでも次へ</span>
                    </div>
                </div>
            </motion.div>

            {/* Bottom Floating Control Bar */}
            <motion.div
                initial={{ y: 100, opacity: 0, x: '-50%' }}
                animate={{ y: 0, opacity: 1, x: '-50%' }}
                style={{
                    position: 'absolute',
                    bottom: 'calc(env(safe-area-inset-bottom, 24px) + 24px)',
                    left: '50%',
                    zIndex: 80,
                    background: 'rgba(255, 255, 255, 0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: 99,
                    padding: '8px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 32,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    border: '1px solid rgba(255,255,255,0.6)',
                }}
            >
                {/* Mute Toggle */}
                <button
                    onClick={(e) => { e.stopPropagation(); toggleMute(); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isMuted ? '#B2BEC3' : '#2D3436',
                        padding: 8,
                    }}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                {/* Play/Pause */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleTap(); }}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: '#2BBAA0',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(43, 186, 160, 0.3)',
                    }}
                >
                    {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 4 }} />}
                </button>

                {/* Skip */}
                <button
                    onClick={(e) => { e.stopPropagation(); handleSwipeUp(); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2D3436',
                        padding: 8,
                    }}
                >
                    <SkipForward size={24} />
                </button>
            </motion.div>
        </div >
    );
};
