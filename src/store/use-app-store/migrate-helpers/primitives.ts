import type { SessionMenuSource, TabId } from '../types';

export const VALID_TABS = new Set<TabId>(['home', 'record', 'menu', 'settings']);
export const VALID_SESSION_MENU_SOURCES = new Set<SessionMenuSource>(['preset', 'teacher', 'custom', 'public']);
export const VALID_CLASS_LEVELS = new Set(['先生', 'プレ', '初級', '中級', '上級', 'その他']);
const DEFAULT_NOTIFICATION_TIME = '21:00';
const NOTIFICATION_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export function sanitizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set<string>();
    const result: string[] = [];
    for (const item of value) {
        if (typeof item !== 'string' || item.length === 0 || seen.has(item)) {
            continue;
        }
        seen.add(item);
        result.push(item);
    }
    return result;
}

export function sanitizeOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

export function sanitizeNonNegativeNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, value);
}

export function sanitizePositiveNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return fallback;
    }

    return value;
}

export function sanitizeNumberArray(value: unknown): number[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const seen = new Set<number>();
    const result: number[] = [];
    for (const item of value) {
        if (typeof item !== 'number' || !Number.isFinite(item) || seen.has(item)) {
            continue;
        }
        seen.add(item);
        result.push(item);
    }
    return result;
}

export function isValidNotificationTime(value: unknown): value is string {
    if (typeof value !== 'string') {
        return false;
    }

    const match = NOTIFICATION_TIME_PATTERN.exec(value);
    if (!match) {
        return false;
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return false;
    }

    return true;
}

export function sanitizeNotificationTime(value: unknown): string {
    return isValidNotificationTime(value) ? value : DEFAULT_NOTIFICATION_TIME;
}

export function sanitizeBooleanSetting(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

export function sanitizeSoundVolume(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return 1;
    }

    return Math.min(1, Math.max(0, value));
}

export function sanitizeNullableNumber(value: unknown): number | null {
    if (value == null) {
        return null;
    }

    return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
