import { getTodayKey } from './db';
import type { SessionRecord } from './db';
import { hasCompletedExercises } from './sessionRecords';
import type { PastFuwafuwaRecord } from '../store/useAppStore';

// 28 days cycle
export const FUWAFUWA_CYCLE_DAYS = 28;
export const FUWAFUWA_TYPE_COUNT = 12;
export const FUWAFUWA_TYPES = Array.from({ length: FUWAFUWA_TYPE_COUNT }, (_, index) => index);
export const APRIL_FUWAFUWA_TYPES = [10, 11] as const;
export const APRIL_FUWAFUWA_SHARE = 0.5;

const SPECIAL_FUWAFUWA_IMAGE_ASSETS: Partial<Record<number, { baseName: string; extension: 'webp' }>> = {
    10: { baseName: 'april-petal', extension: 'webp' },
    11: { baseName: 'april-cloud', extension: 'webp' },
};

// Thresholds
export const EVOLVE_TO_FAIRY_THRESHOLD = 2;   // Requires 2 active days to evolve to fairy
export const EVOLVE_TO_ADULT_THRESHOLD = 7;   // Requires 7 active days total to evolve to adult

export interface FuwafuwaStatus {
    stage: number; // 1: Egg, 2: Fairy, 3: Adult
    scale: number; // For fairy size variations
    isSayonara: boolean; // True on day 29 before reset
    daysAlive: number;
    activeDays: number;
}

export function getFuwafuwaImagePath(type: number, stage: number): string {
    const specialAsset = SPECIAL_FUWAFUWA_IMAGE_ASSETS[type];
    if (specialAsset) {
        return `/ikimono/${specialAsset.baseName}-${stage}.${specialAsset.extension}`;
    }

    return `/ikimono/${type}-${stage}.webp`;
}

export function isAprilDateKey(dateKey: string): boolean {
    const [, month] = dateKey.split('-');
    return Number(month) === 4;
}

function pickRandomType(candidates: readonly number[]): number {
    return candidates[Math.floor(Math.random() * candidates.length)];
}

function pickBiasedFuwafuwaType(candidates: readonly number[], dateKey: string): number {
    if (candidates.length === 0) {
        throw new Error('No fuwafuwa types available');
    }

    if (!isAprilDateKey(dateKey)) {
        return pickRandomType(candidates);
    }

    const aprilCandidates = candidates.filter((type) => APRIL_FUWAFUWA_TYPES.includes(type as typeof APRIL_FUWAFUWA_TYPES[number]));
    if (aprilCandidates.length === 0) {
        return pickRandomType(candidates);
    }

    const regularCandidates = candidates.filter((type) => !APRIL_FUWAFUWA_TYPES.includes(type as typeof APRIL_FUWAFUWA_TYPES[number]));
    if (regularCandidates.length === 0) {
        return pickRandomType(aprilCandidates);
    }

    return Math.random() < APRIL_FUWAFUWA_SHARE
        ? pickRandomType(aprilCandidates)
        : pickRandomType(regularCandidates);
}

export function calculateFuwafuwaStatus(
    birthDate: string | null,
    sessions: SessionRecord[]
): FuwafuwaStatus {
    if (!birthDate) {
        return { stage: 1, scale: 1, isSayonara: false, daysAlive: 0, activeDays: 0 };
    }

    const today = new Date(getTodayKey());
    const birth = new Date(birthDate);

    // Calculate days difference (guard against future birth dates)
    const diffTime = today.getTime() - birth.getTime();
    if (diffTime < 0) {
        return { stage: 1, scale: 1, isSayonara: false, daysAlive: 0, activeDays: 0 };
    }
    const daysAlive = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 1-indexed

    // Calculate active days since birth (always needed, even for sayonara)
    // Only count sessions where at least 1 exercise was completed
    const sessionsSinceBirth = sessions.filter(
        s => s.date >= birthDate && s.date <= getTodayKey() && hasCompletedExercises(s)
    );
    const uniqueActiveDates = new Set(sessionsSinceBirth.map(s => s.date));
    const activeDays = uniqueActiveDates.size;

    // If day 29 or more, it's sayonara time (stage based purely on activeDays)
    if (daysAlive > FUWAFUWA_CYCLE_DAYS) {
        let stage = 1;
        if (activeDays >= EVOLVE_TO_ADULT_THRESHOLD) stage = 3;
        else if (activeDays >= EVOLVE_TO_FAIRY_THRESHOLD) stage = 2;
        return { stage, scale: 1, isSayonara: true, daysAlive, activeDays };
    }

    // Within cycle: apply time-gated evolution rules
    let stage: number;
    let scale: number;

    if (daysAlive <= 3) {
        // Day 1-3: always Egg regardless of activeDays
        stage = 1;
        scale = 1.0;
    } else if (daysAlive <= 14) {
        // Day 4-14: Fairy possible
        if (activeDays >= EVOLVE_TO_FAIRY_THRESHOLD) {
            stage = 2;
            if (activeDays <= 3) scale = 0.7;
            else if (activeDays <= 5) scale = 0.85;
            else scale = 1.0;
        } else {
            stage = 1;
            scale = 1.0;
        }
    } else {
        // Day 15-28: Adult possible
        if (activeDays >= EVOLVE_TO_ADULT_THRESHOLD) {
            stage = 3;
            scale = 1.0;
        } else if (activeDays >= EVOLVE_TO_FAIRY_THRESHOLD) {
            stage = 2;
            scale = 1.0;
        } else {
            stage = 1;
            scale = 1.0;
        }
    }

    return { stage, scale, isSayonara: false, daysAlive, activeDays };
}

/**
 * 過去に来たことのないタイプから優先してランダムに選ぶ。
 * 全種制覇した場合は全タイプからランダム。
 */
export function pickInitialFuwafuwaType(dateKey = getTodayKey()): number {
    return pickBiasedFuwafuwaType(FUWAFUWA_TYPES, dateKey);
}

export function pickNextFuwafuwaType(
    pastFuwafuwas: PastFuwafuwaRecord[],
    currentType: number,
    dateKey = getTodayKey(),
): number {
    const allTypes = FUWAFUWA_TYPES;
    const usedTypes = new Set([
        currentType,
        ...pastFuwafuwas.map(fw => fw.type),
    ]);
    const available = allTypes.filter(t => !usedTypes.has(t));

    if (available.length === 0) {
        return pickBiasedFuwafuwaType(allTypes, dateKey);
    }

    return pickBiasedFuwafuwaType(available, dateKey);
}
