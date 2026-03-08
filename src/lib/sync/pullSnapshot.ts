import { clearGroupsDB, saveCustomGroupDirect } from '../customGroups';
import {
    clearCustomExercisesDB,
    clearHistoryDB,
    saveCustomExerciseDirect,
    saveSessionDirect,
    type CustomExercise,
    type SessionRecord,
} from '../db';
import { supabase } from '../supabase';
import type { Database } from '../supabase-types';
import type { MenuGroup } from '../../data/menuGroups';
import {
    toLocalCustomExercise,
    toLocalCustomMenuGroup,
    toLocalSessionRecord,
    toLocalUserFromCloudFamily,
} from './mappers';
import { getRegisteredStoreState, setRegisteredStoreState } from './storeAccess';
import { buildRestoredStoreState, type CloudAppSettings, type LocalStateRecord } from './pullStoreState';

type CloudFamilyMember = Database['public']['Tables']['family_members']['Row'];

export interface CloudSyncSnapshot {
    families: CloudFamilyMember[];
    sessions: SessionRecord[];
    exercises: CustomExercise[];
    groups: MenuGroup[];
    settings: CloudAppSettings | null;
}

function getLocalStateRecord(): LocalStateRecord {
    return (getRegisteredStoreState() ?? {}) as LocalStateRecord;
}

function createEmptySnapshot(): CloudSyncSnapshot {
    return {
        families: [],
        sessions: [],
        exercises: [],
        groups: [],
        settings: null,
    };
}

export async function fetchCloudSyncSnapshot(accountId: string): Promise<CloudSyncSnapshot> {
    if (!supabase) {
        return createEmptySnapshot();
    }

    const [familyRes, sessionsRes, exercisesRes, groupsRes, settingsRes] = await Promise.all([
        supabase.from('family_members').select('*').eq('account_id', accountId),
        supabase.from('sessions').select('*').eq('account_id', accountId),
        supabase.from('custom_exercises').select('*').eq('account_id', accountId),
        supabase.from('menu_groups').select('*').eq('account_id', accountId),
        supabase.from('app_settings').select('*').eq('account_id', accountId).maybeSingle(),
    ]);

    if (familyRes.error) throw new Error(`family_members: ${familyRes.error.message}`);
    if (sessionsRes.error) throw new Error(`sessions: ${sessionsRes.error.message}`);
    if (exercisesRes.error) throw new Error(`custom_exercises: ${exercisesRes.error.message}`);
    if (groupsRes.error) throw new Error(`menu_groups: ${groupsRes.error.message}`);
    if (settingsRes.error) throw new Error(`app_settings: ${settingsRes.error.message}`);

    return {
        families: familyRes.data ?? [],
        sessions: (sessionsRes.data ?? []).map(toLocalSessionRecord),
        exercises: (exercisesRes.data ?? []).map(toLocalCustomExercise),
        groups: (groupsRes.data ?? []).filter((group) => !group.is_preset).map(toLocalCustomMenuGroup),
        settings: settingsRes.data,
    };
}

export async function applyCloudSnapshot(snapshot: CloudSyncSnapshot): Promise<void> {
    const localState = getLocalStateRecord();
    const users = snapshot.families.map((family) => toLocalUserFromCloudFamily(family));

    await Promise.all([clearHistoryDB(), clearCustomExercisesDB(), clearGroupsDB()]);
    await Promise.all(snapshot.sessions.map((record) => saveSessionDirect(record)));
    await Promise.all(snapshot.exercises.map((exercise) => saveCustomExerciseDirect(exercise)));
    await Promise.all(snapshot.groups.map((group) => saveCustomGroupDirect(group)));

    setRegisteredStoreState(
        buildRestoredStoreState({
            localState,
            users,
            settings: snapshot.settings,
        }),
    );
}
