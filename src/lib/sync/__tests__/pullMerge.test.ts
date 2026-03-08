import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pullAndMerge } from '../pull';
import { getCustomGroups } from '../../customGroups';
import { getAllSessions, getCustomExercises } from '../../db';
import { isPulling, setPulling } from '../authState';
import { pushCustomExercise, pushFamilyMember, pushMenuGroup, pushSession } from '../push';
import { fetchCloudSyncSnapshot } from '../pullSnapshot';
import { getRegisteredStoreState, setRegisteredStoreState } from '../storeAccess';
import type { UserProfileStore } from '../../../store/useAppStore';

vi.mock('../../supabase', () => ({
    supabase: {},
}));

vi.mock('../../db', () => ({
    getAllSessions: vi.fn(),
    getCustomExercises: vi.fn(),
    saveCustomExerciseDirect: vi.fn(),
    saveSessionDirect: vi.fn(),
}));

vi.mock('../../customGroups', () => ({
    getCustomGroups: vi.fn(),
    saveCustomGroupDirect: vi.fn(),
}));

vi.mock('../authState', () => ({
    isPulling: vi.fn(),
    setPulling: vi.fn(),
}));

vi.mock('../push', () => ({
    pushSession: vi.fn(),
    pushFamilyMember: vi.fn(),
    pushCustomExercise: vi.fn(),
    pushMenuGroup: vi.fn(),
}));

vi.mock('../pullSnapshot', () => ({
    fetchCloudSyncSnapshot: vi.fn(),
    applyCloudSnapshot: vi.fn(),
}));

vi.mock('../storeAccess', () => ({
    getRegisteredStoreState: vi.fn(),
    setRegisteredStoreState: vi.fn(),
}));

const mockedGetAllSessions = vi.mocked(getAllSessions);
const mockedGetCustomExercises = vi.mocked(getCustomExercises);
const mockedGetCustomGroups = vi.mocked(getCustomGroups);
const mockedIsPulling = vi.mocked(isPulling);
const mockedSetPulling = vi.mocked(setPulling);
const mockedPushSession = vi.mocked(pushSession);
const mockedPushFamilyMember = vi.mocked(pushFamilyMember);
const mockedPushCustomExercise = vi.mocked(pushCustomExercise);
const mockedPushMenuGroup = vi.mocked(pushMenuGroup);
const mockedFetchCloudSyncSnapshot = vi.mocked(fetchCloudSyncSnapshot);
const mockedGetRegisteredStoreState = vi.mocked(getRegisteredStoreState);
const mockedSetRegisteredStoreState = vi.mocked(setRegisteredStoreState);

function createUser(id: string): UserProfileStore {
    return {
        id,
        name: `user-${id}`,
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
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

beforeEach(() => {
    vi.clearAllMocks();

    mockedIsPulling.mockReturnValue(false);
    mockedGetAllSessions.mockResolvedValue([]);
    mockedGetCustomExercises.mockResolvedValue([]);
    mockedGetCustomGroups.mockResolvedValue([]);
    mockedPushSession.mockResolvedValue();
    mockedPushFamilyMember.mockResolvedValue();
    mockedPushCustomExercise.mockResolvedValue();
    mockedPushMenuGroup.mockResolvedValue();
    mockedGetRegisteredStoreState.mockReturnValue({
        users: [createUser('u1')],
        sessionUserIds: ['u1'],
        joinedChallengeIds: { u1: ['challenge-a'] },
        onboardingCompleted: true,
        soundVolume: 0.35,
        ttsEnabled: false,
        bgmEnabled: false,
        hapticEnabled: true,
        notificationsEnabled: true,
        notificationTime: '20:15',
    });
});

describe('pullAndMerge', () => {
    it('pushes local users and preserves restored selection when cloud families are empty', async () => {
        mockedFetchCloudSyncSnapshot.mockResolvedValue({
            families: [],
            sessions: [],
            exercises: [],
            groups: [],
            settings: null,
        });

        const result = await pullAndMerge('account-1');

        expect(result).toEqual({ success: true, hadData: false });
        expect(mockedPushFamilyMember).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }));
        expect(mockedSetRegisteredStoreState).toHaveBeenCalledWith(expect.objectContaining({
            users: [expect.objectContaining({ id: 'u1' })],
            sessionUserIds: ['u1'],
            joinedChallengeIds: { u1: ['challenge-a'] },
            onboardingCompleted: true,
            soundVolume: 0.35,
            ttsEnabled: false,
            bgmEnabled: false,
            hapticEnabled: true,
            notificationsEnabled: true,
            notificationTime: '20:15',
        }));
        expect(mockedSetPulling).toHaveBeenNthCalledWith(1, true);
        expect(mockedSetPulling).toHaveBeenLastCalledWith(false);
    });

    it('merges cloud settings while keeping local users when only settings exist in cloud', async () => {
        mockedFetchCloudSyncSnapshot.mockResolvedValue({
            families: [],
            sessions: [],
            exercises: [],
            groups: [],
            settings: {
                onboarding_completed: true,
                sound_volume: 0.8,
                tts_enabled: true,
                bgm_enabled: true,
                haptic_enabled: false,
                notifications_enabled: false,
                notification_time: '19:45',
            } as never,
        });

        const result = await pullAndMerge('account-1');

        expect(result).toEqual({ success: true, hadData: true });
        expect(mockedPushFamilyMember).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1' }));
        expect(mockedSetRegisteredStoreState).toHaveBeenCalledWith(expect.objectContaining({
            users: [expect.objectContaining({ id: 'u1' })],
            sessionUserIds: ['u1'],
            onboardingCompleted: true,
            soundVolume: 0.8,
            ttsEnabled: true,
            bgmEnabled: true,
            hapticEnabled: false,
            notificationsEnabled: false,
            notificationTime: '19:45',
        }));
    });
});
