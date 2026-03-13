import React from 'react';
import { motion } from 'framer-motion';
import { getExerciseColor, type Exercise } from '../../data/exercises';
import { ExercisePanel } from './ExercisePanel';
import { TransitionOverlay } from './TransitionOverlay';

interface MainScrollerProps {
    activeExercise: Exercise;
    currentIndex: number;
    isPlaying: boolean;
    isTransitioning: boolean;
    isBigBreak: boolean;
    isCounting: boolean;
    hasLRSplit: boolean;
    isPointFlex: boolean;
    currentSide: 'right' | 'left' | null;
    showSideSwitch: boolean;
    radius: number;
    circumference: number;
    dashOffset: number;
    timeLeft: number;
    phaseTimeLeft: number;
    sessionExercises: Exercise[];
    transitionTime: number;
    onDragEnd: (_e: unknown, info: { offset: { y: number } }) => void;
    onTap: () => void;
}

export const MainScroller: React.FC<MainScrollerProps> = ({
    activeExercise,
    currentIndex,
    isPlaying,
    isTransitioning,
    isBigBreak,
    isCounting,
    hasLRSplit,
    isPointFlex,
    currentSide,
    showSideSwitch,
    radius,
    circumference,
    dashOffset,
    timeLeft,
    phaseTimeLeft,
    sessionExercises,
    transitionTime,
    onDragEnd,
    onTap,
}) => {
    const bgColor = getExerciseColor(activeExercise.id);
    const nextExercise = sessionExercises[currentIndex + 1];

    return (
        <motion.div
            style={{ width: '100%', height: '100%', position: 'relative' }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            onClick={onTap}
        >
            <ExercisePanel
                activeExercise={activeExercise}
                currentIndex={currentIndex}
                bgColor={bgColor}
                isPlaying={isPlaying}
                isTransitioning={isTransitioning}
                isBigBreak={isBigBreak}
                isCounting={isCounting}
                hasLRSplit={hasLRSplit}
                isPointFlex={isPointFlex}
                currentSide={currentSide}
                showSideSwitch={showSideSwitch}
                radius={radius}
                circumference={circumference}
                dashOffset={dashOffset}
                timeLeft={timeLeft}
                phaseTimeLeft={phaseTimeLeft}
                nextExercise={nextExercise}
            />

            <TransitionOverlay
                isTransitioning={isTransitioning}
                nextExercise={nextExercise}
                transitionTime={transitionTime}
            />
        </motion.div>
    );
};
