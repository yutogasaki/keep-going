import { describe, expect, it, vi } from 'vitest';
import { fetchCurrentUserRoleFlags } from '../userRoles';

describe('fetchCurrentUserRoleFlags', () => {
    it('returns false flags when Supabase is not configured', async () => {
        await expect(fetchCurrentUserRoleFlags(null)).resolves.toEqual({
            isTeacher: false,
            isDeveloper: false,
        });
    });

    it('maps both RPC results into role flags', async () => {
        const rpc = vi.fn(async (fn: 'is_teacher' | 'is_developer') => ({
            data: fn === 'is_teacher',
            error: null,
        }));

        await expect(fetchCurrentUserRoleFlags({ rpc })).resolves.toEqual({
            isTeacher: true,
            isDeveloper: false,
        });
        expect(rpc).toHaveBeenNthCalledWith(1, 'is_teacher');
        expect(rpc).toHaveBeenNthCalledWith(2, 'is_developer');
    });

    it('falls back to false when one of the role RPCs fails', async () => {
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const rpc = vi.fn(async (fn: 'is_teacher' | 'is_developer') => ({
            data: fn === 'is_teacher' ? true : null,
            error: fn === 'is_developer' ? { message: 'boom' } : null,
        }));

        await expect(fetchCurrentUserRoleFlags({ rpc })).resolves.toEqual({
            isTeacher: true,
            isDeveloper: false,
        });
        expect(warnSpy).toHaveBeenCalledWith('[userRoles] is_developer failed:', 'boom');

        warnSpy.mockRestore();
    });
});
