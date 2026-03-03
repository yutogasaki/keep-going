import { supabase } from '../supabase';
import {
    getAllSessions,
    getCustomExercises,
    saveCustomExerciseDirect,
    saveSessionDirect,
} from '../db';
import {
    getCustomGroups,
    saveCustomGroupDirect,
} from '../../data/menuGroups';
import {
    toLocalCustomExercise,
    toLocalCustomMenuGroup,
    toLocalSessionRecord,
} from './mappers';
import { pushSession } from './push';

export async function mergeAppendData(accountId: string): Promise<void> {
    if (!supabase || !accountId) return;

    const localSessions = await getAllSessions();
    const { data: cloudSessions } = await supabase
        .from('sessions')
        .select('*')
        .eq('account_id', accountId);

    const cloudSessionIds = new Set((cloudSessions ?? []).map((session: any) => session.id));
    const localSessionIds = new Set(localSessions.map((session) => session.id));

    for (const session of localSessions) {
        if (!cloudSessionIds.has(session.id)) {
            await pushSession(session);
        }
    }

    for (const cloudSession of cloudSessions ?? []) {
        if (!localSessionIds.has(cloudSession.id)) {
            await saveSessionDirect(toLocalSessionRecord(cloudSession));
        }
    }

    const localExercises = await getCustomExercises();
    const { data: cloudExercises } = await supabase
        .from('custom_exercises')
        .select('*')
        .eq('account_id', accountId);

    if (cloudExercises) {
        const localExerciseIds = new Set(localExercises.map((exercise) => exercise.id));
        for (const cloudExercise of cloudExercises) {
            if (!localExerciseIds.has(cloudExercise.id)) {
                await saveCustomExerciseDirect(toLocalCustomExercise(cloudExercise));
            }
        }
    }

    const localGroups = await getCustomGroups();
    const { data: cloudGroups } = await supabase
        .from('menu_groups')
        .select('*')
        .eq('account_id', accountId);

    if (cloudGroups) {
        const localGroupIds = new Set(localGroups.map((group) => group.id));
        for (const cloudGroup of cloudGroups) {
            if (!cloudGroup.is_preset && !localGroupIds.has(cloudGroup.id)) {
                await saveCustomGroupDirect(toLocalCustomMenuGroup(cloudGroup));
            }
        }
    }
}
