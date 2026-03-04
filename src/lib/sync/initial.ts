import { getAllSessions, getCustomExercises } from '../db';
import { getCustomGroups } from '../../data/menuGroups';
import type { UserProfileStore } from '../../store/useAppStore';
import type { AppSettingsInput } from './mappers';
import { getAccountId } from './authState';
import { processQueue } from './queue';
import { pushAppSettings, pushCustomExercise, pushFamilyMember, pushMenuGroup, pushSession } from './push';

export async function initialSync(
    users: UserProfileStore[],
    settings: AppSettingsInput,
): Promise<void> {
    if (!getAccountId()) return;

    for (const user of users) {
        await pushFamilyMember(user);
    }

    const sessions = await getAllSessions();
    for (const session of sessions) {
        await pushSession(session);
    }

    const exercises = await getCustomExercises();
    for (const exercise of exercises) {
        await pushCustomExercise(exercise);
    }

    const groups = await getCustomGroups();
    for (const group of groups) {
        if (!group.isPreset) {
            await pushMenuGroup(group);
        }
    }

    await pushAppSettings(settings);
    await processQueue();

}

export function setupOnlineListener(): () => void {
    const handler = () => {
        if (navigator.onLine && getAccountId()) {
            processQueue().catch(console.warn);
        }
    };

    window.addEventListener('online', handler);
    return () => window.removeEventListener('online', handler);
}
