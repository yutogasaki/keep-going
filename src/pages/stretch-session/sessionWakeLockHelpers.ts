export interface SessionWakeLockRequestState {
    enabled: boolean;
    visibilityState: DocumentVisibilityState;
    hasWakeLockApi: boolean;
    hasActiveSentinel: boolean;
    isRequestPending: boolean;
}

export function canRequestSessionWakeLock({
    enabled,
    visibilityState,
    hasWakeLockApi,
    hasActiveSentinel,
    isRequestPending,
}: SessionWakeLockRequestState): boolean {
    return enabled
        && visibilityState === 'visible'
        && hasWakeLockApi
        && !hasActiveSentinel
        && !isRequestPending;
}

export function shouldReacquireSessionWakeLock({
    enabled,
    visibilityState,
}: Pick<SessionWakeLockRequestState, 'enabled' | 'visibilityState'>): boolean {
    return enabled && visibilityState === 'visible';
}
