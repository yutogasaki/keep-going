import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setAccountId, initialSync, setupOnlineListener, processQueue } from '../lib/sync';
import { useAppStore } from '../store/useAppStore';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isSyncing: boolean;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const hasSyncedRef = useRef(false);

    // Run initial sync when user logs in
    useEffect(() => {
        if (!user) {
            setAccountId(null);
            hasSyncedRef.current = false;
            return;
        }

        setAccountId(user.id);

        // Only run initial sync once per login
        if (hasSyncedRef.current) return;
        hasSyncedRef.current = true;

        const state = useAppStore.getState();
        setIsSyncing(true);
        initialSync(state.users, {
            onboardingCompleted: state.onboardingCompleted,
            soundVolume: state.soundVolume,
            ttsEnabled: state.ttsEnabled,
            bgmEnabled: state.bgmEnabled,
            hapticEnabled: state.hapticEnabled,
            notificationsEnabled: state.notificationsEnabled,
            notificationTime: state.notificationTime,
        })
            .catch(console.warn)
            .finally(() => setIsSyncing(false));
    }, [user]);

    // Process offline queue when coming back online
    useEffect(() => {
        const cleanup = setupOnlineListener();
        return cleanup;
    }, []);

    // Process queue periodically when logged in
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            processQueue().catch(console.warn);
        }, 60_000); // every minute
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signUp = useCallback(async (email: string, password: string) => {
        if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
        const { error } = await supabase.auth.signUp({ email, password });
        return { error };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (!supabase) return { error: { message: 'Supabase not configured' } as AuthError };
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        return { error };
    }, []);

    const signOut = useCallback(async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, isSyncing, signUp, signIn, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
