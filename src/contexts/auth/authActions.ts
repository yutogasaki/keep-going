import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { clearSyncQueue } from '../../lib/sync';
import { SYNCED_ACCOUNT_KEY } from './constants';
import type { EmailAuthMode } from './types';
import { disablePushSubscription } from '../../lib/pushNotifications';

interface CreateAuthActionsParams {
    user: User | null;
    setToastMessage: (message: string | null) => void;
}

export function createAuthActions({ user, setToastMessage }: CreateAuthActionsParams) {
    const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

    // Track whether we used updateUser (anonymous → email link) vs signInWithOtp
    // so verifyEmailAuthCode knows which OTP type to use
    let isLinkingEmail = false;

    const startEmailAuth = async (
        email: string,
        mode: EmailAuthMode,
    ): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        isLinkingEmail = false;

        // Anonymous user signing up → link email to preserve anonymous account data
        if (user?.is_anonymous && mode === 'signUp') {
            const { error } = await supabase.auth.updateUser({ email });
            if (!error) {
                isLinkingEmail = true;
                return { error: null };
            }
            // If email already registered, fall through to regular OTP sign-in
            console.warn('[auth] updateUser (link email) failed, falling back to OTP:', error.message);
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: mode === 'signUp',
            },
        });

        return { error };
    };

    const verifyEmailAuthCode = async (
        email: string,
        code: string,
    ): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        const { error } = await supabase.auth.verifyOtp({
            email,
            token: code,
            type: isLinkingEmail ? 'email_change' : 'email',
        });

        return { error };
    };

    const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        if (user?.is_anonymous) {
            const { error: linkError } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: { redirectTo: emailRedirectTo },
            });

            if (linkError) {
                console.warn('[auth] linkIdentity failed, falling back to signInWithOAuth:', linkError.message);
                const { error: oauthError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: emailRedirectTo },
                });
                return { error: oauthError };
            }

            return { error: linkError };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: emailRedirectTo },
        });
        return { error };
    };

    const signOut = async (): Promise<void> => {
        if (!supabase) return;

        await disablePushSubscription().catch((error) => {
            console.warn('[push] Failed to clean up subscription on sign-out:', error);
        });
        await supabase.auth.signOut();
        await clearSyncQueue();
        localStorage.removeItem(SYNCED_ACCOUNT_KEY);
        // Clear persisted Zustand store so next login starts clean
        localStorage.removeItem('keepgoing-app-state');

        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
            console.warn('[auth] anonymous re-sign-in failed:', error);
            setToastMessage('再接続に失敗しました。アプリを再起動してください。');
            return;
        }

        // Reload to reinitialize app with fresh state
        window.location.reload();
    };

    return {
        startEmailAuth,
        verifyEmailAuthCode,
        signInWithGoogle,
        signOut,
    };
}
