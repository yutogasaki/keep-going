import { getTodayKey, shiftDateKey } from '../../../lib/db';

export function getDefaultDateRange(): { startDate: string; endDate: string } {
    const startDate = getTodayKey();
    const endDate = shiftDateKey(startDate, 6);
    return { startDate, endDate };
}
