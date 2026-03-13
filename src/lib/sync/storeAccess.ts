export interface SyncStoreState {
    users: Array<{ id: string }>;
}

export type SyncStoreSnapshot = SyncStoreState & Record<string, unknown>;
export type SyncStorePatch = Record<string, unknown>;

type GetStoreState = () => SyncStoreSnapshot;
type SetStoreState = (partial: SyncStorePatch) => void;

let getStoreStateFn: GetStoreState | null = null;
let setStoreStateFn: SetStoreState | null = null;

export function registerStoreAccessor<State extends SyncStoreState>(
    getState: () => State,
    setState: (partial: Partial<State>) => void,
): void {
    getStoreStateFn = () => getState() as SyncStoreSnapshot;
    setStoreStateFn = (partial) => setState(partial as Partial<State>);
}

export function getRegisteredStoreState(): SyncStoreSnapshot | null {
    return getStoreStateFn ? getStoreStateFn() : null;
}

export function setRegisteredStoreState(partial: SyncStorePatch): void {
    if (!setStoreStateFn) {
        throw new Error('Store accessor not registered');
    }
    setStoreStateFn(partial);
}
