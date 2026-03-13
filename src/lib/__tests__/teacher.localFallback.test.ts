import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../supabase', () => ({
    supabase: null,
}));

import { fetchAllStudents, teacherDeleteFamilyMember } from '../teacher';

beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-07T12:00:00+09:00'));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('teacher local fallback', () => {
    it('returns the current account summary from local snapshots when supabase is unavailable', async () => {
        const students = await fetchAllStudents({
            currentAccountId: 'local-account',
            localMembers: [
                {
                    id: 'member-local',
                    name: 'ローカル会員',
                    classLevel: '初級',
                    avatarUrl: 'https://example.com/avatar.png',
                },
            ],
            localSessions: [
                {
                    id: 'session-today',
                    date: '2026-03-07',
                    startedAt: '2026-03-07T12:00:00Z',
                    totalSeconds: 180,
                    userIds: ['member-local'],
                },
                {
                    id: 'session-yesterday',
                    date: '2026-03-06',
                    startedAt: '2026-03-06T12:00:00Z',
                    totalSeconds: 120,
                    userIds: ['member-local'],
                },
            ],
        });

        expect(students).toHaveLength(1);
        expect(students[0]).toMatchObject({
            accountId: 'local-account',
            totalSessions: 2,
            streak: 2,
            lastActiveDate: '2026-03-07',
        });
        expect(students[0].members[0]).toMatchObject({
            id: 'member-local',
            name: 'ローカル会員',
            avatarUrl: 'https://example.com/avatar.png',
        });
    });

    it('throws a clear error when teacher cleanup runs without supabase', async () => {
        await expect(teacherDeleteFamilyMember('member-local')).rejects.toThrow('Supabase not configured');
    });
});
