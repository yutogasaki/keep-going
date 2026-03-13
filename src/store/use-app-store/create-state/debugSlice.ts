import type { AppState } from '../types';
import type { AppStateSet } from './shared';

type DebugSlice = Pick<
    AppState,
    | 'debugFuwafuwaStage'
    | 'debugFuwafuwaType'
    | 'debugActiveDays'
    | 'debugFuwafuwaScale'
    | 'setDebugFuwafuwaStage'
    | 'setDebugFuwafuwaType'
    | 'setDebugActiveDays'
    | 'setDebugFuwafuwaScale'
    | 'activeMilestoneModal'
    | 'setActiveMilestoneModal'
>;

export function createDebugSlice(set: AppStateSet): DebugSlice {
    return {
        debugFuwafuwaStage: null,
        debugFuwafuwaType: null,
        debugActiveDays: null,
        debugFuwafuwaScale: null,
        setDebugFuwafuwaStage: (debugFuwafuwaStage) => set({ debugFuwafuwaStage }),
        setDebugFuwafuwaType: (debugFuwafuwaType) => set({ debugFuwafuwaType }),
        setDebugActiveDays: (debugActiveDays) => set({ debugActiveDays }),
        setDebugFuwafuwaScale: (debugFuwafuwaScale) => set({ debugFuwafuwaScale }),
        activeMilestoneModal: null,
        setActiveMilestoneModal: (activeMilestoneModal) => set({ activeMilestoneModal }),
    };
}
