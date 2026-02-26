import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import {
    setAccountId,
    initialSync,
    setupOnlineListener,
    processQueue,
    detectConflict,
    pullAllData,
    mergeAppendData,
    clearSyncQueue,
    type ConflictScenario,
} from '../lib/sync';
import { useAppStore } from '../store/useAppStore';

export type LoginContext = 'onboarding' | 'settings' | null;

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isSyncing: boolean;
    loginContext: LoginContext;
    setLoginContext: (ctx: LoginContext) => void;
    conflictScenario: ConflictScenario | null;
    resolveConflict: (choice: 'cloud' | 'local') => Promise<void>;
    cancelLogin: () => Promise<void>;
    toastMessage: string | null;
    clearToast: () => void;
    signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    signInWithGoogle: () => Promise<{ error: AuthError | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGIN_CONTEXT_KEY = 'keepgoing_login_context';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [loginContext, setLoginContextState] = useState<LoginContext>(() => {
        const saved = sessionStorage.getItem(LOGIN_CONTEXT_KEY);
        if (saved === 'onboarding' || saved === 'settings') return saved;
        return null;
    });
    const [conflictScenario, setConflictScenario] = useState<ConflictScenario | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const hasSyncedRef = useRef(false);

    const setLoginContext = useCallback((ctx: LoginContext) => {
        setLoginContextState(ctx);
        if (ctx) {
            sessionStorage.setItem(LOGIN_CONTEXT_KEY, ctx);
        } else {
            sessionStorage.removeItem(LOGIN_CONTEXT_KEY);
        }
    }, []);

    const clearToast = useCallback(() => setToastMessage(null), []);

    // Auto-dismiss toast after 3 seconds
    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 3000);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    // #10: Auto-dismiss conflict dialog when user logs out
    useEffect(() => {
        if (!user && conflictScenario) {
            setConflictScenario(null);
            setIsSyncing(false);
        }
    }, [user, conflictScenario]);

    // Handle post-login sync for settings-based login
    const handleSettingsLogin = useCallback(async (accountId: string) => {
        setIsSyncing(true);
        try {
            const scenario = await detectConflict(accountId);

            if (scenario === 'conflict') {
                setConflictScenario(scenario);
                // User will choose via resolveConflict - don't clear isSyncing yet
                return;
            }

            if (scenario === 'no_conflict_pull') {
                await pullAllData(accountId);
                await mergeAppendData(accountId);
                setToastMessage('データを復元しました');
            } else if (scenario === 'no_conflict_push') {
                const state = useAppStore.getState();
                await initialSync(state.users, {
                    onboardingCompleted: state.onboardingCompleted,
                    soundVolume: state.soundVolume,
                    ttsEnabled: state.ttsEnabled,
                    bgmEnabled: state.bgmEnabled,
                    hapticEnabled: state.hapticEnabled,
                    notificationsEnabled: state.notificationsEnabled,
                    notificationTime: state.notificationTime,
                });
                // #8: Also merge append-only data on push
                await mergeAppendData(accountId);
                setToastMessage('同期が完了しました');
            }
            // 'nothing' -> no action needed
        } catch (err) {
            console.warn('[auth] handleSettingsLogin failed:', err);
            setToastMessage('同期に失敗しました');
        } finally {
            setIsSyncing(false);
            setLoginContext(null);
        }
    }, [setLoginContext]);

    // Resolve conflict (user chose cloud or local)
    const resolveConflict = useCallback(async (choice: 'cloud' | 'local') => {
        if (!user) return;
        setConflictScenario(null);
        setIsSyncing(true);
        try {
            if (choice === 'cloud') {
                // Pull cloud data, then merge append-only data
                await pullAllData(user.id);
                await mergeAppendData(user.id);
                setToastMessage('クラウドのデータを復元しました');
            } else {
                // Push local to cloud, then merge append-only data (#7: includes exercises & groups)
                const state = useAppStore.getState();
                await initialSync(state.users, {
                    onboardingCompleted: state.onboardingCompleted,
                    soundVolume: state.soundVolume,
                    ttsEnabled: state.ttsEnabled,
                    bgmEnabled: state.bgmEnabled,
                    hapticEnabled: state.hapticEnabled,
                    notificationsEnabled: state.notificationsEnabled,
                    notificationTime: state.notificationTime,
                });
                await mergeAppendData(user.id);
                setToastMessage('このデバイスのデータで同期しました');
            }
        } catch (err) {
            console.warn('[auth] resolveConflict failed:', err);
            setToastMessage('同期に失敗しました');
        } finally {
            setIsSyncing(false);
        }
    }, [user]);

    // Cancel login (when conflict dialog is shown)
    const cancelLogin = useCallback(async () => {
        setConflictScenario(null);
        setIsSyncing(false);
        if (supabase) {
            await supabase.auth.signOut();
        }
    }, []);

    // Run sync when user logs in
    useEffect(() => {
        if (!user) {
            setAccountId(null);
            hasSyncedRef.current = false;
            return;
        }

        setAccountId(user.id);

        if (hasSyncedRef.current) return;
        hasSyncedRef.current = true;

        // #4/#5: Only skip sync for onboarding if actually in onboarding
        const isOnboarding = loginContext === 'onboarding'
            && !useAppStore.getState().onboardingCompleted;

        if (isOnboarding) return;

        // Clean up stale context if onboarding is already completed
        if (loginContext === 'onboarding') {
            setLoginContext(null);
        }

        // For settings-based login (or unknown context), run conflict-aware sync
        handleSettingsLogin(user.id);
    }, [user, loginContext, handleSettingsLogin, setLoginContext]);

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
        }, 60_000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (!supabase) {
            setIsLoading(false);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

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
        await clearSyncQueue();
        setToastMessage('ログアウトしました');
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isSyncing,
            loginContext,
            setLoginContext,
            conflictScenario,
            resolveConflict,
            cancelLogin,
            toastMessage,
            clearToast,
            signUp,
            signIn,
            signInWithGoogle,
            signOut,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
