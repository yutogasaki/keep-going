export type LegacyUserRecord = Record<string, unknown>;

export type MutableMigratingState = Record<string, unknown> & {
    users?: unknown;
    sessionUserIds?: unknown;
    requiredExercises?: unknown;
    excludedExercises?: unknown;
    dailyTargetMinutes?: unknown;
    bgmEnabled?: unknown;
    bgmVolume?: unknown;
    bgmTrackId?: unknown;
    hapticEnabled?: unknown;
    joinedChallengeIds?: unknown;
    dismissedHomeAnnouncementIds?: unknown;
    homeVisitMemory?: unknown;
    challengeEnrollmentWindows?: unknown;
    sessionDraft?: unknown;
    hasSeenSessionControlsHint?: unknown;
    ttsRate?: unknown;
    ttsPitch?: unknown;
    classLevel?: unknown;
    fuwafuwaBirthDate?: unknown;
    fuwafuwaType?: unknown;
    fuwafuwaCycleCount?: unknown;
    fuwafuwaName?: unknown;
    pastFuwafuwas?: unknown;
    notifiedFuwafuwaStages?: unknown;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function getLegacyUsers(value: unknown): LegacyUserRecord[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter(isRecord);
}

export function mapLegacyUsers(
    state: MutableMigratingState,
    mapper: (user: LegacyUserRecord, index: number) => LegacyUserRecord,
): void {
    const users = getLegacyUsers(state.users);
    if (users.length === 0) {
        return;
    }

    state.users = users.map(mapper);
}

export function getStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.filter((item): item is string => typeof item === 'string');
}

export function getFiniteNumber(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function getNonEmptyString(value: unknown, fallback: string): string {
    return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function getNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}
