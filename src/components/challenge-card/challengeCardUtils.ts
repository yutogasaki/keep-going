export function getChallengeDateLabel(startDate: string, endDate: string): string {
    const startMonth = parseInt(startDate.split('-')[1], 10);
    const startDay = parseInt(startDate.split('-')[2], 10);
    const endMonth = parseInt(endDate.split('-')[1], 10);
    const endDay = parseInt(endDate.split('-')[2], 10);

    return startMonth === endMonth
        ? `${endMonth}/${endDay}まで`
        : `${startMonth}/${startDay}〜${endMonth}/${endDay}`;
}

export function getChallengeDaysLeft(endDateString: string): number {
    const now = new Date();
    const endDate = new Date(`${endDateString}T23:59:59`);
    return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

interface ChallengeProgressCalloutParams {
    progress: number;
    goalTarget: number;
    goalType: 'active_day' | 'total_count';
    allCompleted: boolean;
}

export function getChallengeProgressCallout({
    progress,
    goalTarget,
    goalType,
    allCompleted,
}: ChallengeProgressCalloutParams): string {
    if (allCompleted || progress >= goalTarget) {
        return 'クリア！ ごほうびゲット';
    }

    const remaining = Math.max(goalTarget - progress, 0);
    return goalType === 'active_day'
        ? `あと${remaining}日でクリア`
        : `あと${remaining}回でクリア`;
}
