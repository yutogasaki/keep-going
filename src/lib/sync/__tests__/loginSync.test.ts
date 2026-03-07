import { describe, expect, it } from 'vitest';
import { decideLoginSyncPlan, type SyncDataSummary } from '../loginSync';

function createSummary(overrides: Partial<SyncDataSummary> = {}): SyncDataSummary {
    return {
        users: 0,
        sessions: 0,
        customExercises: 0,
        customGroups: 0,
        hasSettings: false,
        ...overrides,
    };
}

describe('decideLoginSyncPlan', () => {
    it('returns none when neither side has data', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary(),
            cloudSummary: createSummary(),
            alreadySynced: false,
        });

        expect(plan.kind).toBe('none');
    });

    it('restores from cloud when only cloud has data', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary(),
            cloudSummary: createSummary({ users: 2, sessions: 8 }),
            alreadySynced: false,
        });

        expect(plan.kind).toBe('restore_from_cloud');
    });

    it('pushes local data when only local has data', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary({ users: 1, sessions: 3 }),
            cloudSummary: createSummary(),
            alreadySynced: false,
        });

        expect(plan.kind).toBe('push_local');
    });

    it('requests resolution when both sides have data and the account is new to this device', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary({ users: 1 }),
            cloudSummary: createSummary({ users: 1, hasSettings: true }),
            alreadySynced: false,
        });

        expect(plan.kind).toBe('conflict');
    });

    it('merges automatically when the account has already been synced on this device', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary({ users: 1, customGroups: 2 }),
            cloudSummary: createSummary({ users: 1, sessions: 4 }),
            alreadySynced: true,
        });

        expect(plan.kind).toBe('merge');
    });
});
