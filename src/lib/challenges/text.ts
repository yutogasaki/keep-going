import type { Challenge } from './types';

function normalizeChallengeText(value: string | null | undefined): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

export function getChallengeCardText(challenge: Pick<Challenge, 'title' | 'summary' | 'description'>): string | null {
    const summary = normalizeChallengeText(challenge.summary);
    if (summary && summary !== challenge.title) {
        return summary;
    }

    const description = normalizeChallengeText(challenge.description);
    if (description && description !== challenge.title) {
        return description;
    }

    return null;
}

export function getChallengeHeaderText(challenge: Pick<Challenge, 'title' | 'summary'>): string | null {
    const summary = normalizeChallengeText(challenge.summary);
    return summary && summary !== challenge.title ? summary : null;
}

export function getChallengeDescriptionText(challenge: Pick<Challenge, 'summary' | 'description'>): string | null {
    const description = normalizeChallengeText(challenge.description);
    const summary = normalizeChallengeText(challenge.summary);

    if (!description) {
        return null;
    }

    return description !== summary ? description : null;
}
