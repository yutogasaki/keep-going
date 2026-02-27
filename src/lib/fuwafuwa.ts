import { getTodayKey } from './db';
import type { SessionRecord } from './db';
import type { PastFuwafuwaRecord } from '../store/useAppStore';

// 28 days cycle
export const FUWAFUWA_CYCLE_DAYS = 28;

// Thresholds
export const EVOLVE_TO_FAIRY_THRESHOLD = 3;   // Requires 3 active days in the first 7 days to evolve to fairy
export const EVOLVE_TO_ADULT_THRESHOLD = 10;  // Requires 10 active days total to evolve to adult

export interface FuwafuwaStatus {
    stage: number; // 1: Egg, 2: Fairy, 3: Adult
    scale: number; // For fairy size variations
    isSayonara: boolean; // True on day 29 before reset
    daysAlive: number;
    activeDays: number;
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

    // Calculate days difference
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const daysAlive = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 1-indexed

    // Calculate active days since birth (always needed, even for sayonara)
    const sessionsSinceBirth = sessions.filter(s => s.date >= birthDate && s.date <= getTodayKey());
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
    let stage = 1;
    let scale = 1.0;

    if (daysAlive <= 7) {
        // Week 1: always Egg regardless of activeDays
        stage = 1;
        scale = 1.0;
    } else if (daysAlive <= 21) {
        // Week 2-3: Fairy possible
        if (activeDays >= EVOLVE_TO_FAIRY_THRESHOLD) {
            stage = 2;
            if (activeDays <= 5) scale = 0.5;
            else if (activeDays <= 8) scale = 0.75;
            else scale = 1.0;
        } else {
            stage = 1;
            scale = 1.0;
        }
    } else {
        // Week 4: Adult possible
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
 * 過去に来たことのないタイプからランダムに選ぶ。
 * 全種制覇した場合は currentType 以外からランダム。
 */
export function pickNextFuwafuwaType(
    pastFuwafuwas: PastFuwafuwaRecord[],
    currentType: number,
): number {
    const allTypes = Array.from({ length: 10 }, (_, i) => i);
    const usedTypes = new Set([
        currentType,
        ...pastFuwafuwas.map(fw => fw.type),
    ]);
    const available = allTypes.filter(t => !usedTypes.has(t));

    if (available.length === 0) {
        // 全種制覇 → currentType以外からランダム
        const reset = allTypes.filter(t => t !== currentType);
        return reset[Math.floor(Math.random() * reset.length)];
    }

    return available[Math.floor(Math.random() * available.length)];
}
