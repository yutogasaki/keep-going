import { describe, expect, it } from 'vitest';
import { getExerciseCompletionState, getPhaseTimeLeft, getSessionSideCue } from '../sessionProgressHelpers';
import type { Exercise } from '../../../data/exercises';

const baseExercise: Exercise = {
    id: 'S03',
    name: '前後開脚',
    sec: 60,
    placement: 'stretch',
    internal: 'R30→L30',
    classes: ['初級'],
    priority: 'medium',
    emoji: '🩰',
    hasSplit: true,
};

describe('sessionProgressHelpers', () => {
    it('computes phase time left for point-flex and split exercises', () => {
        expect(getPhaseTimeLeft({ timeLeft: 37, isPointFlex: true, hasLRSplit: true, halfTime: 30 })).toBe(7);
        expect(getPhaseTimeLeft({ timeLeft: 22, isPointFlex: false, hasLRSplit: true, halfTime: 30 })).toBe(22);
        expect(getPhaseTimeLeft({ timeLeft: 0, isPointFlex: false, hasLRSplit: false, halfTime: 0 })).toBe(0);
    });

    it('returns a side-switch cue at the halfway point', () => {
        const cue = getSessionSideCue({
            currentExercise: baseExercise,
            timeLeft: 30,
            hasLRSplit: true,
            isPointFlex: false,
            halfTime: 30,
        });

        expect(cue).toEqual({
            currentSide: 'left',
            announcement: 'はんたいがわへ',
            showSideSwitch: true,
            hideDelayMs: 2000,
        });
    });

    it('treats threshold crossings as big or small breaks', () => {
        const bigBreak = getExerciseCompletionState({
            currentExercise: baseExercise,
            totalRunningTime: 870,
        });
        const smallBreak = getExerciseCompletionState({
            currentExercise: baseExercise,
            totalRunningTime: 270,
            nextExercise: {
                ...baseExercise,
                id: 'S04',
                name: 'ブリッジ',
                reading: 'ぶりっじ',
            },
        });

        expect(bigBreak.breakType).toBe('big');
        expect(bigBreak.shouldPulseTransition).toBe(false);
        expect(smallBreak.breakType).toBe('small');
        expect(smallBreak.transitionSeconds).toBe(5);
        expect(smallBreak.nextExerciseAnnouncement).toBe('次は、ぶりっじです');
    });
});
