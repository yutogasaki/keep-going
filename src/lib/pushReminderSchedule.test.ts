import { describe, expect, it } from 'vitest';
import { REMINDER_WINDOW_MINUTES, shouldSendReminder } from './pushReminderSchedule';

describe('shouldSendReminder', () => {
    it('sends inside the reminder window', () => {
        const result = shouldSendReminder({
            now: new Date('2026-04-04T12:03:00Z'),
            notificationTime: '21:00',
            timeZone: 'Asia/Tokyo',
        });

        expect(result).toEqual({
            shouldSend: true,
            localDate: '2026-04-04',
        });
    });

    it('does not send before the reminder time', () => {
        const result = shouldSendReminder({
            now: new Date('2026-04-04T11:59:00Z'),
            notificationTime: '21:00',
            timeZone: 'Asia/Tokyo',
        });

        expect(result.shouldSend).toBe(false);
    });

    it('does not send twice on the same local day', () => {
        const result = shouldSendReminder({
            now: new Date('2026-04-04T12:04:00Z'),
            notificationTime: '21:00',
            timeZone: 'Asia/Tokyo',
            lastSentLocalDate: '2026-04-04',
        });

        expect(result.shouldSend).toBe(false);
    });

    it('stops sending after the window closes', () => {
        const result = shouldSendReminder({
            now: new Date('2026-04-04T12:15:00Z'),
            notificationTime: '21:00',
            timeZone: 'Asia/Tokyo',
            windowMinutes: REMINDER_WINDOW_MINUTES,
        });

        expect(result.shouldSend).toBe(false);
    });
});
