export const CONTROLS_HINT_INTERACTION_GUARD_MS = 400;

export function shouldIgnoreInitialHintInteraction(openedAt: number | null, now: number): boolean {
    if (openedAt === null) {
        return false;
    }

    return now - openedAt < CONTROLS_HINT_INTERACTION_GUARD_MS;
}
