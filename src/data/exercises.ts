// Stretch & Core exercise master data from specification

export type ExerciseType = 'stretch' | 'core';
export type ClassLevel = 'プレ' | '初級' | '中級' | '上級';
export type Priority = 'high' | 'medium';

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
}

export const EXERCISES: Exercise[] = [
    // Stretches
    { id: 'S01', name: '開脚', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦵' },
    { id: 'S02', name: '前屈', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🙇' },
    { id: 'S03', name: '前後開脚', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🩰' },
    { id: 'S04', name: 'ブリッジ', sec: 30, type: 'stretch', internal: 'single', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🌈' },
    { id: 'S05', name: 'アシカさん', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🦭' },
    { id: 'S06', name: 'ゆりかご', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🛏️' },
    { id: 'S07', name: 'ポイント＆フレックス', sec: 60, type: 'stretch', internal: 'P10・F10×3', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦶' },
    { id: 'S08', name: 'どんぐり', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🌰' },
    { id: 'S09', name: 'Y字バランス', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['中級', '上級'], priority: 'medium', emoji: '🧘' },
    { id: 'S10', name: 'Y字バランス', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💃' },
    // Core
    { id: 'C01', name: 'プランク', sec: 30, type: 'core', internal: 'single', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '💪' },
    { id: 'C02', name: 'サイドプランク', sec: 60, type: 'core', internal: 'R30→L30', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🏋️' },
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

// Session target duration in seconds (10 minutes)
export const SESSION_TARGET_SECONDS = 600;

// Generate a session (list of exercises) for a class
// High priority always included, medium fills remaining time up to target
export function generateSession(classLevel: ClassLevel, excludedIds: string[] = []): Exercise[] {
    let available = getExercisesByClass(classLevel);

    // Filter out excluded IDs, but fallback if too few left
    const filtered = available.filter(e => !excludedIds.includes(e.id));
    if (filtered.filter(e => e.type === 'stretch').length >= 3) {
        available = filtered;
    }

    // Split available into core and stretch
    const availableCore = available.filter(e => e.type === 'core');
    const availableStretch = available.filter(e => e.type === 'stretch');

    // Select core exercises first (usually 1-2) to secure them at the end
    // For a 10min session, try 2 core exercises if available
    const selectedCore = [...availableCore].sort(() => Math.random() - 0.5).slice(0, 2);
    const coreTime = selectedCore.reduce((sum, e) => sum + e.sec, 0);

    // Remaining time for stretches
    const targetStretchTime = SESSION_TARGET_SECONDS - coreTime;

    // Separate stretches by priority
    const highStretch = availableStretch.filter(e => e.priority === 'high').sort(() => Math.random() - 0.5);
    const mediumStretch = availableStretch.filter(e => e.priority === 'medium').sort(() => Math.random() - 0.5);

    let selectedStretches: Exercise[] = [...highStretch];
    let stretchSec = selectedStretches.reduce((sum, e) => sum + e.sec, 0);

    // Fill with medium stretches up to target
    for (const ex of mediumStretch) {
        if (stretchSec >= targetStretchTime) break;
        selectedStretches.push(ex);
        stretchSec += ex.sec;
    }

    // If still under, repeat stretches
    if (stretchSec < targetStretchTime) {
        let i = 0;
        const allStretchPairs = [...availableStretch].sort(() => Math.random() - 0.5);
        while (stretchSec < targetStretchTime && i < allStretchPairs.length * 3) {
            const ex = allStretchPairs[i % allStretchPairs.length];
            selectedStretches.push(ex);
            stretchSec += ex.sec;
            i++;
        }
    }

    // Smart ordering for stretches (avoid consecutive same emojis/body parts if possible)
    let orderedStretches: Exercise[] = [];
    let remaining = [...selectedStretches];

    while (remaining.length > 0) {
        if (orderedStretches.length === 0) {
            // Pick high priority first randomly (Daily Must)
            const highIdx = remaining.findIndex(e => e.priority === 'high');
            const idx = highIdx !== -1 ? highIdx : Math.floor(Math.random() * remaining.length);
            orderedStretches.push(remaining.splice(idx, 1)[0]);
            continue;
        }

        const lastEx = orderedStretches[orderedStretches.length - 1];

        // Find best next (different emoji ideally)
        let bestIdx = remaining.findIndex(e => e.emoji !== lastEx.emoji);
        if (bestIdx === -1) {
            // If all remaining have the same emoji, just take the first one
            bestIdx = 0;
        }

        orderedStretches.push(remaining.splice(bestIdx, 1)[0]);
    }

    // Ensure S07 (Point & Flex) is early in the session if present (warmup)
    const pfIdx = orderedStretches.findIndex(e => e.id === 'S07');
    if (pfIdx > 1) { // Move to index 0 or 1
        const pf = orderedStretches.splice(pfIdx, 1)[0];
        orderedStretches.splice(0, 0, pf); // Move to very start
    }

    // Combine: Ordered Stretches + Core at the end
    return [...orderedStretches, ...selectedCore];
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
