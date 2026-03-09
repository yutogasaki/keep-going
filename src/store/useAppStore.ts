import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppState } from './use-app-store/createState';
import { APP_STATE_VERSION, migrateAppState, partializeAppState } from './use-app-store/migrate';
import { setupStoreSyncSubscription } from './use-app-store/syncSubscription';
import type { AppState } from './use-app-store/types';

export type {
    AppState,
    TabId,
    UserProfileStore,
    PastFuwafuwaRecord,
    ChibifuwaRecord,
    SessionMenuSource,
} from './use-app-store/types';

export const useAppStore = create<AppState>()(
    persist(createAppState, {
        name: 'keepgoing-app-state',
        version: APP_STATE_VERSION,
        migrate: migrateAppState,
        partialize: partializeAppState,
    }),
);

setupStoreSyncSubscription(useAppStore as any);
