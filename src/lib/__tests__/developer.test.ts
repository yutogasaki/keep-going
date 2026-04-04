import { describe, expect, it } from 'vitest';
import { computeFuwafuwaTypeStats, type AdminAccountSummary } from '../developer';

function makeAccount(
    accountId: string,
    members: AdminAccountSummary['members'],
): AdminAccountSummary {
    return {
        accountId,
        members,
        sessions: [],
        streak: 0,
        totalSessions: 0,
        lastActiveDate: null,
        registeredAt: null,
        suspended: false,
    };
}

describe('computeFuwafuwaTypeStats', () => {
    it('groups current fuwafuwa types across all members', () => {
        const summary = computeFuwafuwaTypeStats([
            makeAccount('acc-1', [
                {
                    id: 'm1',
                    name: 'A',
                    classLevel: '初級',
                    createdAt: '2026-04-01',
                    fuwafuwaType: 2,
                },
                {
                    id: 'm2',
                    name: 'B',
                    classLevel: '中級',
                    createdAt: '2026-04-01',
                    fuwafuwaType: 2,
                },
            ]),
            makeAccount('acc-2', [
                {
                    id: 'm3',
                    name: 'C',
                    classLevel: '上級',
                    createdAt: '2026-04-02',
                    fuwafuwaType: 5,
                },
            ]),
        ]);

        expect(summary.totalMembers).toBe(3);
        expect(summary.typesInUse).toBe(2);
        expect(summary.topType).toBe(2);
        expect(summary.topTypeMemberCount).toBe(2);
        expect(summary.topTypeShare).toBeCloseTo(2 / 3);
        expect(summary.stats.map((stat) => [stat.type, stat.memberCount, stat.accountCount])).toEqual([
            [2, 2, 1],
            [5, 1, 1],
        ]);
    });

    it('tracks unassigned members separately', () => {
        const summary = computeFuwafuwaTypeStats([
            makeAccount('acc-1', [
                {
                    id: 'm1',
                    name: 'A',
                    classLevel: '初級',
                    createdAt: '2026-04-01',
                    fuwafuwaType: null,
                },
                {
                    id: 'm2',
                    name: 'B',
                    classLevel: '中級',
                    createdAt: '2026-04-01',
                    fuwafuwaType: 4,
                },
            ]),
        ]);

        expect(summary.totalMembers).toBe(2);
        expect(summary.typesInUse).toBe(1);
        expect(summary.unassignedMembers).toBe(1);
        expect(summary.stats.map((stat) => stat.type)).toEqual([4, null]);
    });
});
