import { describe, expect, it } from 'vitest';
import type { AdminAccountSummary } from '../../../lib/developer';
import {
    analyzeAccount,
    filterAccountsByType,
} from '../accountSegmentation';

function createAccount(overrides: Partial<AdminAccountSummary> = {}): AdminAccountSummary {
    return {
        accountId: 'account-1',
        members: [
            {
                id: 'member-1',
                name: 'さくら',
                classLevel: '初級',
                avatarUrl: undefined,
                createdAt: '2026-01-01T00:00:00Z',
            },
        ],
        sessions: [],
        streak: 0,
        totalSessions: 0,
        lastActiveDate: null,
        registeredAt: '2026-01-01',
        suspended: false,
        ...overrides,
    };
}

describe('accountSegmentation', () => {
    const now = new Date('2026-03-08T12:00:00+09:00');

    it('keeps recently created accounts out of inactive and suspend buckets for 14 days', () => {
        const analysis = analyzeAccount(createAccount({
            registeredAt: '2026-02-28',
        }), now);

        expect(analysis.isNewGrace).toBe(true);
        expect(analysis.isInactive).toBe(false);
        expect(analysis.isSuspendCandidate).toBe(false);
    });

    it('marks accounts as suspend candidates only after both creation and activity age pass 30 days', () => {
        const watchAccount = createAccount({
            accountId: 'watch',
            registeredAt: '2026-02-10',
            lastActiveDate: '2026-02-20',
            totalSessions: 1,
            sessions: [
                {
                    id: 'session-watch',
                    date: '2026-02-20',
                    startedAt: '2026-02-20T10:00:00Z',
                    totalSeconds: 60,
                    userIds: ['member-1'],
                },
            ],
        });
        const staleAccount = createAccount({
            accountId: 'stale',
            registeredAt: '2026-01-01',
            lastActiveDate: '2026-01-20',
            totalSessions: 1,
            sessions: [
                {
                    id: 'session-stale',
                    date: '2026-01-20',
                    startedAt: '2026-01-20T10:00:00Z',
                    totalSeconds: 60,
                    userIds: ['member-1'],
                },
            ],
        });

        expect(analyzeAccount(watchAccount, now)).toMatchObject({
            isInactive: true,
            isSuspendCandidate: false,
        });
        expect(analyzeAccount(staleAccount, now)).toMatchObject({
            isInactive: true,
            isSuspendCandidate: true,
        });
    });

    it('marks untouched accounts as suspend candidates once they are older than 14 days', () => {
        const analysis = analyzeAccount(createAccount({
            accountId: 'unused',
            registeredAt: '2026-02-10',
            totalSessions: 0,
            lastActiveDate: null,
        }), now);

        expect(analysis).toMatchObject({
            hasNeverStartedRisk: true,
            isSuspendCandidate: true,
        });
        expect(analysis.suspendReasonLabels).toContain('未使用整理候補');
    });

    it('uses the same unused cleanup label for untouched and reroll-like accounts', () => {
        const analysis = analyzeAccount(createAccount({
            accountId: 'reroll',
            registeredAt: '2026-02-10',
            members: [
                {
                    id: 'member-a',
                    name: 'さくら',
                    classLevel: '初級',
                    avatarUrl: undefined,
                    createdAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'member-b',
                    name: 'さくら',
                    classLevel: '初級',
                    avatarUrl: undefined,
                    createdAt: '2026-01-02T00:00:00Z',
                },
            ],
            totalSessions: 0,
            lastActiveDate: null,
        }), now);

        expect(analysis).toMatchObject({
            hasNeverStartedRisk: true,
            isRerollCandidate: true,
            hasUnusedCleanupRisk: true,
        });
        expect(analysis.suspendReasonLabels).toEqual(['未使用整理候補']);
        expect(analysis.memberSignals.every((signal) => signal.cleanupReasonLabels.includes('未使用整理候補'))).toBe(true);
    });

    it('detects duplicate member names and flags unreferenced duplicates as cleanup candidates', () => {
        const account = createAccount({
            members: [
                {
                    id: 'member-a',
                    name: 'さくら',
                    classLevel: '初級',
                    avatarUrl: undefined,
                    createdAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'member-b',
                    name: 'さくら',
                    classLevel: '初級',
                    avatarUrl: undefined,
                    createdAt: '2026-01-05T00:00:00Z',
                },
            ],
            sessions: [
                {
                    id: 'session-1',
                    date: '2026-03-07',
                    startedAt: '2026-03-07T10:00:00Z',
                    totalSeconds: 60,
                    userIds: ['member-a'],
                },
            ],
            totalSessions: 1,
            lastActiveDate: '2026-03-07',
            streak: 1,
        });

        const analysis = analyzeAccount(account, now);

        expect(analysis.hasDuplicateNames).toBe(true);
        expect(analysis.duplicateNames).toEqual(['さくら']);
        expect(analysis.memberSignals.find((signal) => signal.memberId === 'member-a')).toMatchObject({
            hasDuplicateName: true,
            hasNamedSessions: true,
            isCleanupCandidate: false,
        });
        expect(analysis.memberSignals.find((signal) => signal.memberId === 'member-b')).toMatchObject({
            hasDuplicateName: true,
            hasNamedSessions: false,
            isCleanupCandidate: true,
        });
    });

    it('filters accounts by the new developer dashboard strata', () => {
        const newAccount = createAccount({
            accountId: 'new',
            registeredAt: '2026-03-01',
        });
        const unused = createAccount({
            accountId: 'unused',
            registeredAt: '2026-02-10',
            totalSessions: 0,
            lastActiveDate: null,
        });
        const suspendCandidate = createAccount({
            accountId: 'suspend',
            registeredAt: '2026-01-01',
            lastActiveDate: '2026-01-15',
            totalSessions: 1,
            sessions: [
                {
                    id: 'session-suspend',
                    date: '2026-01-15',
                    startedAt: '2026-01-15T10:00:00Z',
                    totalSeconds: 60,
                    userIds: ['member-1'],
                },
            ],
        });
        const duplicate = createAccount({
            accountId: 'duplicate',
            registeredAt: '2026-02-15',
            lastActiveDate: '2026-03-07',
            totalSessions: 1,
            sessions: [
                {
                    id: 'session-duplicate',
                    date: '2026-03-07',
                    startedAt: '2026-03-07T10:00:00Z',
                    totalSeconds: 60,
                    userIds: ['member-c'],
                },
            ],
            members: [
                {
                    id: 'member-c',
                    name: 'ゆい',
                    classLevel: '初級',
                    avatarUrl: undefined,
                    createdAt: '2026-01-01T00:00:00Z',
                },
                {
                    id: 'member-d',
                    name: 'ゆい',
                    classLevel: '初級',
                    avatarUrl: undefined,
                    createdAt: '2026-01-02T00:00:00Z',
                },
            ],
        });

        const accounts = [newAccount, unused, suspendCandidate, duplicate];

        expect(filterAccountsByType(accounts, 'new', now).map((account) => account.accountId)).toEqual(['new']);
        expect(filterAccountsByType(accounts, 'suspend', now).map((account) => account.accountId)).toEqual(['unused', 'suspend']);
        expect(filterAccountsByType(accounts, 'cleanup', now).map((account) => account.accountId)).toEqual(['duplicate']);
        expect(filterAccountsByType(accounts, 'duplicate', now).map((account) => account.accountId)).toEqual(['duplicate']);
    });
});
