import type { StateCreator } from 'zustand';
import { createDebugSlice } from './create-state/debugSlice';
import { createHomeSlice } from './create-state/homeSlice';
import { createSessionSlice } from './create-state/sessionSlice';
import { createSettingsSlice } from './create-state/settingsSlice';
import { createUserSlice } from './create-state/userSlice';
import type { AppState } from './types';

export const createAppState: StateCreator<AppState, [], [], AppState> = (set, get) => ({
    ...createUserSlice(set),
    ...createSessionSlice(set, get),
    ...createSettingsSlice(set),
    ...createHomeSlice(set),
    ...createDebugSlice(set),
});
