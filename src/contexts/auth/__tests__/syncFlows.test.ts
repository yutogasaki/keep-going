import { beforeEach, describe, expect, it, vi } from 'vitest';
import { runPostLoginSync, runSettingsLoginSync } from '../syncFlows';
import { getLoginSyncFailureMessage, getLoginSyncSuccessMessage } from '../syncFlowMessages';
import {
    hasCloudData,
    initialSync,
    inspectLoginSyncPlan,
    pullAndMerge,
    restoreFromCloud,
    setAccountId,
    type LoginSyncPlan,
    type SyncDataSummary,
} from '../../../lib/sync';
import { useAppStore } from '../../../store/useAppStore';

vi.mock('../../../lib/sync', () => ({
    hasCloudData: vi.fn(),
    initialSync: vi.fn(),
    inspectLoginSyncPlan: vi.fn(),
    pullAndMerge: vi.fn(),
    restoreFromCloud: vi.fn(),
    setAccountId: vi.fn(),
}));

vi.mock('../../../store/useAppStore', () => ({
    useAppStore: {
        getState: vi.fn(),
    },
}));

const mockedHasCloudData = vi.mocked(hasCloudData);
const mockedInitialSync = vi.mocked(initialSync);
const mockedInspectLoginSyncPlan = vi.mocked(inspectLoginSyncPlan);
const mockedPullAndMerge = vi.mocked(pullAndMerge);
const mockedRestoreFromCloud = vi.mocked(restoreFromCloud);
const mockedSetAccountId = vi.mocked(setAccountId);
const mockedUseAppStore = vi.mocked(useAppStore);

const storage = new Map<string, string>();
const localStorageMock = {
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
        storage.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
        storage.delete(key);
    }),
    clear: vi.fn(() => {
        storage.clear();
    }),
};

vi.stubGlobal('localStorage', localStorageMock);

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

function createPlan(overrides: Partial<LoginSyncPlan> = {}): LoginSyncPlan {
    return {
        kind: 'none',
        localSummary: createSummary(),
        cloudSummary: createSummary(),
        ...overrides,
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    storage.clear();

    mockedHasCloudData.mockImplementation((summary) => (
        summary.users > 0 ||
        summary.sessions > 0 ||
        summary.customExercises > 0 ||
        summary.customGroups > 0 ||
        summary.hasSettings
    ));
    mockedUseAppStore.getState.mockReturnValue({
        users: [],
    } as never);
    mockedInspectLoginSyncPlan.mockResolvedValue(createPlan());
    mockedRestoreFromCloud.mockResolvedValue({
        success: true,
        hadData: true,
    });
    mockedPullAndMerge.mockResolvedValue({
        success: true,
        hadData: true,
    });
    mockedInitialSync.mockResolvedValue();
});

describe('sync flow messages', () => {
    it('formats local merge success and cloud restore failure messages', () => {
        expect(getLoginSyncSuccessMessage({ action: 'merge', resolution: 'local' })).toBe('この端末のデータを同期しました');
        expect(getLoginSyncFailureMessage({ action: 'restore_from_cloud' })).toBe('クラウドのデータ復元に失敗しました');
    });
});

describe('runPostLoginSync', () => {
    it('returns a local push failure with action context during conflict resolution', async () => {
        mockedInspectLoginSyncPlan.mockResolvedValue(createPlan({
            kind: 'conflict',
            localSummary: createSummary({ users: 1 }),
            cloudSummary: createSummary({ users: 1 }),
        }));
        mockedInitialSync.mockRejectedValue(new Error('push failed'));

        const result = await runPostLoginSync({
            accountId: 'account-1',
            resolveConflict: vi.fn().mockResolvedValue('local'),
        });

        expect(mockedSetAccountId).toHaveBeenCalledWith('account-1');
        expect(result.success).toBe(false);
        expect(result.action).toBe('push_local');
        expect(result.resolution).toBe('local');
        expect(result.hadCloudData).toBe(true);
        expect(result.error).toContain('push failed');
        expect(mockedPullAndMerge).not.toHaveBeenCalled();
    });

    it('keeps merge context when pullAndMerge fails after local push', async () => {
        mockedInspectLoginSyncPlan.mockResolvedValue(createPlan({
            kind: 'conflict',
            localSummary: createSummary({ users: 1 }),
            cloudSummary: createSummary({ sessions: 2 }),
        }));
        mockedPullAndMerge.mockResolvedValue({
            success: false,
            error: 'merge failed',
            hadData: true,
        });

        const result = await runPostLoginSync({
            accountId: 'account-1',
            resolveConflict: vi.fn().mockResolvedValue('local'),
        });

        expect(result).toMatchObject({
            success: false,
            action: 'merge',
            resolution: 'local',
            hadCloudData: true,
        });
        expect(result.error).toContain('merge failed');
    });
});

describe('runSettingsLoginSync', () => {
    it('shows an action-aware failure toast instead of a generic error', async () => {
        mockedInspectLoginSyncPlan.mockResolvedValue(createPlan({
            kind: 'restore_from_cloud',
            cloudSummary: createSummary({ users: 2 }),
        }));
        mockedRestoreFromCloud.mockResolvedValue({
            success: false,
            error: 'restore failed',
            hadData: true,
        });

        const setIsSyncing = vi.fn();
        const setToastMessage = vi.fn();
        const setLoginContext = vi.fn();

        await runSettingsLoginSync({
            accountId: 'account-1',
            resolveConflict: vi.fn(),
            setIsSyncing,
            setToastMessage,
            setLoginContext,
        });

        expect(setIsSyncing).toHaveBeenNthCalledWith(1, true);
        expect(setToastMessage).toHaveBeenCalledWith('クラウドのデータ復元に失敗しました');
        expect(setIsSyncing).toHaveBeenLastCalledWith(false);
        expect(setLoginContext).toHaveBeenCalledWith(null);
    });
});
