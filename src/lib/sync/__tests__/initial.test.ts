import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuGroup } from '../../../data/menuGroups';
import type { CustomExercise, SessionRecord } from '../../db';
import type { UserProfileStore } from '../../../store/useAppStore';
import type { AppSettingsInput } from '../mappers';
import { initialSync } from '../initial';
import { getAllSessions, getCustomExercises } from '../../db';
import { getCustomGroups } from '../../customGroups';
import { getAccountId } from '../authState';
import { processQueue } from '../queue';
import {
    pushAppSettings,
    pushCustomExercise,
    pushFamilyMember,
    pushMenuGroup,
    pushSession,
} from '../push';

vi.mock('../../db', () => ({
    getAllSessions: vi.fn(),
    getCustomExercises: vi.fn(),
}));

vi.mock('../../customGroups', () => ({
    getCustomGroups: vi.fn(),
}));

vi.mock('../authState', () => ({
    getAccountId: vi.fn(),
}));

vi.mock('../queue', () => ({
    processQueue: vi.fn(),
}));

vi.mock('../push', () => ({
    pushAppSettings: vi.fn(),
    pushCustomExercise: vi.fn(),
    pushFamilyMember: vi.fn(),
    pushMenuGroup: vi.fn(),
    pushSession: vi.fn(),
}));

vi.mock('../../../store/useSyncStatus', () => ({
    useSyncStatus: {
        getState: () => ({
            clearFailure: vi.fn(),
            reportFailure: vi.fn(),
        }),
    },
}));

function createUser(id: string): UserProfileStore {
    return {
        id,
        name: `user-${id}`,
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-07',
        fuwafuwaType: 1,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: null,
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 10,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        chibifuwas: [],
    };
}

function createSession(id: string): SessionRecord {
    return {
        id,
        date: '2026-03-07',
        startedAt: `2026-03-07T10:00:0${id}Z`,
        totalSeconds: 60,
        exerciseIds: ['S01'],
        skippedIds: [],
        userIds: ['u1'],
    };
}

function createExercise(id: string): CustomExercise {
    return {
        id,
        name: `exercise-${id}`,
        sec: 30,
        emoji: '🩰',
        placement: 'stretch',
    };
}

function createGroup(id: string, isPreset: boolean): MenuGroup {
    return {
        id,
        name: `group-${id}`,
        emoji: '🌸',
        description: 'desc',
        exerciseIds: ['S01'],
        isPreset,
    };
}

function deferred<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
}

const mockedGetAllSessions = vi.mocked(getAllSessions);
const mockedGetCustomExercises = vi.mocked(getCustomExercises);
const mockedGetCustomGroups = vi.mocked(getCustomGroups);
const mockedGetAccountId = vi.mocked(getAccountId);
const mockedProcessQueue = vi.mocked(processQueue);
const mockedPushAppSettings = vi.mocked(pushAppSettings);
const mockedPushCustomExercise = vi.mocked(pushCustomExercise);
const mockedPushFamilyMember = vi.mocked(pushFamilyMember);
const mockedPushMenuGroup = vi.mocked(pushMenuGroup);
const mockedPushSession = vi.mocked(pushSession);

const SETTINGS: AppSettingsInput = {
    onboardingCompleted: true,
    soundVolume: 0.7,
    ttsEnabled: true,
    bgmEnabled: true,
    hapticEnabled: true,
    notificationsEnabled: false,
    notificationTime: '18:00',
};

beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAccountId.mockReturnValue('account-1');
    mockedGetAllSessions.mockResolvedValue([]);
    mockedGetCustomExercises.mockResolvedValue([]);
    mockedGetCustomGroups.mockResolvedValue([]);
    mockedProcessQueue.mockResolvedValue({ failed: 0 });
    mockedPushAppSettings.mockResolvedValue();
    mockedPushCustomExercise.mockResolvedValue();
    mockedPushFamilyMember.mockResolvedValue();
    mockedPushMenuGroup.mockResolvedValue();
    mockedPushSession.mockResolvedValue();
});

describe('initialSync', () => {
    it('returns early when no account is linked', async () => {
        mockedGetAccountId.mockReturnValue(null);

        await initialSync([createUser('u1')], SETTINGS);

        expect(mockedGetAllSessions).not.toHaveBeenCalled();
        expect(mockedPushFamilyMember).not.toHaveBeenCalled();
        expect(mockedPushAppSettings).not.toHaveBeenCalled();
        expect(mockedProcessQueue).not.toHaveBeenCalled();
    });

    it('pushes all resources and skips preset groups', async () => {
        const users = [createUser('u1'), createUser('u2')];
        const sessions = [createSession('1'), createSession('2')];
        const exercises = [createExercise('ex-1')];
        const groups = [createGroup('preset', true), createGroup('custom', false)];

        mockedGetAllSessions.mockResolvedValue(sessions);
        mockedGetCustomExercises.mockResolvedValue(exercises);
        mockedGetCustomGroups.mockResolvedValue(groups);

        await initialSync(users, SETTINGS);

        expect(mockedPushFamilyMember).toHaveBeenCalledTimes(2);
        expect(mockedPushSession).toHaveBeenCalledTimes(2);
        expect(mockedPushCustomExercise).toHaveBeenCalledTimes(1);
        expect(mockedPushMenuGroup).toHaveBeenCalledTimes(1);
        expect(mockedPushMenuGroup).toHaveBeenCalledWith(groups[1]);
        expect(mockedPushAppSettings).toHaveBeenCalledWith(SETTINGS);
        expect(mockedProcessQueue).toHaveBeenCalledTimes(1);
    });

    it('starts resource pushes without waiting for an earlier category item to finish', async () => {
        const users = [createUser('u1'), createUser('u2')];
        const sessions = [createSession('1')];
        const exercises = [createExercise('ex-1')];
        const groups = [createGroup('custom', false)];
        const firstFamilyGate = deferred<void>();
        const events: string[] = [];

        mockedGetAllSessions.mockResolvedValue(sessions);
        mockedGetCustomExercises.mockResolvedValue(exercises);
        mockedGetCustomGroups.mockResolvedValue(groups);
        mockedPushFamilyMember.mockImplementation(async (user) => {
            events.push(`family:${user.id}:start`);
            if (user.id === 'u1') {
                await firstFamilyGate.promise;
            }
            events.push(`family:${user.id}:end`);
        });
        mockedPushSession.mockImplementation(async () => {
            events.push('session:start');
        });
        mockedPushCustomExercise.mockImplementation(async () => {
            events.push('exercise:start');
        });
        mockedPushMenuGroup.mockImplementation(async () => {
            events.push('group:start');
        });
        mockedPushAppSettings.mockImplementation(async () => {
            events.push('settings:start');
        });

        const syncPromise = initialSync(users, SETTINGS);
        await Promise.resolve();
        await Promise.resolve();

        expect(events).toContain('family:u1:start');
        expect(events).toContain('family:u2:start');
        expect(events).toContain('session:start');
        expect(events).toContain('exercise:start');
        expect(events).toContain('group:start');
        expect(events).toContain('settings:start');
        expect(mockedProcessQueue).not.toHaveBeenCalled();

        firstFamilyGate.resolve();
        await syncPromise;

        expect(mockedProcessQueue).toHaveBeenCalledTimes(1);
    });
});
