import { describe, expect, it } from 'vitest';
import { buildSyncConflictPrompt, decideLoginSyncPlan, type SyncDataSummary } from '../loginSync';

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

    it('merges when local record data meets cloud settings-only data on a new device', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary({ users: 1, sessions: 3 }),
            cloudSummary: createSummary({ hasSettings: true }),
            alreadySynced: false,
        });

        expect(plan.kind).toBe('merge');
    });

    it('restores from cloud when local only has settings and cloud has record data', () => {
        const plan = decideLoginSyncPlan({
            localSummary: createSummary({ hasSettings: true }),
            cloudSummary: createSummary({ users: 2, sessions: 4 }),
            alreadySynced: false,
        });

        expect(plan.kind).toBe('restore_from_cloud');
    });
});

describe('buildSyncConflictPrompt', () => {
    it('recommends the side with more records and adds human-readable detail lines', () => {
        const prompt = buildSyncConflictPrompt({
            localSummary: createSummary({ users: 1, sessions: 2, customExercises: 1 }),
            cloudSummary: createSummary({ users: 2, sessions: 8, hasSettings: true }),
        });

        expect(prompt.recommendedResolution).toBe('cloud');
        expect(prompt.recommendationReason).toContain('記録が多い');
        expect(prompt.localDetail).toContain('きろく 2回');
        expect(prompt.cloudDetail).toContain('せっていあり');
    });

    it('falls back to a neutral prompt when summaries are effectively tied', () => {
        const prompt = buildSyncConflictPrompt({
            localSummary: createSummary({ users: 1, sessions: 2 }),
            cloudSummary: createSummary({ users: 1, sessions: 2 }),
        });

        expect(prompt.recommendedResolution).toBeNull();
        expect(prompt.recommendationReason).toBeNull();
    });
});
