// Stretch & Core exercise master data from specification

export type ExerciseType = 'stretch' | 'core';
export type ClassLevel = 'プレ' | '初級' | '中級' | '上級';
export type Priority = 'high' | 'medium';

export type ExercisePhase = 'warmup' | 'main' | 'core';

export interface Exercise {
    id: string;
    name: string;
    sec: number;
    type: ExerciseType;
    internal: string;   // 'single' | 'R30→L30' | 'P30→F30'
    classes: ClassLevel[];
    priority: Priority;
    emoji: string;
    hasSplit?: boolean;
    phase: ExercisePhase;
    reading?: string; // Phonetic reading for TTS (e.g., "かいきゃく" for "開脚")
}

export const EXERCISES: Exercise[] = [
    // Stretches (Warmups)
    { id: 'S07', name: 'ポイント＆フレックス', sec: 60, type: 'stretch', internal: 'P10・F10×3', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦶', phase: 'warmup' },
    { id: 'S06', name: 'ゆりかご', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🛏️', phase: 'warmup' },
    { id: 'S08', name: 'どんぐり', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🌰', phase: 'warmup' },
    // Stretches (Main)
    { id: 'S01', name: '開脚', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦵', phase: 'main', reading: 'かいきゃく' },
    { id: 'S02', name: '前屈', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🙇', phase: 'main', reading: 'ぜんくつ' },
    { id: 'S03', name: '前後開脚', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🩰', phase: 'main', hasSplit: true, reading: 'ぜんごかいきゃく' },
    { id: 'S05', name: 'アシカさん', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🦭', phase: 'main' },
    // Core & Balance
    { id: 'S04', name: 'ブリッジ', sec: 30, type: 'stretch', internal: 'single', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🌈', phase: 'core' },
    { id: 'S09', name: 'Y字バランス', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['中級', '上級'], priority: 'medium', emoji: '🧘', phase: 'core', hasSplit: true, reading: 'わいじばらんす' },
    { id: 'S10', name: 'Y字バランス', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💃', phase: 'core', hasSplit: true, reading: 'わいじばらんす' },
    { id: 'C01', name: 'プランク', sec: 30, type: 'core', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💪', phase: 'core' },
    { id: 'C02', name: 'サイドプランク', sec: 60, type: 'core', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🏋️', phase: 'core', hasSplit: true },
];

// Get exercise by ID
export function getExerciseById(id: string): Exercise | undefined {
    return EXERCISES.find(e => e.id === id);
}

// Color mapping for exercises
export const EXERCISE_COLORS: Record<string, string> = {
    S01: '#FFE5D9',
    S02: '#D4F0E7',
    S03: '#E8D5F5',
    S04: '#D5E8F5',
    S05: '#FFF3D4',
    S06: '#FFD9E8',
    S07: '#D9F5FF',
    S08: '#E8E5D4',
    S09: '#F5D5E8',
    S10: '#E8F5D9',
    C01: '#D4E8F5',
    C02: '#E5D9FF',
};

export function getExerciseColor(id: string): string {
    return EXERCISE_COLORS[id] || '#F0F3F5';
}

// Get exercises by class level
export function getExercisesByClass(classLevel: ClassLevel): Exercise[] {
    return EXERCISES.filter(e => e.classes.includes(classLevel));
}

// Default Session target duration in seconds (10 minutes)
export const DEFAULT_SESSION_TARGET_SECONDS = 600;

export interface GenerateSessionOptions {
    excludedIds?: string[];
    requiredIds?: string[];
    targetSeconds?: number;
}

// Generate a session (list of exercises) for a class
// Required priority always included, high/medium fills remaining time up to target
export function generateSession(classLevel: ClassLevel, options: GenerateSessionOptions = {}): Exercise[] {
    const {
        excludedIds = [],
        requiredIds = [],
        targetSeconds = DEFAULT_SESSION_TARGET_SECONDS
    } = options;

    let available = getExercisesByClass(classLevel);

    // Filter out excluded IDs (like those already done today)
    let filtered = available.filter(e => !excludedIds.includes(e.id));

    // If we've exhausted everything (user did ALL exercises today), reset and use everything
    if (filtered.length < 3) {
        filtered = available;
    }

    // Split by phases
    const availableWarmups = filtered.filter(e => e.phase === 'warmup');
    const availableMain = filtered.filter(e => e.phase === 'main');
    const availableCore = filtered.filter(e => e.phase === 'core');

    // Filter Required exercises
    const requiredWarmups = availableWarmups.filter(e => requiredIds.includes(e.id));
    const requiredMain = availableMain.filter(e => requiredIds.includes(e.id));
    const requiredCore = availableCore.filter(e => requiredIds.includes(e.id));

    // 1. Pick Warmup (aim for 1-2, prioritize required)
    const selectedWarmup = [...requiredWarmups];
    let remainingWarmups = availableWarmups.filter(e => !requiredIds.includes(e.id)).sort(() => Math.random() - 0.5);
    while (selectedWarmup.length < 2 && remainingWarmups.length > 0) {
        selectedWarmup.push(remainingWarmups.shift()!);
    }
    let currentSec = selectedWarmup.reduce((sum, e) => sum + e.sec, 0);

    // 2. Pick Core/Balance (aim for 2, prioritize required) to put at the very end
    const selectedCore = [...requiredCore];
    let remainingCore = availableCore.filter(e => !requiredIds.includes(e.id)).sort(() => Math.random() - 0.5);
    while (selectedCore.length < 2 && remainingCore.length > 0) {
        selectedCore.push(remainingCore.shift()!);
    }
    currentSec += selectedCore.reduce((sum, e) => sum + e.sec, 0);

    // 3. Pick Main Stretches to fill the rest up to target
    let selectedMain: Exercise[] = [...requiredMain];
    currentSec += requiredMain.reduce((sum, e) => sum + e.sec, 0);

    // High priority first for remaining main stretches
    const remainingMain = availableMain.filter(e => !requiredIds.includes(e.id));
    const highMain = remainingMain.filter(e => e.priority === 'high').sort(() => Math.random() - 0.5);
    const mediumMain = remainingMain.filter(e => e.priority === 'medium').sort(() => Math.random() - 0.5);

    for (const ex of highMain) {
        if (currentSec >= targetSeconds) break;
        selectedMain.push(ex);
        currentSec += ex.sec;
    }

    for (const ex of mediumMain) {
        if (currentSec >= targetSeconds) break;
        selectedMain.push(ex);
        currentSec += ex.sec;
    }

    // If still under time, add exercises that haven't been selected yet (each max 2 appearances)
    if (currentSec < targetSeconds && availableMain.length > 0) {
        const alreadySelectedIds = new Set(selectedMain.map(e => e.id));
        // First: add exercises not yet used at all
        const unused = availableMain.filter(e => !alreadySelectedIds.has(e.id)).sort(() => Math.random() - 0.5);
        for (const ex of unused) {
            if (currentSec >= targetSeconds) break;
            selectedMain.push(ex);
            currentSec += ex.sec;
        }
        // Still short? Allow each exercise to appear at most twice total
        if (currentSec < targetSeconds) {
            const countMap = new Map<string, number>();
            for (const e of selectedMain) countMap.set(e.id, (countMap.get(e.id) || 0) + 1);
            const canRepeat = availableMain.filter(e => (countMap.get(e.id) || 0) < 2).sort(() => Math.random() - 0.5);
            for (const ex of canRepeat) {
                if (currentSec >= targetSeconds) break;
                selectedMain.push(ex);
                currentSec += ex.sec;
            }
        }
    }

    // Smart ordering for Main phase (avoid consecutive same emojis/body parts if possible)
    let orderedMain: Exercise[] = [];
    let remaining = [...selectedMain];

    while (remaining.length > 0) {
        if (orderedMain.length === 0) {
            orderedMain.push(remaining.splice(0, 1)[0]);
            continue;
        }
        const lastEx = orderedMain[orderedMain.length - 1];
        let bestIdx = remaining.findIndex(e => e.emoji !== lastEx.emoji);
        if (bestIdx === -1) bestIdx = 0;
        orderedMain.push(remaining.splice(bestIdx, 1)[0]);
    }

    // Combine: Warmup -> Main -> Core
    return [...selectedWarmup, ...orderedMain, ...selectedCore];
}

// Get a replacement exercise when skipping
export function getReplacementExercise(classLevel: ClassLevel, currentSessionIds: string[], targetSec: number): Exercise | null {
    const available = getExercisesByClass(classLevel).filter(e => !currentSessionIds.includes(e.id) && e.type === 'stretch');
    // Try to find one that exactly matches the skipped time, otherwise just take any
    const match = available.find(e => e.sec === targetSec) || available[0];
    return match || null;
}

// Generate a session from specific exercise IDs
export function generateSessionFromIds(ids: string[]): Exercise[] {
    return ids
        .map(id => getExerciseById(id))
        .filter((e): e is Exercise => e !== undefined);
}

// Calculate total seconds for a list of exercise IDs
export function calculateTotalSeconds(ids: string[]): number {
    return ids.reduce((total, id) => {
        const ex = getExerciseById(id);
        return total + (ex?.sec || 0);
    }, 0);
}
