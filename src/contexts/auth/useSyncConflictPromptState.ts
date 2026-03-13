import { useCallback, useRef, useState } from 'react';
import type { SyncConflictPromptData, SyncConflictResolution } from '../../lib/sync';

export function useSyncConflictPromptState() {
    const [syncConflictPrompt, setSyncConflictPrompt] = useState<SyncConflictPromptData | null>(null);
    const syncConflictResolverRef = useRef<((choice: SyncConflictResolution) => void) | null>(null);

    const requestSyncConflictResolution = useCallback((prompt: SyncConflictPromptData) => (
        new Promise<SyncConflictResolution>((resolve) => {
            syncConflictResolverRef.current = resolve;
            setSyncConflictPrompt(prompt);
        })
    ), []);

    const resolveSyncConflict = useCallback((choice: SyncConflictResolution) => {
        syncConflictResolverRef.current?.(choice);
        syncConflictResolverRef.current = null;
        setSyncConflictPrompt(null);
    }, []);

    return {
        requestSyncConflictResolution,
        resolveSyncConflict,
        syncConflictPrompt,
    };
}
