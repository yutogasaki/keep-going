import type {
    SessionDraft,
    SessionMenuSource,
    TabId,
} from '../types';
import {
    sanitizeOptionalString,
    sanitizeStringArray,
    VALID_SESSION_MENU_SOURCES,
    VALID_TABS,
} from './primitives';

export function sanitizeSessionDraft(
    draft: unknown,
    validUserIdSet?: Set<string>,
): SessionDraft | null {
    if (!draft || typeof draft !== 'object') {
        return null;
    }

    const candidate = draft as Record<string, unknown>;
    if (candidate.kind !== 'auto' || typeof candidate.date !== 'string') {
        return null;
    }

    const exerciseIds = sanitizeStringArray(candidate.exerciseIds);
    const userIds = sanitizeStringArray(candidate.userIds).filter((id) => !validUserIdSet || validUserIdSet.has(id));
    const returnTab = candidate.returnTab;
    if (!VALID_TABS.has(returnTab as TabId)) {
        return null;
    }

    const sourceMenuId = sanitizeOptionalString(candidate.sourceMenuId);
    const sourceMenuSource = VALID_SESSION_MENU_SOURCES.has(candidate.sourceMenuSource as SessionMenuSource)
        ? candidate.sourceMenuSource as SessionMenuSource
        : null;
    const sourceMenuName = sanitizeOptionalString(candidate.sourceMenuName);

    return {
        kind: 'auto',
        date: candidate.date,
        exerciseIds,
        userIds,
        returnTab: returnTab as TabId,
        ...(sourceMenuId ? { sourceMenuId } : {}),
        ...(sourceMenuSource ? { sourceMenuSource } : {}),
        ...(sourceMenuName ? { sourceMenuName } : {}),
    };
}

export function sanitizeSessionUserIds(value: unknown, validUserIds: string[]): string[] {
    const validSet = new Set(validUserIds);
    const filtered = sanitizeStringArray(value).filter((id) => validSet.has(id));
    if (filtered.length > 0) {
        return filtered;
    }

    return validUserIds[0] ? [validUserIds[0]] : [];
}
