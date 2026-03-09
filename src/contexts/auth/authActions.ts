import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { clearSyncQueue } from '../../lib/sync';
import { SYNCED_ACCOUNT_KEY } from './constants';
import type { EmailAuthMode } from './types';

interface CreateAuthActionsParams {
    user: User | null;
    setToastMessage: (message: string | null) => void;
}

export function createAuthActions({ user, setToastMessage }: CreateAuthActionsParams) {
    const emailRedirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

    const startEmailAuth = async (
        email: string,
        mode: EmailAuthMode,
    ): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: mode === 'signUp',
                emailRedirectTo,
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
            type: 'email',
        });

        return { error };
    };

    const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        if (user?.is_anonymous) {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: { redirectTo: emailRedirectTo },
            });

            if (error) {
                const { error: oauthError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: emailRedirectTo },
                });
                return { error: oauthError };
            }

            return { error };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: emailRedirectTo },
        });
        return { error };
    };

    const signOut = async (): Promise<void> => {
        if (!supabase) return;

        await supabase.auth.signOut();
        await clearSyncQueue();
        localStorage.removeItem(SYNCED_ACCOUNT_KEY);
        setToastMessage('ログアウトしました');

        supabase.auth.signInAnonymously().then(({ error }) => {
            if (error) {
                console.warn('[auth] anonymous re-sign-in failed:', error);
                setToastMessage('再接続に失敗しました。アプリを再起動してください。');
            }
        });
    };

    return {
        startEmailAuth,
        verifyEmailAuthCode,
        signInWithGoogle,
        signOut,
    };
}
