import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownOverlay } from '../components/CountdownOverlay';
import { BreakModal } from '../components/BreakModal';

// Mock Data
const STRETCHES = [
    { id: 'S01', name: '開脚', sec: 30, color: 'bg-rose-900/40' },
    { id: 'S02', name: '前屈', sec: 30, color: 'bg-blue-900/40' },
    { id: 'S03', name: '前後開脚', sec: 60, color: 'bg-emerald-900/40' },
    { id: 'S04', name: 'ブリッジ', sec: 30, color: 'bg-purple-900/40' },
];

export const Home: React.FC = () => {
    const [isCounting, setIsCounting] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [timeLeft, setTimeLeft] = useState(STRETCHES[0].sec);

    // Transition state
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [transitionTime, setTransitionTime] = useState(3);

    // Big break state
    const [isBigBreak, setIsBigBreak] = useState(false);
    const [totalRunningTime, setTotalRunningTime] = useState(0);

    const currentStretch = STRETCHES[currentIndex];

    // Main playback timer
    useEffect(() => {
        if (isCounting || !isPlaying || isTransitioning || isBigBreak) return;

        if (timeLeft <= 0) {
            // Small break or Big break logic
            const nextTotalTime = totalRunningTime + currentStretch.sec;
            setTotalRunningTime(nextTotalTime);

            // Check for big break (e.g. 15 mins -> 900 seconds)
            // For testing, we use 60 seconds (1 minute) as a big break
            const BIG_BREAK_THRESHOLD = 900;

            // We check if crossing a multiple of the threshold
            const previousMultiple = Math.floor(totalRunningTime / BIG_BREAK_THRESHOLD);
            const currentMultiple = Math.floor(nextTotalTime / BIG_BREAK_THRESHOLD);

            if (currentMultiple > previousMultiple) {
                setIsBigBreak(true);
                return;
            }

            // Small break implicitly handled by transition (3 seconds)
            setIsTransitioning(true);
            setTransitionTime(3);
            return;
        }

        const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, isCounting, isPlaying, isTransitioning, isBigBreak, totalRunningTime, currentStretch.sec]);

    // Transition timer
    useEffect(() => {
        if (!isTransitioning) return;

        if (transitionTime <= 0) {
            // Go to next stretch
            handleNext();
            return;
        }

        const timer = setTimeout(() => setTransitionTime(t => t - 1), 1000);
        return () => clearTimeout(timer);
    }, [transitionTime, isTransitioning]);

    const handleNext = () => {
        setIsTransitioning(false);
        const nextIdx = (currentIndex + 1) % STRETCHES.length;
        setCurrentIndex(nextIdx);
        setTimeLeft(STRETCHES[nextIdx].sec);
        setIsPlaying(true);
    };

    const handlePrev = () => {
        if (currentIndex === 0) return; // Can't go back past first of today
        setIsTransitioning(false);
        const prevIdx = currentIndex - 1;
        setCurrentIndex(prevIdx);
        setTimeLeft(STRETCHES[prevIdx].sec);
        setIsPlaying(true);
    };

    // Drag handlers for vertical TikTok-style swipe
    const handleDragEnd = (_e: any, { offset }: any) => {
        const swipeThreshold = 50;
        if (offset.y < -swipeThreshold) {
            // Swipe Up -> Next
            handleNext();
        } else if (offset.y > swipeThreshold) {
            // Swipe Down -> Prev
            handlePrev();
        }
    };

    const handleContinueBlock = () => {
        setIsBigBreak(false);
        setIsTransitioning(true);
        setTransitionTime(3);
    };

    return (
        <div className="w-full h-full relative overflow-hidden bg-slate-950 text-white font-sans">
            <AnimatePresence>
                {isCounting && (
                    <CountdownOverlay
                        key="countdown"
                        onComplete={() => {
                            setIsCounting(false);
                        }}
                    />
                )}

                {isBigBreak && (
                    <BreakModal
                        key="break-modal"
                        onContinue={handleContinueBlock}
                    />
                )}
            </AnimatePresence>

            {/* Main Scroller Area */}
            <motion.div
                className="w-full h-full relative"
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                onClick={() => !isTransitioning && !isBigBreak && setIsPlaying(!isPlaying)}
            >
                <AnimatePresence mode="popLayout">
                    <motion.div
                        key={currentStretch.id}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute inset-0 flex flex-col items-center justify-center ${currentStretch.color}`}
                    >
                        {/* Dark overlay when paused */}
                        {!isPlaying && !isTransitioning && !isBigBreak && (
                            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center text-6xl text-white/50">
                                ▶
                            </div>
                        )}

                        <h2 className="text-4xl font-bold mb-4 drop-shadow-md z-20">{currentStretch.name}</h2>
                        <div className="text-6xl font-black font-mono tracking-tighter drop-shadow-lg z-20">
                            00:{timeLeft.toString().padStart(2, '0')}
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
                            className="absolute inset-0 bg-slate-900/95 z-30 flex flex-col items-center justify-center gap-6"
                        >
                            <h3 className="text-2xl text-slate-400">Next...</h3>
                            <h2 className="text-5xl font-bold text-white drop-shadow-lg">
                                {STRETCHES[(currentIndex + 1) % STRETCHES.length].name}
                            </h2>
                            <div className="w-16 h-16 rounded-full border-4 border-sky-500 flex items-center justify-center text-2xl font-bold text-sky-400 mt-4">
                                {transitionTime}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Swipe Hint */}
                <div className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+80px)] w-full flex justify-center z-40 pointer-events-none opacity-50">
                    <div className="flex flex-col items-center animate-bounce text-sm">
                        <span>↑</span>
                        <span>次へ</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
