import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAuthActions } from '../authActions';

const {
    mockedUpdateUser,
    mockedSignUp,
    mockedSignInWithPassword,
    mockedSignInWithOtp,
    mockedVerifyOtp,
    mockedLinkIdentity,
    mockedSignInWithOAuth,
    mockedSignOut,
    mockedSignInAnonymously,
    mockedClearSyncQueue,
} = vi.hoisted(() => ({
    mockedUpdateUser: vi.fn(),
    mockedSignUp: vi.fn(),
    mockedSignInWithPassword: vi.fn(),
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
            updateUser: mockedUpdateUser,
            signUp: mockedSignUp,
            signInWithPassword: mockedSignInWithPassword,
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

    mockedUpdateUser.mockResolvedValue({ error: null });
    mockedSignUp.mockResolvedValue({ error: null });
    mockedSignInWithPassword.mockResolvedValue({ error: null });
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
            setIsAnonymous: vi.fn(),
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
            setIsAnonymous: vi.fn(),
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
            setIsAnonymous: vi.fn(),
            setToastMessage: vi.fn(),
        });

        await actions.verifyEmailAuthCode('parent@example.com', '123456', 'signIn');
        await actions.verifyEmailAuthCode('parent@example.com', '654321', 'signUp');

        expect(mockedVerifyOtp).toHaveBeenNthCalledWith(1, {
            email: 'parent@example.com',
            token: '123456',
            type: 'email',
        });
        expect(mockedVerifyOtp).toHaveBeenNthCalledWith(2, {
            email: 'parent@example.com',
            token: '654321',
            type: 'signup',
        });
    });
});
