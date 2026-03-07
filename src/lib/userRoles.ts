import { supabase } from './supabase';

export interface UserRoleFlags {
    isTeacher: boolean;
    isDeveloper: boolean;
}

type RoleRpcName = 'is_teacher' | 'is_developer';

interface RoleRpcClient {
    rpc: (
        fn: RoleRpcName,
    ) => PromiseLike<{
        data: boolean | null;
        error: { message?: string } | null;
    }>;
}

const EMPTY_ROLE_FLAGS: UserRoleFlags = {
    isTeacher: false,
    isDeveloper: false,
};

async function callRoleRpc(client: RoleRpcClient, fn: RoleRpcName): Promise<boolean> {
    const { data, error } = await client.rpc(fn);
    if (error) {
        console.warn(`[userRoles] ${fn} failed:`, error.message ?? error);
        return false;
    }
    return data === true;
}

export async function fetchCurrentUserRoleFlags(
    client: RoleRpcClient | null = supabase,
): Promise<UserRoleFlags> {
    if (!client) return EMPTY_ROLE_FLAGS;

    const [isTeacher, isDeveloper] = await Promise.all([
        callRoleRpc(client, 'is_teacher'),
        callRoleRpc(client, 'is_developer'),
    ]);

    return {
        isTeacher,
        isDeveloper,
    };
}
