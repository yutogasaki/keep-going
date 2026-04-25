import { getTodayKey } from '../../lib/db';
import type { ChibifuwaRecord, PastFuwafuwaRecord, UserProfileStore } from './types';

const VALID_CLASS_LEVELS = new Set(['先生', 'プレ', '初級', '中級', '上級', 'その他']);

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

function sanitizeNonNegativeNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, value);
}

function sanitizePositiveNumber(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
        return fallback;
    }

    return value;
}

function sanitizeNumberArray(value: unknown): number[] {
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

function sanitizePastFuwafuwas(value: unknown): PastFuwafuwaRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((record) => {
        if (!record || typeof record !== 'object') {
            return [];
        }

        const candidate = record as Record<string, unknown>;
        if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
            return [];
        }

        return [{
            id: candidate.id,
            name: sanitizeOptionalString(candidate.name),
            type: sanitizeNonNegativeNumber(candidate.type, 0),
            activeDays: sanitizeNonNegativeNumber(candidate.activeDays, 0),
            finalStage: sanitizeNonNegativeNumber(candidate.finalStage, 0),
            sayonaraDate: typeof candidate.sayonaraDate === 'string' && candidate.sayonaraDate.length > 0
                ? candidate.sayonaraDate
                : getTodayKey(),
        }];
    });
}

function sanitizeChibifuwas(value: unknown): ChibifuwaRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((record) => {
        if (!record || typeof record !== 'object') {
            return [];
        }

        const candidate = record as Record<string, unknown>;
        if (
            typeof candidate.id !== 'string' ||
            candidate.id.length === 0 ||
            typeof candidate.challengeTitle !== 'string' ||
            candidate.challengeTitle.length === 0 ||
            typeof candidate.earnedDate !== 'string' ||
            candidate.earnedDate.length === 0
        ) {
            return [];
        }

        return [{
            id: candidate.id,
            type: sanitizeNonNegativeNumber(candidate.type, 0),
            challengeTitle: candidate.challengeTitle,
            earnedDate: candidate.earnedDate,
        }];
    });
}

export function sanitizeUsers(value: unknown): UserProfileStore[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.flatMap((user) => {
        if (!user || typeof user !== 'object') {
            return [];
        }

        const candidate = user as Record<string, unknown>;
        if (typeof candidate.id !== 'string' || candidate.id.length === 0) {
            return [];
        }

        const classLevel = typeof candidate.classLevel === 'string' && VALID_CLASS_LEVELS.has(candidate.classLevel)
            ? candidate.classLevel as UserProfileStore['classLevel']
            : '初級';

        return [{
            id: candidate.id,
            name: typeof candidate.name === 'string' && candidate.name.length > 0 ? candidate.name : 'ゲスト',
            classLevel,
            fuwafuwaBirthDate: typeof candidate.fuwafuwaBirthDate === 'string' && candidate.fuwafuwaBirthDate.length > 0
                ? candidate.fuwafuwaBirthDate
                : getTodayKey(),
            fuwafuwaType: sanitizeNonNegativeNumber(candidate.fuwafuwaType, 0),
            fuwafuwaCycleCount: sanitizePositiveNumber(candidate.fuwafuwaCycleCount, 1),
            fuwafuwaName: sanitizeOptionalString(candidate.fuwafuwaName),
            pastFuwafuwas: sanitizePastFuwafuwas(candidate.pastFuwafuwas),
            notifiedFuwafuwaStages: sanitizeNumberArray(candidate.notifiedFuwafuwaStages),
            dailyTargetMinutes: sanitizePositiveNumber(candidate.dailyTargetMinutes, 10),
            excludedExercises: sanitizeStringArray(candidate.excludedExercises),
            requiredExercises: sanitizeStringArray(candidate.requiredExercises),
            consumedMagicSeconds: sanitizeNonNegativeNumber(candidate.consumedMagicSeconds, 0),
            challengeStars: sanitizeNonNegativeNumber(candidate.challengeStars, 0),
            avatarUrl: typeof candidate.avatarUrl === 'string' && candidate.avatarUrl.length > 0 ? candidate.avatarUrl : undefined,
            chibifuwas: sanitizeChibifuwas(candidate.chibifuwas),
        }];
    });
}
