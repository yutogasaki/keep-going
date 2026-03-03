export interface SyncStoreState {
    users: Array<{ id: string }>;
    [key: string]: unknown;
}

type GetStoreState = () => SyncStoreState;
type SetStoreState = (partial: Record<string, unknown>) => void;

let getStoreStateFn: GetStoreState | null = null;
let setStoreStateFn: SetStoreState | null = null;

export function registerStoreAccessor(
    getState: () => SyncStoreState,
    setState: (partial: Record<string, unknown>) => void,
): void {
    getStoreStateFn = getState;
    setStoreStateFn = setState;
}

export function getRegisteredStoreState(): SyncStoreState | null {
    return getStoreStateFn ? getStoreStateFn() : null;
}

export function setRegisteredStoreState(partial: Record<string, unknown>): void {
    if (!setStoreStateFn) {
        throw new Error('Store accessor not registered');
    }
    setStoreStateFn(partial);
}
