import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthActions } from '../authActions';

const {
    mockedSignInWithOtp,
    mockedVerifyOtp,
    mockedLinkIdentity,
    mockedSignInWithOAuth,
    mockedSignOut,
    mockedSignInAnonymously,
    mockedClearSyncQueue,
} = vi.hoisted(() => ({
    mockedSignInWithOtp: vi.fn(),
    mockedVerifyOtp: vi.fn(),
    mockedLinkIdentity: vi.fn(),
    mockedSignInWithOAuth: vi.fn(),
    mockedSignOut: vi.fn(),
    mockedSignInAnonymously: vi.fn(),
    mockedClearSyncQueue: vi.fn(),
}));

vi.mock('../../../lib/supabase', () => ({
    supabase: {
        auth: {
            signInWithOtp: mockedSignInWithOtp,
            verifyOtp: mockedVerifyOtp,
            linkIdentity: mockedLinkIdentity,
            signInWithOAuth: mockedSignInWithOAuth,
            signOut: mockedSignOut,
            signInAnonymously: mockedSignInAnonymously,
        },
    },
}));

vi.mock('../../../lib/sync', () => ({
    clearSyncQueue: mockedClearSyncQueue,
}));

beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { location: { origin: 'https://keepgoing.example' } });

    mockedSignInWithOtp.mockResolvedValue({ error: null });
    mockedVerifyOtp.mockResolvedValue({ error: null });
    mockedLinkIdentity.mockResolvedValue({ error: null });
    mockedSignInWithOAuth.mockResolvedValue({ error: null });
    mockedSignOut.mockResolvedValue({ error: null });
    mockedSignInAnonymously.mockResolvedValue({ error: null });
});

describe('createAuthActions', () => {
    it('starts email login without creating a new user', async () => {
        const actions = createAuthActions({
            user: null,
            setToastMessage: vi.fn(),
        });

        await actions.startEmailAuth('parent@example.com', 'signIn');

        expect(mockedSignInWithOtp).toHaveBeenCalledWith({
            email: 'parent@example.com',
            options: {
                shouldCreateUser: false,
                emailRedirectTo: 'https://keepgoing.example',
            },
        });
    });

    it('starts email signup with account creation enabled', async () => {
        const actions = createAuthActions({
            user: null,
            setToastMessage: vi.fn(),
        });

        await actions.startEmailAuth('parent@example.com', 'signUp');

        expect(mockedSignInWithOtp).toHaveBeenCalledWith({
            email: 'parent@example.com',
            options: {
                shouldCreateUser: true,
                emailRedirectTo: 'https://keepgoing.example',
            },
        });
    });

    it('verifies email codes with mode-specific otp types', async () => {
        const actions = createAuthActions({
            user: null,
            setToastMessage: vi.fn(),
        });

        await actions.verifyEmailAuthCode('parent@example.com', '123456');
        await actions.verifyEmailAuthCode('parent@example.com', '654321');

        expect(mockedVerifyOtp).toHaveBeenNthCalledWith(1, {
            email: 'parent@example.com',
            token: '123456',
            type: 'email',
        });
        expect(mockedVerifyOtp).toHaveBeenNthCalledWith(2, {
            email: 'parent@example.com',
            token: '654321',
            type: 'email',
        });
    });
});
