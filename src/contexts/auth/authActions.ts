import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { clearSyncQueue } from '../../lib/sync';
import { SYNCED_ACCOUNT_KEY } from './constants';

interface CreateAuthActionsParams {
    user: User | null;
    setIsAnonymous: (value: boolean) => void;
    setToastMessage: (message: string | null) => void;
}

export function createAuthActions({ user, setIsAnonymous, setToastMessage }: CreateAuthActionsParams) {
    const signUp = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        if (user?.is_anonymous) {
            const { error } = await supabase.auth.updateUser({ email, password });
            if (!error) {
                setIsAnonymous(false);
            }
            return { error };
        }

        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    };

    const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    };

    const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
        if (!supabase) {
            return { error: { message: 'Supabase not configured' } as AuthError };
        }

        const redirectTo = window.location.origin;

        if (user?.is_anonymous) {
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: { redirectTo },
            });

            if (error) {
                const { error: oauthError } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo },
                });
                return { error: oauthError };
            }

            return { error };
        }

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo },
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
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
    };
}
