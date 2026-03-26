import { describe, expect, it } from 'vitest';
import type { SessionRecord } from '../../lib/db';
import {
    buildSessionsByUserId,
    filterSessionsByDate,
    filterSessionsForUsers,
    sessionMatchesAnyUser,
} from './homeSessionPerformanceUtils';

function makeSession(overrides: Partial<SessionRecord> = {}): SessionRecord {
    return {
        id: 'session-1',
        date: '2026-03-26',
        startedAt: '2026-03-26T10:00:00Z',
        totalSeconds: 60,
        exerciseIds: ['S01'],
        skippedIds: [],
        userIds: ['u1'],
        ...overrides,
    };
}

describe('homeSessionPerformanceUtils', () => {
    it('matches sessions without explicit users for any visible user', () => {
        expect(sessionMatchesAnyUser(
            makeSession({ userIds: [] }),
            ['u1'],
        )).toBe(true);
    });

    it('filters sessions to the visible user set once', () => {
        const sessions = filterSessionsForUsers([
            makeSession({ id: 'u1-only', userIds: ['u1'] }),
            makeSession({ id: 'u2-only', userIds: ['u2'] }),
            makeSession({ id: 'shared', userIds: [] }),
        ], ['u1']);

        expect(sessions.map((session) => session.id)).toEqual(['u1-only', 'shared']);
    });

    it('filters sessions by date without touching other days', () => {
        const sessions = filterSessionsByDate([
            makeSession({ id: 'today', date: '2026-03-26' }),
            makeSession({ id: 'yesterday', date: '2026-03-25' }),
        ], '2026-03-26');

        expect(sessions.map((session) => session.id)).toEqual(['today']);
    });

    it('builds per-user session buckets and duplicates shared sessions only for visible users', () => {
        const sessionsByUserId = buildSessionsByUserId([
            makeSession({ id: 'solo-u1', userIds: ['u1'] }),
            makeSession({ id: 'solo-u2', userIds: ['u2'] }),
            makeSession({ id: 'shared', userIds: [] }),
            makeSession({ id: 'mixed', userIds: ['u1', 'u3'] }),
        ], ['u1', 'u2']);

        expect((sessionsByUserId.get('u1') ?? []).map((session) => session.id)).toEqual([
            'solo-u1',
            'shared',
            'mixed',
        ]);
        expect((sessionsByUserId.get('u2') ?? []).map((session) => session.id)).toEqual([
            'solo-u2',
            'shared',
        ]);
        expect(sessionsByUserId.has('u3')).toBe(false);
    });
});
