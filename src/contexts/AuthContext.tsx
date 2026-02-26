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
    mergeSessions,
    clearSyncQueue,
    hasCloudData,
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
        // Restore from sessionStorage (survives OAuth redirect)
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

    // Handle post-login sync for settings-based login
    const handleSettingsLogin = useCallback(async (accountId: string) => {
        setIsSyncing(true);
        try {
            const scenario = await detectConflict(accountId);

            if (scenario === 'conflict') {
                setConflictScenario(scenario);
                // User will choose via resolveConflict
                return;
            }

            if (scenario === 'no_conflict_pull') {
                await pullAllData(accountId);
                await mergeSessions(accountId);
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
                setToastMessage('同期が完了しました');
            }
            // 'nothing' -> no action needed
        } catch (err) {
            console.warn('[auth] handleSettingsLogin failed:', err);
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
                // Pull cloud data, then merge sessions (local-only sessions get pushed)
                await pullAllData(user.id);
                await mergeSessions(user.id);
                setToastMessage('クラウドのデータを復元しました');
            } else {
                // Push local to cloud, then merge sessions (cloud-only sessions get pulled)
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
                // Pull cloud-only sessions into local
                const { data: cloudSessions } = await (supabase!
                    .from('sessions')
                    .select('*')
                    .eq('account_id', user.id));
                if (cloudSessions) {
                    const { getAllSessions, saveSessionDirect } = await import('../lib/db');
                    const localSessions = await getAllSessions();
                    const localIds = new Set(localSessions.map(s => s.id));
                    for (const cs of cloudSessions) {
                        if (!localIds.has(cs.id)) {
                            await saveSessionDirect({
                                id: cs.id,
                                date: cs.date,
                                startedAt: cs.started_at,
                                totalSeconds: cs.total_seconds,
                                exerciseIds: cs.exercise_ids as string[],
                                skippedIds: cs.skipped_ids as string[],
                                userIds: cs.user_ids as string[],
                            });
                        }
                    }
                }
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

        // If login was initiated from onboarding, don't auto-sync here.
        // The Onboarding component handles pull/push logic itself.
        if (loginContext === 'onboarding') return;

        // For settings-based login (or unknown context), run conflict-aware sync
        handleSettingsLogin(user.id);
    }, [user, loginContext, handleSettingsLogin]);

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
