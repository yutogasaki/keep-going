import { getAllSessions, getCustomExercises } from '../db';
import { getCustomGroups } from '../customGroups';
import type { UserProfileStore } from '../../store/useAppStore';
import type { AppSettingsInput } from './mappers';
import { getAccountId } from './authState';
import { processQueue } from './queue';
import { useSyncStatus } from '../../store/useSyncStatus';
import { pushAppSettings, pushCustomExercise, pushFamilyMember, pushMenuGroup, pushSession } from './push';

const INITIAL_SYNC_CONCURRENCY = 8;

async function pushWithConcurrency<T>(
    items: T[],
    pushItem: (item: T) => Promise<void>,
): Promise<void> {
    if (items.length === 0) return;

    let nextIndex = 0;
    const workerCount = Math.min(INITIAL_SYNC_CONCURRENCY, items.length);

    await Promise.all(Array.from({ length: workerCount }, async () => {
        while (nextIndex < items.length) {
            const item = items[nextIndex];
            nextIndex += 1;
            await pushItem(item);
        }
    }));
}

export async function initialSync(
    users: UserProfileStore[],
    settings: AppSettingsInput,
): Promise<void> {
    if (!getAccountId()) return;

    const [sessions, exercises, groups] = await Promise.all([
        getAllSessions(),
        getCustomExercises(),
        getCustomGroups(),
    ]);
    const customGroups = groups.filter((group) => !group.isPreset);

    await Promise.all([
        pushWithConcurrency(users, pushFamilyMember),
        pushWithConcurrency(sessions, pushSession),
        pushWithConcurrency(exercises, pushCustomExercise),
        pushWithConcurrency(customGroups, pushMenuGroup),
        pushAppSettings(settings),
    ]);

    await processQueue();
}

export function setupOnlineListener(): () => void {
    const handler = () => {
        if (navigator.onLine && getAccountId()) {
            processQueue().then(({ failed }) => {
                if (failed === 0) useSyncStatus.getState().clearFailure();
            }).catch((err) => {
                console.warn('[sync]', err);
                useSyncStatus.getState().reportFailure(String(err));
            });
        }
    };

    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
}
