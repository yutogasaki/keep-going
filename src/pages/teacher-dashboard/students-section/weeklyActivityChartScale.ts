const ZERO_BAR_HEIGHT_PERCENT = 8;
const FLAT_ACTIVE_BAR_HEIGHT_PERCENT = 72;
const MIN_ACTIVE_BAR_HEIGHT_PERCENT = 28;
const MAX_ACTIVE_BAR_HEIGHT_PERCENT = 96;

export interface WeeklyActivityScale {
    minActiveCount: number;
    maxActiveCount: number;
    label: string;
    getHeightPercent: (count: number) => number;
}

export function buildWeeklyActivityScale(counts: number[]): WeeklyActivityScale {
    const activeCounts = counts.filter((count) => count > 0);

    if (activeCounts.length === 0) {
        return {
            minActiveCount: 0,
            maxActiveCount: 0,
            label: '0人',
            getHeightPercent: () => ZERO_BAR_HEIGHT_PERCENT,
        };
    }

    const minActiveCount = Math.min(...activeCounts);
    const maxActiveCount = Math.max(...activeCounts);
    const activeRange = maxActiveCount - minActiveCount;
    const label = activeRange === 0
        ? `${maxActiveCount}人`
        : `${minActiveCount}-${maxActiveCount}人`;

    return {
        minActiveCount,
        maxActiveCount,
        label,
        getHeightPercent: (count) => {
            if (count <= 0) {
                return ZERO_BAR_HEIGHT_PERCENT;
            }
            if (activeRange === 0) {
                return FLAT_ACTIVE_BAR_HEIGHT_PERCENT;
            }

            const activePosition = (count - minActiveCount) / activeRange;
            return Math.round(
                MIN_ACTIVE_BAR_HEIGHT_PERCENT +
                activePosition * (MAX_ACTIVE_BAR_HEIGHT_PERCENT - MIN_ACTIVE_BAR_HEIGHT_PERCENT),
            );
        },
    };
}
