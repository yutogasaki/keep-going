import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllSessions, getCustomExercises } from '../../db';
import { getCustomGroups } from '../../customGroups';
import { inspectLoginSyncPlan } from '../loginSync';
import { fetchCloudSyncSnapshot, type CloudSyncSnapshot } from '../pullSnapshot';
import { getRegisteredStoreState } from '../storeAccess';

vi.mock('../../db', () => ({
    getAllSessions: vi.fn(),
    getCustomExercises: vi.fn(),
}));

vi.mock('../../customGroups', () => ({
    getCustomGroups: vi.fn(),
}));

vi.mock('../pullSnapshot', () => ({
    fetchCloudSyncSnapshot: vi.fn(),
}));

vi.mock('../storeAccess', () => ({
    getRegisteredStoreState: vi.fn(),
}));

const mockedGetAllSessions = vi.mocked(getAllSessions);
const mockedGetCustomExercises = vi.mocked(getCustomExercises);
const mockedGetCustomGroups = vi.mocked(getCustomGroups);
const mockedFetchCloudSyncSnapshot = vi.mocked(fetchCloudSyncSnapshot);
const mockedGetRegisteredStoreState = vi.mocked(getRegisteredStoreState);

const EMPTY_SNAPSHOT: CloudSyncSnapshot = {
    families: [],
    sessions: [],
    exercises: [],
    groups: [],
    settings: null,
    challengeEnrollments: [],
};

beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAllSessions.mockResolvedValue([]);
    mockedGetCustomExercises.mockResolvedValue([]);
    mockedGetCustomGroups.mockResolvedValue([]);
    mockedFetchCloudSyncSnapshot.mockResolvedValue(EMPTY_SNAPSHOT);
    mockedGetRegisteredStoreState.mockReturnValue({});
});

describe('inspectLoginSyncPlan', () => {
    it('returns none for a completely empty local and cloud summary', async () => {
        const plan = await inspectLoginSyncPlan('account-1', null);

        expect(plan.kind).toBe('none');
        expect(plan.localSummary).toEqual({
            users: 0,
            sessions: 0,
            customExercises: 0,
            customGroups: 0,
            hasSettings: false,
        });
        expect(plan.cloudSummary).toEqual({
            users: 0,
            sessions: 0,
            customExercises: 0,
            customGroups: 0,
            hasSettings: false,
        });
    });

    it('ignores default local settings when inspecting the local summary', async () => {
        mockedGetRegisteredStoreState.mockReturnValue({
            onboardingCompleted: false,
            soundVolume: 1,
            ttsEnabled: true,
            bgmEnabled: true,
            hapticEnabled: true,
            notificationsEnabled: false,
            notificationTime: '21:00',
            hasSeenSessionControlsHint: false,
        });

        const plan = await inspectLoginSyncPlan('account-1', null);

        expect(plan.localSummary.hasSettings).toBe(false);
        expect(plan.kind).toBe('none');
    });

    it.each([
        ['tts disabled', { ttsEnabled: false }],
        ['bgm disabled', { bgmEnabled: false }],
        ['haptic disabled', { hapticEnabled: false }],
    ])('treats %s as meaningful local settings', async (_label, localState) => {
        mockedGetRegisteredStoreState.mockReturnValue(localState);

        const plan = await inspectLoginSyncPlan('account-1', null);

        expect(plan.localSummary.hasSettings).toBe(true);
        expect(plan.kind).toBe('push_local');
    });

    it('restores when the cloud snapshot only has settings', async () => {
        mockedFetchCloudSyncSnapshot.mockResolvedValue({
            ...EMPTY_SNAPSHOT,
            settings: { soundVolume: 0.4 },
        });

        const plan = await inspectLoginSyncPlan('account-1', null);

        expect(plan.cloudSummary.hasSettings).toBe(true);
        expect(plan.kind).toBe('restore_from_cloud');
    });

    it('merges local records with cloud settings-only data instead of overwriting either side', async () => {
        mockedGetRegisteredStoreState.mockReturnValue({
            users: [{ id: 'user-1', name: 'Aki' }],
        });
        mockedFetchCloudSyncSnapshot.mockResolvedValue({
            ...EMPTY_SNAPSHOT,
            settings: { ttsEnabled: false },
        });

        const plan = await inspectLoginSyncPlan('account-1', null);

        expect(plan.localSummary.users).toBe(1);
        expect(plan.cloudSummary.hasSettings).toBe(true);
        expect(plan.kind).toBe('merge');
    });
});
