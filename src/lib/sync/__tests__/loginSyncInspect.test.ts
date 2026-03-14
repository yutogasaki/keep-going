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
});
