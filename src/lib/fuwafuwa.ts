import { getTodayKey } from './db';
import type { SessionRecord } from './db';

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

    // If day 29 or more, it's sayonara time (waiting for reset)
    if (daysAlive > FUWAFUWA_CYCLE_DAYS) {
        return { stage: 3, scale: 1, isSayonara: true, daysAlive, activeDays: 0 };
    }

    // Calculate active days since birth
    const sessionsSinceBirth = sessions.filter(s => s.date >= birthDate && s.date <= getTodayKey());
    const uniqueActiveDates = new Set(sessionsSinceBirth.map(s => s.date));
    const activeDays = uniqueActiveDates.size;

    let stage = 1;
    let scale = 1.0;

    if (daysAlive <= 7) {
        // Week 1: Egg
        stage = 1;
    } else if (daysAlive <= 21) {
        // Week 2-3: Fairy
        // Only evolve to Fairy if activeDays >= EVOLVE_TO_FAIRY_THRESHOLD
        if (activeDays >= EVOLVE_TO_FAIRY_THRESHOLD) {
            stage = 2;
            // Fairy has 3 distinct sizes. Active days in week 2-3 determines size.
            // Minimum active days to be here is 3. Max active days possible at day 21 is 21.
            // Let's say: 
            // 3-5 days: small (0.5)
            // 6-8 days: medium (0.75)
            // 9+ days: large (1.0)
            if (activeDays <= 5) {
                scale = 0.5;
            } else if (activeDays <= 8) {
                scale = 0.75;
            } else {
                scale = 1.0;
            }
        } else {
            // Didn't try hard enough, stay as Egg
            stage = 1;
        }
    } else {
        // Week 4: Adult
        if (activeDays >= EVOLVE_TO_ADULT_THRESHOLD) {
            stage = 3;
        } else if (activeDays >= EVOLVE_TO_FAIRY_THRESHOLD) {
            // Reached fairy, but didn't reach adult
            stage = 2;
            scale = 1.0; // Max fairy size
        } else {
            // Stayed as egg the whole time
            stage = 1;
        }
    }

    return { stage, scale, isSayonara: false, daysAlive, activeDays };
}
