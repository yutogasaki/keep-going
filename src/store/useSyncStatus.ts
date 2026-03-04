import { create } from 'zustand';

interface SyncStatus {
    /** Number of sync operations that failed since last success */
    failedCount: number;
    /** Last error message */
    lastError: string | null;
    /** Increment failed count with an error message */
    reportFailure: (error: string) => void;
    /** Clear failure state (e.g. after successful sync) */
    clearFailure: () => void;
}

export const useSyncStatus = create<SyncStatus>((set) => ({
    failedCount: 0,
    lastError: null,
    reportFailure: (error) => set((state) => ({
        failedCount: state.failedCount + 1,
        lastError: error,
    })),
    clearFailure: () => set({ failedCount: 0, lastError: null }),
}));
