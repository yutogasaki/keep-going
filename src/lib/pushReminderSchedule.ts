export const REMINDER_WINDOW_MINUTES = 10;

const NOTIFICATION_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function pad2(value: number): string {
    return String(value).padStart(2, '0');
}

function getLocalParts(now: Date, timeZone: string): { dateKey: string; totalMinutes: number } {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const year = Number(parts.find((part) => part.type === 'year')?.value ?? 0);
    const month = Number(parts.find((part) => part.type === 'month')?.value ?? 0);
    const day = Number(parts.find((part) => part.type === 'day')?.value ?? 0);
    const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);

    return {
        dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
        totalMinutes: hour * 60 + minute,
    };
}

export function normalizeNotificationTime(value: string, fallback = '21:00'): string {
    return NOTIFICATION_TIME_PATTERN.test(value) ? value : fallback;
}

function getTargetMinutes(notificationTime: string): number {
    const normalized = normalizeNotificationTime(notificationTime);
    const [hours, minutes] = normalized.split(':').map(Number);
    return hours * 60 + minutes;
}

export interface ReminderDueResult {
    shouldSend: boolean;
    localDate: string;
}

export function shouldSendReminder(params: {
    now: Date;
    notificationTime: string;
    timeZone: string;
    lastSentLocalDate?: string | null;
    windowMinutes?: number;
}): ReminderDueResult {
    const {
        now,
        notificationTime,
        timeZone,
        lastSentLocalDate = null,
        windowMinutes = REMINDER_WINDOW_MINUTES,
    } = params;

    let localParts: { dateKey: string; totalMinutes: number };

    try {
        localParts = getLocalParts(now, timeZone);
    } catch {
        localParts = getLocalParts(now, 'UTC');
    }

    const targetMinutes = getTargetMinutes(notificationTime);
    const shouldSend = (
        localParts.totalMinutes >= targetMinutes
        && localParts.totalMinutes < targetMinutes + windowMinutes
        && localParts.dateKey !== lastSentLocalDate
    );

    return {
        shouldSend,
        localDate: localParts.dateKey,
    };
}
