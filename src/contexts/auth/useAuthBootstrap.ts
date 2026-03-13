import { useCallback, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface UseAuthBootstrapArgs {
    setAuthError: (message: string | null) => void;
    setIsAnonymous: (value: boolean) => void;
    setIsLoading: (value: boolean) => void;
    setUser: (user: User | null) => void;
}

export function useAuthBootstrap({
    setAuthError,
    setIsAnonymous,
    setIsLoading,
    setUser,
}: UseAuthBootstrapArgs) {
    const retryAuth = useCallback(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        setAuthError(null);
        setIsLoading(true);

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                setIsLoading(false);
                return;
            }

            supabase.auth.signInAnonymously().then(({ error }) => {
                if (error) {
                    console.warn('[auth] anonymous sign-in failed:', error);
                    setAuthError('サーバーに接続できませんでした');
                }
                setIsLoading(false);
            });
        }).catch((error) => {
            console.warn('[auth] getSession failed:', error);
            setAuthError('サーバーに接続できませんでした');
            setIsLoading(false);
        });
    }, [setAuthError, setIsLoading, setUser]);

    useEffect(() => {
        retryAuth();

        if (!supabase) {
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const nextUser = session?.user ?? null;
            setUser(nextUser);
            setIsAnonymous(nextUser?.is_anonymous ?? false);
            if (nextUser) {
                setAuthError(null);
            }
        });

        return () => subscription.unsubscribe();
    }, [retryAuth, setAuthError, setIsAnonymous, setUser]);

    return {
        retryAuth,
    };
}
